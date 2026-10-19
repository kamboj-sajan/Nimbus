/**
 * Paths touched through the HTTP API are already persisted by the browser, so the watcher
 * shouldn't echo them back as "fs:*" events. Entries expire after a short window.
 */
const WINDOW_MS = 2000;
const recent = new Map<string, number>();

export function suppress(relPath: string) {
  recent.set(relPath, Date.now() + WINDOW_MS);
}

export function isSuppressed(relPath: string): boolean {
  const now = Date.now();
  for (const [p, expires] of recent) {
    if (expires < now) recent.delete(p);
  }
  for (const p of recent.keys()) {
    if (relPath === p || relPath.startsWith(p + "/")) return true;
  }
  return false;
}
