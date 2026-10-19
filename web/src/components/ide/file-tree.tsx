import { useState } from "react";
import { ChevronRight, Copy, FilePlus, FolderPlus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspace } from "@/contexts/workspace";
import type { EntryType, FileNode } from "@/lib/api";
import { cn, errorMessage } from "@/lib/utils";
import { validateEntryPath } from "./entry-dialogs";
import { FileIcon, FolderIcon } from "./file-icon";

interface TreeActions {
  onRequestCreate: (parentPath: string, type: EntryType) => void;
  onRequestDelete: (node: FileNode) => void;
}

export function FileTree({ nodes, level = 0, ...actions }: TreeActions & { nodes: FileNode[]; level?: number }) {
  return (
    <ul role={level === 0 ? "tree" : "group"}>
      {nodes.map((node) => (
        <FileTreeNode key={node.path} node={node} level={level} {...actions} />
      ))}
    </ul>
  );
}

function FileTreeNode({ node, level, ...actions }: TreeActions & { node: FileNode; level: number }) {
  const { expanded, toggleExpanded, editorState, openFile, renameEntry } = useWorkspace();
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(node.name);

  const isFolder = node.type === "folder";
  const isOpen = expanded.has(node.path);
  const isActive = editorState.path === node.path;

  const commitRename = async () => {
    setRenaming(false);
    const name = draft.trim();
    if (!name || name === node.name) return setDraft(node.name);
    const problem = validateEntryPath(name) ?? (name.includes("/") ? "Names can't contain '/'" : null);
    if (problem) {
      toast.error(problem);
      return setDraft(node.name);
    }
    try {
      await renameEntry(node, name);
    } catch (err) {
      toast.error("Rename failed", { description: errorMessage(err) });
      setDraft(node.name);
    }
  };

  return (
    <li role="treeitem" aria-expanded={isFolder ? isOpen : undefined} aria-selected={isActive}>
      <div
        className={cn(
          "group flex h-7 cursor-pointer select-none items-center gap-1.5 rounded-md pr-1 text-[13px] text-foreground/85 transition-colors hover:bg-white/[0.05]",
          isActive && "bg-ide-active text-foreground hover:bg-ide-active"
        )}
        style={{ paddingLeft: level * 12 + 6 }}
        onClick={() => (isFolder ? toggleExpanded(node.path) : void openFile(node.path))}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setRenaming(true);
        }}
      >
        <ChevronRight
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform",
            isOpen && "rotate-90",
            !isFolder && "invisible"
          )}
        />
        {isFolder ? <FolderIcon open={isOpen} /> : <FileIcon name={node.name} />}

        {renaming ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onFocus={(e) => {
              const dot = node.name.lastIndexOf(".");
              e.target.setSelectionRange(0, isFolder || dot <= 0 ? node.name.length : dot);
            }}
            onBlur={() => void commitRename()}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") {
                setDraft(node.name);
                setRenaming(false);
              }
            }}
            className="h-5 min-w-0 flex-1 rounded border border-primary/60 bg-background px-1 font-mono text-[12px] outline-none"
          />
        ) : (
          <span className="min-w-0 flex-1 truncate">{node.name}</span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-ide-hover hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
              aria-label={`Actions for ${node.name}`}
            >
              <MoreHorizontal className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44" onClick={(e) => e.stopPropagation()}>
            {isFolder && (
              <>
                <DropdownMenuItem onClick={() => actions.onRequestCreate(node.path, "file")}>
                  <FilePlus className="size-4" /> New file
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => actions.onRequestCreate(node.path, "folder")}>
                  <FolderPlus className="size-4" /> New folder
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => setRenaming(true)}>
              <Pencil className="size-4" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                void navigator.clipboard.writeText(node.path);
                toast.success("Path copied");
              }}
            >
              <Copy className="size-4" /> Copy path
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => actions.onRequestDelete(node)}>
              <Trash2 className="size-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isFolder && isOpen && node.children && node.children.length > 0 && (
        <FileTree nodes={node.children} level={level + 1} {...actions} />
      )}
    </li>
  );
}
