import type { AxiosInstance } from "axios";
import type { Socket } from "socket.io-client";
import { env } from "@/config/env";
import { filesApi } from "./api";
import { languageFromPath } from "./languages";
import { monaco } from "./monaco";

export type SaveState = "idle" | "saved" | "dirty" | "saving" | "error";

export interface EditorSnapshot {
  path: string | null;
  language: string;
  saveState: SaveState;
  opening: boolean;
  lastSavedAt: Date | null;
}

interface WireChange {
  range: monaco.IRange;
  rangeOffset: number;
  rangeLength: number;
  text: string;
}

const isUnder = (path: string, parent: string) => path === parent || path.startsWith(parent + "/");
const uriFor = (path: string) => monaco.Uri.parse(`file:///${path}`);

/**
 * Owns the Monaco editor for one workspace tab:
 *  - loads files from the API and keeps one model per file,
 *  - relays local edits to collaborators (API hub) and to the live runtime,
 *  - applies collaborators' edits without echoing them back,
 *  - autosaves to storage.
 */
export class EditorSession {
  private editor: monaco.editor.IStandaloneCodeEditor | null = null;
  private collab: Socket | null = null;
  private runtime: Socket | null = null;
  private runtimeHttp: AxiosInstance | null = null;
  private applyingRemote = false;
  private dirty = false;
  private saveTimer: ReturnType<typeof setTimeout> | undefined;
  private saving: Promise<void> | null = null;
  private openToken = 0;
  private disposables: monaco.IDisposable[] = [];
  private listeners = new Set<() => void>();
  private state: EditorSnapshot = {
    path: null,
    language: "plaintext",
    saveState: "idle",
    opening: false,
    lastSavedAt: null,
  };

  // ── React bindings ───────────────────────────────────────────────────────────────
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  getSnapshot = () => this.state;

  private update(patch: Partial<EditorSnapshot>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l());
  }

  // ── Wiring ───────────────────────────────────────────────────────────────────────
  attachEditor(editor: monaco.editor.IStandaloneCodeEditor) {
    this.disposables.forEach((d) => d.dispose());
    this.editor = editor;
    this.disposables = [
      editor.onDidChangeModelContent((event) => this.handleLocalChange(event)),
      editor.addAction({
        id: "nimbus.save",
        label: "Save file",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
        run: () => void this.save(),
      }),
    ];
    if (this.state.path) editor.setModel(monaco.editor.getModel(uriFor(this.state.path)));
  }

  detachEditor() {
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
    this.editor = null;
  }

  private onCollabConnect = () => {
    if (this.state.path) this.collab?.emit("file:open", { path: this.state.path });
  };
  private onRemoteChanges = ({ path, changes }: { path: string; changes: WireChange[] }) => {
    this.applyRemoteChanges(path, changes);
  };

  setCollabSocket(socket: Socket | null) {
    this.collab?.off("connect", this.onCollabConnect);
    this.collab?.off("doc:changes", this.onRemoteChanges);
    this.collab = socket;
    socket?.on("connect", this.onCollabConnect);
    socket?.on("doc:changes", this.onRemoteChanges);
    if (socket?.connected) this.onCollabConnect();
  }

  setRuntime(socket: Socket | null, http: AxiosInstance | null) {
    this.runtime = socket;
    this.runtimeHttp = http;
    // A (re)started runtime may hold an older copy of the open file — push ours.
    if (http && this.state.path && this.model()) {
      void this.syncToRuntime(this.state.path, this.model()!.getValue());
    }
  }

  private model(): monaco.editor.ITextModel | null {
    return this.state.path ? monaco.editor.getModel(uriFor(this.state.path)) : null;
  }

  private syncToRuntime(path: string, content: string) {
    return this.runtimeHttp?.put("/fs/file", { path, content }).catch((err) => {
      console.warn("⚠️ Couldn't sync file to runtime:", err);
    });
  }

  private withRemote(fn: () => void) {
    this.applyingRemote = true;
    try {
      fn();
    } finally {
      this.applyingRemote = false;
    }
  }

  // ── Opening / closing ───────────────────────────────────────────────────────────
  async open(path: string) {
    if (path === this.state.path) return;
    const token = ++this.openToken;
    await this.flush();
    this.update({ opening: true });

    try {
      const content = await filesApi.read(path);
      if (token !== this.openToken) return; // a newer open() won the race

      const language = languageFromPath(path);
      const uri = uriFor(path);
      let model = monaco.editor.getModel(uri);
      if (!model) {
        model = monaco.editor.createModel(content, language, uri);
      } else if (model.getValue() !== content) {
        this.withRemote(() => model!.setValue(content));
      }

      this.withRemote(() => this.editor?.setModel(model));
      this.dirty = false;
      this.update({ path, language, saveState: "saved", opening: false });
      this.collab?.emit("file:open", { path });
      void this.syncToRuntime(path, content);
      this.editor?.focus();
    } catch (err) {
      if (token === this.openToken) this.update({ opening: false });
      throw err;
    }
  }

  async close() {
    await this.flush();
    this.openToken++;
    this.collab?.emit("file:close");
    this.withRemote(() => this.editor?.setModel(null));
    this.dirty = false;
    this.update({ path: null, saveState: "idle", opening: false });
  }

  // ── Edits ───────────────────────────────────────────────────────────────────────
  private handleLocalChange(event: monaco.editor.IModelContentChangedEvent) {
    const path = this.state.path;
    if (this.applyingRemote || !path || this.editor?.getModel() !== this.model()) return;

    const changes: WireChange[] = event.changes.map((c) => ({
      range: c.range,
      rangeOffset: c.rangeOffset,
      rangeLength: c.rangeLength,
      text: c.text,
    }));
    this.collab?.emit("doc:changes", { path, changes });
    this.runtime?.emit("editor:changes", { path, changes });
    this.markDirty();
  }

  private applyRemoteChanges(path: string, changes: WireChange[]) {
    const model = this.model();
    if (path !== this.state.path || !model) return;
    // The sender already forwarded these to the runtime, so they're not re-emitted.
    this.withRemote(() =>
      model.applyEdits(changes.map((c) => ({ range: c.range, text: c.text, forceMoveMarkers: true })))
    );
  }

  /** A file changed in the runtime (terminal, formatter, git…). */
  applyExternalContent(path: string, content: string): "updated" | "conflict" | "ignored" {
    const model = this.model();
    if (path !== this.state.path || !model || model.getValue() === content) return "ignored";
    if (this.dirty) return "conflict";
    this.withRemote(() =>
      model.pushEditOperations([], [{ range: model.getFullModelRange(), text: content }], () => null)
    );
    return "updated";
  }

  handleRenamed(oldPath: string, newPath: string) {
    const current = this.state.path;
    if (!current || !isUnder(current, oldPath)) return;
    const nextPath = newPath + current.slice(oldPath.length);
    const oldModel = this.model()!;
    const model = monaco.editor.createModel(oldModel.getValue(), languageFromPath(nextPath), uriFor(nextPath));
    this.withRemote(() => this.editor?.setModel(model));
    oldModel.dispose();
    this.update({ path: nextPath, language: languageFromPath(nextPath) });
    this.collab?.emit("file:open", { path: nextPath });
  }

  handleDeleted(path: string) {
    for (const model of monaco.editor.getModels()) {
      if (isUnder(model.uri.path.slice(1), path)) {
        if (model === this.model()) {
          this.dirty = false;
          clearTimeout(this.saveTimer);
          this.collab?.emit("file:close");
          this.withRemote(() => this.editor?.setModel(null));
          this.update({ path: null, saveState: "idle" });
        }
        model.dispose();
      }
    }
  }

  // ── Saving ──────────────────────────────────────────────────────────────────────
  private markDirty() {
    this.dirty = true;
    if (this.state.saveState !== "saving") this.update({ saveState: "dirty" });
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => void this.save(), env.autosaveDelayMs);
  }

  async save(): Promise<void> {
    clearTimeout(this.saveTimer);
    if (this.saving) await this.saving;
    const path = this.state.path;
    const model = this.model();
    if (!path || !model || !this.dirty) return;

    const content = model.getValue();
    this.dirty = false;
    this.update({ saveState: "saving" });

    this.saving = filesApi
      .write(path, content)
      .then(() => {
        this.collab?.emit("doc:saved", { path });
        if (path === this.state.path) {
          this.update({ saveState: this.dirty ? "dirty" : "saved", lastSavedAt: new Date() });
        }
      })
      .catch((err) => {
        console.error("❌ Save failed:", err);
        this.dirty = true;
        this.update({ saveState: "error" });
        this.saveTimer = setTimeout(() => void this.save(), 5000);
      })
      .finally(() => {
        this.saving = null;
      });
    await this.saving;
  }

  /** Saves pending edits right away (before switching files, unloading…). */
  flush() {
    return this.save();
  }

  get hasUnsavedChanges() {
    return this.dirty || this.state.saveState === "saving";
  }

  dispose() {
    clearTimeout(this.saveTimer);
    this.setCollabSocket(null);
    this.detachEditor();
    monaco.editor.getModels().forEach((m) => m.dispose());
  }
}
