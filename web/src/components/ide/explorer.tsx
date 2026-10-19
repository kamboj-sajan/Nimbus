import { useState } from "react";
import { FilePlus, FolderMinus, FolderPlus, FolderTree, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/contexts/workspace";
import type { EntryType, FileNode } from "@/lib/api";
import { errorMessage } from "@/lib/utils";
import { CreateEntryDialog, DeleteEntryDialog } from "./entry-dialogs";
import { FileTree } from "./file-tree";
import Panel, { PanelAction } from "./panel";

export default function Explorer() {
  const { session, tree, treeStatus, refreshTree, collapseAll, createEntry, deleteEntry } = useWorkspace();
  const [creating, setCreating] = useState<{ parentPath: string; type: EntryType } | null>(null);
  const [deleting, setDeleting] = useState<FileNode | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const requestCreate = (parentPath: string, type: EntryType) => setCreating({ parentPath, type });

  const refresh = async () => {
    setRefreshing(true);
    await refreshTree();
    setRefreshing(false);
  };

  const confirmDelete = async (node: FileNode) => {
    setDeleting(null);
    try {
      await deleteEntry(node);
      toast.success(`Deleted ${node.name}`);
    } catch (err) {
      toast.error("Delete failed", { description: errorMessage(err) });
    }
  };

  return (
    <Panel
      title={session.user.username}
      icon={FolderTree}
      actions={
        <>
          <PanelAction icon={FilePlus} label="New file" onClick={() => requestCreate("", "file")} />
          <PanelAction icon={FolderPlus} label="New folder" onClick={() => requestCreate("", "folder")} />
          <PanelAction icon={RefreshCw} label="Refresh" onClick={() => void refresh()} spinning={refreshing} />
          <PanelAction icon={FolderMinus} label="Collapse all" onClick={collapseAll} />
        </>
      }
      bodyClassName="overflow-y-auto px-1.5 py-2"
    >
      {treeStatus === "pending" ? (
        <div className="flex justify-center py-10">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : treeStatus === "error" ? (
        <div className="px-3 py-8 text-center text-sm text-muted-foreground">
          Couldn't load files.
          <Button variant="link" size="sm" onClick={() => void refresh()}>
            Try again
          </Button>
        </div>
      ) : tree.length === 0 ? (
        <div className="mx-1.5 mt-2 rounded-lg border border-dashed border-ide-border px-3 py-8 text-center">
          <FolderPlus className="mx-auto mb-2 size-6 text-link/70" />
          <p className="text-sm">Your workspace is empty</p>
          <p className="mb-3 mt-1 text-xs text-muted-foreground">Create a file or run commands in the terminal</p>
          <Button size="sm" variant="secondary" onClick={() => requestCreate("", "file")}>
            <FilePlus className="size-4" /> New file
          </Button>
        </div>
      ) : (
        <FileTree nodes={tree} onRequestCreate={requestCreate} onRequestDelete={setDeleting} />
      )}

      <CreateEntryDialog
        open={!!creating}
        type={creating?.type ?? "file"}
        parentPath={creating?.parentPath ?? ""}
        onOpenChange={(open) => !open && setCreating(null)}
        onCreate={createEntry}
      />
      <DeleteEntryDialog
        node={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={(node) => void confirmDelete(node)}
      />
    </Panel>
  );
}
