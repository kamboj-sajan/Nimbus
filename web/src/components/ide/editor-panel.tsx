import Editor from "@monaco-editor/react";
import { AlertTriangle, Check, ChevronRight, CircleDot, FileCode2, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useWorkspace } from "@/contexts/workspace";
import { languageLabel } from "@/lib/languages";
import { EDITOR_THEME } from "@/lib/monaco";
import type { SaveState } from "@/lib/editor-session";
import { cn } from "@/lib/utils";
import { FileIcon } from "./file-icon";

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "idle") return null;
  const map = {
    saved: { icon: Check, text: "Saved", className: "text-emerald-400" },
    dirty: { icon: CircleDot, text: "Unsaved", className: "text-amber-300" },
    saving: { icon: Loader2, text: "Saving…", className: "text-muted-foreground" },
    error: { icon: AlertTriangle, text: "Save failed — retrying", className: "text-destructive" },
  } as const;
  const { icon: Icon, text, className } = map[state];
  return (
    <span className={cn("flex items-center gap-1 text-[11px]", className)}>
      <Icon className={cn("size-3", state === "saving" && "animate-spin")} />
      {text}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sky-400 to-purple-500 opacity-30 blur-xl" />
        <div className="relative flex size-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
          <FileCode2 className="size-7 text-primary" />
        </div>
      </div>
      <h2 className="mb-1.5 text-lg font-semibold">No file open</h2>
      <p className="max-w-xs text-sm text-muted-foreground">
        Pick a file from the explorer to start editing. Changes save automatically and sync live to your
        other tabs and the terminal.
      </p>
      <div className="mt-6 flex gap-4 text-xs text-muted-foreground/80">
        <span>
          <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[11px]">⌘/Ctrl S</kbd>{" "}
          save
        </span>
        <span>
          <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[11px]">⌘/Ctrl B</kbd>{" "}
          toggle explorer
        </span>
      </div>
    </div>
  );
}

export default function EditorPanel() {
  const { editor, editorState } = useWorkspace();
  const { path, language, saveState, opening } = editorState;
  const segments = path?.split("/") ?? [];

  useEffect(() => () => editor.detachEditor(), [editor]);

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-white/[0.07] bg-ide-surface shadow-xl shadow-black/30">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-white/[0.06] bg-ide-bar px-3">
        {path ? (
          <>
            <FileIcon name={segments[segments.length - 1]!} className="size-3.5" />
            <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden text-[12px]" aria-label="File path">
              {segments.map((segment, i) => (
                <span key={i} className="flex min-w-0 items-center gap-1">
                  {i > 0 && <ChevronRight className="size-3 shrink-0 text-muted-foreground/60" />}
                  <span className={cn("truncate", i === segments.length - 1 ? "font-medium text-foreground" : "text-muted-foreground")}>
                    {segment}
                  </span>
                </span>
              ))}
            </nav>
            <SaveIndicator state={saveState} />
            <span className="rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary">
              {languageLabel(language)}
            </span>
          </>
        ) : (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Editor</span>
        )}
      </div>

      <div className="relative min-h-0 flex-1">
        {/* The editor stays mounted so models, undo history and view state survive file switches. */}
        <div className={cn("absolute inset-0", !path && "invisible")}>
          <Editor
            theme={EDITOR_THEME}
            onMount={(instance) => editor.attachEditor(instance)}
            loading={<Loader2 className="size-5 animate-spin text-primary" />}
            options={{
              fontSize: 14,
              fontFamily: '"JetBrains Mono", Menlo, monospace',
              fontLigatures: true,
              lineHeight: 22,
              padding: { top: 14 },
              minimap: { enabled: false },
              wordWrap: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              smoothScrolling: true,
              renderLineHighlight: "all",
              bracketPairColorization: { enabled: true },
              stickyScroll: { enabled: true },
            }}
          />
        </div>
        {!path && <EmptyState />}
        {opening && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-ide-surface/80 backdrop-blur-sm">
            <div className="flex animate-fade-in items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" />
              Opening file…
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
