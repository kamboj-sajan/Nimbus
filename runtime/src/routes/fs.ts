import { Router, type NextFunction, type Request, type Response } from "express";
import { promises as fs } from "fs";
import path from "path";
import { forgetDocument, writeDocument } from "../lib/documents";
import { isIgnored, PathError, resolveInWorkspace, toRelative } from "../lib/paths";
import { suppress } from "../lib/suppress";
import { config } from "../config";

const router = Router();

interface TreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: TreeNode[];
}

async function readTree(dir: string): Promise<TreeNode[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nodes: TreeNode[] = [];
  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    const relPath = toRelative(absolute);
    if (isIgnored(relPath)) continue;
    if (entry.isDirectory()) {
      nodes.push({ name: entry.name, path: relPath, type: "folder", children: await readTree(absolute) });
    } else if (entry.isFile()) {
      nodes.push({ name: entry.name, path: relPath, type: "file" });
    }
  }
  return nodes.sort((a, b) =>
    a.type === b.type ? a.name.localeCompare(b.name) : a.type === "folder" ? -1 : 1
  );
}

router.get("/tree", async (_req, res) => {
  res.json(await readTree(config.workspaceDir));
});

// Create a file or folder (mirrors a create done in the explorer).
router.post("/entry", async (req, res) => {
  const { path: relPath, type, content } = req.body ?? {};
  const absolute = resolveInWorkspace(relPath);
  suppress(toRelative(absolute));

  if (type === "folder") {
    await fs.mkdir(absolute, { recursive: true });
  } else {
    // Never clobber an existing file — it may have been created in the terminal first.
    const exists = await fs.stat(absolute).then(() => true, () => false);
    if (!exists || typeof content === "string") {
      await writeDocument(absolute, typeof content === "string" ? content : "");
    }
  }
  res.status(201).json({ message: "Created", path: toRelative(absolute) });
});

router.delete("/entry", async (req, res) => {
  const absolute = resolveInWorkspace(req.body?.path);
  suppress(toRelative(absolute));
  await fs.rm(absolute, { recursive: true, force: true });
  forgetDocument(absolute);
  res.json({ message: "Deleted", path: toRelative(absolute) });
});

router.patch("/entry", async (req, res) => {
  const from = resolveInWorkspace(req.body?.path);
  const to = resolveInWorkspace(req.body?.newPath);
  suppress(toRelative(from));
  suppress(toRelative(to));
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.rename(from, to).catch((err) => {
    if (err.code !== "ENOENT") throw err;
  });
  forgetDocument(from);
  res.json({ message: "Renamed", path: toRelative(to) });
});

// Overwrite a file with the persisted copy (called when a file is opened in the editor).
router.put("/file", async (req, res) => {
  const { content } = req.body ?? {};
  if (typeof content !== "string") {
    res.status(400).json({ message: "content is required" });
    return;
  }
  const absolute = resolveInWorkspace(req.body?.path);
  suppress(toRelative(absolute));
  await writeDocument(absolute, content);
  res.json({ message: "Synced", path: toRelative(absolute) });
});

router.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof PathError) {
    res.status(400).json({ message: err.message });
    return;
  }
  console.error("❌ fs route error:", err);
  res.status(500).json({ message: "File system operation failed" });
});

export default router;
