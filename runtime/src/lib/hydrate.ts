import { promises as fs } from "fs";
import path from "path";
import { config } from "../config";
import { recordWrite } from "./documents";
import { IGNORED_NAMES } from "./paths";

interface Snapshot {
  folders: string[];
  files: { path: string; content: string }[];
}

/**
 * Pulls the user's persisted files from the Nimbus API into the workspace. Dependency and
 * build folders (node_modules, .venv…) are kept so a restart doesn't force a reinstall.
 */
export async function hydrateWorkspace(): Promise<void> {
  const { apiUrl, token } = config.hydrate;
  if (!apiUrl || !token) return;

  const started = Date.now();
  const res = await fetch(`${apiUrl.replace(/\/$/, "")}/api/files/snapshot`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Snapshot request failed with ${res.status}`);
  const snapshot = (await res.json()) as Snapshot;

  for (const entry of await fs.readdir(config.workspaceDir)) {
    if (IGNORED_NAMES.has(entry)) continue;
    await fs.rm(path.join(config.workspaceDir, entry), { recursive: true, force: true });
  }

  const resolve = (relPath: string) => {
    const absolute = path.resolve(config.workspaceDir, relPath);
    if (!absolute.startsWith(config.workspaceDir + path.sep)) throw new Error(`Bad path ${relPath}`);
    return absolute;
  };

  for (const folder of snapshot.folders) {
    await fs.mkdir(resolve(folder), { recursive: true });
  }
  for (const file of snapshot.files) {
    const target = resolve(file.path);
    await fs.mkdir(path.dirname(target), { recursive: true });
    const buffer = Buffer.from(file.content, "base64");
    await fs.writeFile(target, buffer);
    // FSEvents may replay these writes after the watcher starts; mark them as ours.
    recordWrite(target, buffer.toString("utf-8"));
  }

  console.log(
    `💧 Hydrated workspace with ${snapshot.files.length} files in ${Date.now() - started}ms`
  );
}
