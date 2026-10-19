import { Router, type Request } from "express";
import path from "path";
import { z } from "zod";
import { normalizeRelPath, validateName } from "../lib/paths";
import { authenticate, currentUser } from "../middleware/auth";
import { notifyTreeChanged } from "../sockets/hub";
import { Workspace } from "../storage";

const router = Router();

const entryType = z.enum(["file", "folder"]);

function workspaceFor(req: Request) {
  return new Workspace(currentUser(req).username);
}

/** Tell the user's other tabs the tree changed (the caller passes its socket id to skip itself). */
function broadcastTreeChange(req: Request) {
  notifyTreeChanged(currentUser(req).username, req.header("x-socket-id"));
}

// Hydration snapshot: also accepts the short-lived "snapshot" token minted by the orchestrator.
router.get("/snapshot", authenticate("snapshot"), async (req, res) => {
  res.json(await workspaceFor(req).snapshot());
});

router.use(authenticate());

router.get("/tree", async (req, res) => {
  res.json(await workspaceFor(req).tree());
});

router.get("/list", async (req, res) => {
  res.json(await workspaceFor(req).list());
});

router.get("/content", async (req, res) => {
  const relPath = normalizeRelPath(req.query.path);
  const content = await workspaceFor(req).read(relPath);
  res.json({ path: relPath, content: content.toString("utf-8") });
});

router.put("/content", async (req, res) => {
  const { content } = z.object({ content: z.string() }).parse(req.body);
  const relPath = normalizeRelPath(req.body.path);
  await workspaceFor(req).write(relPath, content);
  res.json({ message: "File saved", path: relPath, savedAt: new Date().toISOString() });
});

router.post("/", async (req, res) => {
  const { type, content } = z
    .object({ type: entryType, content: z.string().optional() })
    .parse(req.body);
  const relPath = normalizeRelPath(req.body.path);
  await workspaceFor(req).create(relPath, type, content);
  broadcastTreeChange(req);
  res.status(201).json({ message: `${type === "file" ? "File" : "Folder"} created`, path: relPath, type });
});

router.patch("/", async (req, res) => {
  const relPath = normalizeRelPath(req.body.path);
  // Either a new name in the same folder, or a full destination path (move).
  const newRelPath = req.body.newPath
    ? normalizeRelPath(req.body.newPath)
    : path.posix.join(path.posix.dirname(relPath), validateName(req.body.name));

  if (newRelPath === relPath) {
    res.json({ message: "Nothing to rename", path: relPath });
    return;
  }

  const { type } = await workspaceFor(req).rename(relPath, newRelPath);
  broadcastTreeChange(req);
  res.json({ message: "Renamed", oldPath: relPath, path: newRelPath, type });
});

router.delete("/", async (req, res) => {
  const { type } = z.object({ type: entryType }).parse(req.body ?? {});
  const relPath = normalizeRelPath(req.body.path);
  await workspaceFor(req).delete(relPath, type);
  broadcastTreeChange(req);
  res.json({ message: `${type === "file" ? "File" : "Folder"} deleted`, path: relPath, type });
});

export default router;
