import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { Socket } from "socket.io-client";
import { toast } from "sonner";
import { useCollabSocket } from "@/hooks/use-collab-socket";
import { useRuntime, type RuntimeHandle } from "@/hooks/use-runtime";
import { filesApi, type EntryType, type FileNode } from "@/lib/api";
import { EditorSession, type EditorSnapshot } from "@/lib/editor-session";
import type { Session } from "@/lib/session";
import { errorMessage } from "@/lib/utils";

interface WorkspaceContextValue {
  session: Session;
  tree: FileNode[];
  treeStatus: "pending" | "error" | "success";
  refreshTree: () => Promise<unknown>;
  expanded: Set<string>;
  toggleExpanded: (path: string) => void;
  collapseAll: () => void;

  runtime: RuntimeHandle;
  collab: { socket: Socket | null; connected: boolean };

  editor: EditorSession;
  editorState: EditorSnapshot;
  openFile: (path: string) => Promise<void>;

  createEntry: (path: string, type: EntryType) => Promise<void>;
  renameEntry: (node: FileNode, newName: string) => Promise<void>;
  deleteEntry: (node: FileNode) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return ctx;
}

const parentOf = (path: string) => (path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "");

/** Runs async tasks one at a time (keeps bursts of watcher events from racing). */
function createQueue() {
  let tail = Promise.resolve();
  return (task: () => Promise<unknown>) => {
    tail = tail.then(task).then(
      () => undefined,
      (err) => console.warn("⚠️ Sync task failed:", err)
    );
  };
}

export function WorkspaceProvider({ session, children }: { session: Session; children: ReactNode }) {
  const queryClient = useQueryClient();
  const runtime = useRuntime(session.token);
  const collab = useCollabSocket(session.token);
  const [editor] = useState(() => new EditorSession());
  const editorState = useSyncExternalStore(editor.subscribe, editor.getSnapshot);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const syncQueue = useRef(createQueue()).current;

  const treeQuery = useQuery({ queryKey: ["tree"], queryFn: filesApi.tree });
  const { refetch: refetchTree } = treeQuery;

  // Coalesce bursts (npm install, git clone…) into one refetch.
  const refreshTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const scheduleTreeRefresh = useCallback(() => {
    clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => void queryClient.invalidateQueries({ queryKey: ["tree"] }), 250);
  }, [queryClient]);

  useEffect(() => () => editor.dispose(), [editor]);
  useEffect(() => editor.setCollabSocket(collab.socket), [editor, collab.socket]);
  useEffect(() => editor.setRuntime(runtime.socket, runtime.http), [editor, runtime.socket, runtime.http]);

  // Other tabs changed the tree through the API.
  useEffect(() => {
    const socket = collab.socket;
    if (!socket) return;
    socket.on("tree:changed", scheduleTreeRefresh);
    return () => void socket.off("tree:changed", scheduleTreeRefresh);
  }, [collab.socket, scheduleTreeRefresh]);

  // Changes made inside the runtime (terminal, tools) → persist to storage.
  useEffect(() => {
    const socket = runtime.socket;
    if (!socket) return;
    const socketId = () => collab.socket?.id;

    const onAdd = (e: { path: string; type: EntryType; content?: string }) =>
      syncQueue(async () => {
        await filesApi.create(e.path, e.type, e.content, socketId());
        scheduleTreeRefresh();
      });
    const onChange = (e: { path: string; content: string }) =>
      syncQueue(async () => {
        await filesApi.write(e.path, e.content);
        if (editor.applyExternalContent(e.path, e.content) === "conflict") {
          toast.warning(`${e.path} changed in the terminal`, {
            description: "Your unsaved edits will overwrite it when saved.",
          });
        }
      });
    const onRemove = (e: { path: string; type: EntryType }) =>
      syncQueue(async () => {
        await filesApi.remove(e.path, e.type, socketId()).catch((err) => {
          if (!isAxiosError(err) || err.response?.status !== 404) throw err;
        });
        editor.handleDeleted(e.path);
        scheduleTreeRefresh();
      });

    socket.on("fs:add", onAdd);
    socket.on("fs:change", onChange);
    socket.on("fs:remove", onRemove);
    return () => {
      socket.off("fs:add", onAdd);
      socket.off("fs:change", onChange);
      socket.off("fs:remove", onRemove);
    };
  }, [runtime.socket, collab.socket, editor, syncQueue, scheduleTreeRefresh]);

  // Last-chance save, and a prompt if something is still in flight.
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!editor.hasUnsavedChanges) return;
      void editor.flush();
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [editor]);

  const toggleExpanded = useCallback((path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const expandTo = useCallback((path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      const parts = path.split("/");
      for (let i = 1; i <= parts.length; i++) next.add(parts.slice(0, i).join("/"));
      return next;
    });
  }, []);

  const openFile = useCallback(
    async (path: string) => {
      try {
        await editor.open(path);
      } catch (err) {
        toast.error("Couldn't open file", { description: errorMessage(err) });
      }
    },
    [editor]
  );

  const createEntry = useCallback(
    async (path: string, type: EntryType) => {
      await filesApi.create(path, type, type === "file" ? "" : undefined, collab.socket?.id);
      runtime.http?.post("/fs/entry", { path, type }).catch((err) => console.warn("⚠️ Runtime create failed:", err));
      await refetchTree();
      const parent = type === "folder" ? path : parentOf(path);
      if (parent) expandTo(parent);
      if (type === "file") await openFile(path);
    },
    [collab.socket, runtime.http, refetchTree, expandTo, openFile]
  );

  const renameEntry = useCallback(
    async (node: FileNode, newName: string) => {
      const result = await filesApi.rename(node.path, newName, collab.socket?.id);
      runtime.http
        ?.patch("/fs/entry", { path: node.path, newPath: result.path })
        .catch((err) => console.warn("⚠️ Runtime rename failed:", err));
      editor.handleRenamed(node.path, result.path);
      if (expanded.has(node.path)) expandTo(result.path);
      await refetchTree();
    },
    [collab.socket, runtime.http, editor, expanded, expandTo, refetchTree]
  );

  const deleteEntry = useCallback(
    async (node: FileNode) => {
      await filesApi.remove(node.path, node.type, collab.socket?.id);
      runtime.http
        ?.delete("/fs/entry", { data: { path: node.path } })
        .catch((err) => console.warn("⚠️ Runtime delete failed:", err));
      editor.handleDeleted(node.path);
      await refetchTree();
    },
    [collab.socket, runtime.http, editor, refetchTree]
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      session,
      tree: treeQuery.data ?? [],
      treeStatus: treeQuery.status,
      refreshTree: refetchTree,
      expanded,
      toggleExpanded,
      collapseAll: () => setExpanded(new Set()),
      runtime,
      collab,
      editor,
      editorState,
      openFile,
      createEntry,
      renameEntry,
      deleteEntry,
    }),
    [
      session, treeQuery.data, treeQuery.status, refetchTree, expanded, toggleExpanded, runtime,
      collab, editor, editorState, openFile, createEntry, renameEntry, deleteEntry,
    ]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
