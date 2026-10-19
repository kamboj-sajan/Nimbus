import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { EntryType, FileNode } from "@/lib/api";
import { errorMessage } from "@/lib/utils";

export function validateEntryPath(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Enter a name";
  if (trimmed.split("/").some((s) => s === "..")) return "Names can't contain '..'";
  if (/[\\:*?"<>|]/.test(trimmed)) return "Names can't contain \\ : * ? \" < > |";
  return null;
}

interface CreateEntryDialogProps {
  open: boolean;
  type: EntryType;
  /** Folder the new entry goes into ("" for the workspace root). */
  parentPath: string;
  onOpenChange: (open: boolean) => void;
  onCreate: (path: string, type: EntryType) => Promise<void>;
}

export function CreateEntryDialog({ open, type, parentPath, onOpenChange, onCreate }: CreateEntryDialogProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setError(null);
    }
  }, [open]);

  const submit = async () => {
    const problem = validateEntryPath(name);
    if (problem) return setError(problem);
    const relative = name.trim().replace(/^\/+|\/+$/g, "");
    setBusy(true);
    try {
      await onCreate(parentPath ? `${parentPath}/${relative}` : relative, type);
      onOpenChange(false);
    } catch (err) {
      setError(errorMessage(err, "Couldn't create it"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New {type}</DialogTitle>
          <DialogDescription>
            In <span className="font-mono text-foreground">/{parentPath}</span>. Use slashes to create nested
            paths, e.g. <span className="font-mono">src/app.js</span>.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="space-y-2"
        >
          <Input
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder={type === "file" ? "index.js" : "components"}
            className="font-mono"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteEntryDialogProps {
  node: FileNode | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (node: FileNode) => void;
}

export function DeleteEntryDialog({ node, onOpenChange, onConfirm }: DeleteEntryDialogProps) {
  return (
    <AlertDialog open={!!node} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {node?.type}?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-mono text-foreground">{node?.path}</span>
            {node?.type === "folder" && " and everything inside it"} will be permanently deleted. This can't be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => node && onConfirm(node)}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
