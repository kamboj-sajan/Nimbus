export interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  size?: number;
  lastModified?: string;
  children?: FileNode[];
}

interface TreeEntry {
  /** Workspace-relative key; folders end with "/" */
  key: string;
  size: number;
  lastModified: Date;
}

/** Turns a flat list of object keys into a nested, sorted file tree. */
export function buildTree(entries: TreeEntry[]): FileNode[] {
  const root: FileNode = { name: "", path: "", type: "folder", children: [] };
  const folders = new Map<string, FileNode>([["", root]]);

  const ensureFolder = (folderPath: string): FileNode => {
    const existing = folders.get(folderPath);
    if (existing) return existing;
    const slash = folderPath.lastIndexOf("/");
    const parent = ensureFolder(slash === -1 ? "" : folderPath.slice(0, slash));
    const node: FileNode = {
      name: folderPath.slice(slash + 1),
      path: folderPath,
      type: "folder",
      children: [],
    };
    parent.children!.push(node);
    folders.set(folderPath, node);
    return node;
  };

  for (const entry of entries) {
    const isFolder = entry.key.endsWith("/");
    const cleanPath = entry.key.replace(/\/+$/, "");
    if (!cleanPath) continue;

    if (isFolder) {
      ensureFolder(cleanPath);
      continue;
    }

    const slash = cleanPath.lastIndexOf("/");
    const parent = ensureFolder(slash === -1 ? "" : cleanPath.slice(0, slash));
    parent.children!.push({
      name: cleanPath.slice(slash + 1),
      path: cleanPath,
      type: "file",
      size: entry.size,
      lastModified: entry.lastModified.toISOString(),
    });
  }

  const sort = (nodes: FileNode[]) => {
    nodes.sort((a, b) =>
      a.type === b.type ? a.name.localeCompare(b.name) : a.type === "folder" ? -1 : 1
    );
    nodes.forEach((n) => n.children && sort(n.children));
  };
  sort(root.children!);

  return root.children!;
}
