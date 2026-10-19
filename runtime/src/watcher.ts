import chokidar from "chokidar";
import { promises as fs } from "fs";
import type { Server } from "socket.io";
import { config } from "./config";
import { isOwnWrite, trackExternalContent } from "./lib/documents";
import { isIgnored, toRelative } from "./lib/paths";
import { isSuppressed } from "./lib/suppress";

const MAX_SYNC_BYTES = 2 * 1024 * 1024;

async function readText(absolutePath: string): Promise<string | null> {
  const stat = await fs.stat(absolutePath).catch(() => null);
  if (!stat || !stat.isFile() || stat.size > MAX_SYNC_BYTES) return null;
  const buffer = await fs.readFile(absolutePath);
  // Skip binaries: the editor and storage sync are text based.
  if (buffer.includes(0)) return null;
  return buffer.toString("utf-8");
}

/**
 * Watches the workspace for changes made outside the editor (terminal commands, package
 * managers, generators…) and tells connected browsers, which persist them to storage.
 */
export function startWatcher(io: Server) {
  const watcher = chokidar.watch(config.workspaceDir, {
    ignoreInitial: true,
    ignored: (absolutePath) => {
      const relPath = toRelative(absolutePath);
      return relPath !== "" && isIgnored(relPath);
    },
    awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 50 },
  });

  const relevant = (absolutePath: string) => {
    const relPath = toRelative(absolutePath);
    if (!relPath || relPath.startsWith("..") || isIgnored(relPath) || isSuppressed(relPath)) return null;
    return relPath;
  };

  watcher
    .on("add", async (absolutePath) => {
      const relPath = relevant(absolutePath);
      if (!relPath) return;
      const content = await readText(absolutePath);
      if (content === null) return;
      trackExternalContent(absolutePath, content);
      io.emit("fs:add", { path: relPath, type: "file", content });
    })
    .on("addDir", (absolutePath) => {
      const relPath = relevant(absolutePath);
      if (relPath) io.emit("fs:add", { path: relPath, type: "folder" });
    })
    .on("change", async (absolutePath) => {
      const relPath = relevant(absolutePath);
      if (!relPath) return;
      const content = await readText(absolutePath);
      if (content === null || isOwnWrite(absolutePath, content)) return;
      trackExternalContent(absolutePath, content);
      io.emit("fs:change", { path: relPath, type: "file", content });
    })
    .on("unlink", (absolutePath) => {
      const relPath = relevant(absolutePath);
      if (relPath) io.emit("fs:remove", { path: relPath, type: "file" });
    })
    .on("unlinkDir", (absolutePath) => {
      const relPath = relevant(absolutePath);
      if (relPath) io.emit("fs:remove", { path: relPath, type: "folder" });
    })
    .on("error", (err) => console.error("❌ Watcher error:", err));

  return watcher;
}
