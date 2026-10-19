import path from "path";
import { config } from "../config";

export class PathError extends Error {}

/** Resolves a workspace-relative path to an absolute path, refusing anything outside the workspace. */
export function resolveInWorkspace(relPath: unknown): string {
  if (typeof relPath !== "string" || !relPath.trim()) throw new PathError("Path is required");
  const absolute = path.resolve(config.workspaceDir, relPath.replace(/\\/g, "/").replace(/^\/+/, ""));
  if (absolute === config.workspaceDir || !absolute.startsWith(config.workspaceDir + path.sep)) {
    throw new PathError("Path escapes the workspace");
  }
  return absolute;
}

export function toRelative(absolutePath: string): string {
  return path.relative(config.workspaceDir, absolutePath).split(path.sep).join("/");
}

// Build output, dependency and tooling folders are never synced back to storage.
const IGNORED = new Set([
  "node_modules", "dist", "build", "out", ".next", ".nuxt", ".vercel", ".turbo", "coverage",
  ".parcel-cache", ".yarn", ".npm", ".cache",
  "__pycache__", ".pytest_cache", ".mypy_cache", ".venv", "venv", ".ipynb_checkpoints",
  "bin", "obj", "target", "CMakeFiles", "cmake-build-debug", "cmake-build-release",
  ".git", ".idea", ".vscode", ".DS_Store", "Thumbs.db",
]);

export function isIgnored(relPath: string): boolean {
  return relPath.split("/").some((segment) => IGNORED.has(segment) || segment.endsWith(".swp"));
}

export const IGNORED_NAMES = IGNORED;
