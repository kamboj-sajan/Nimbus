import { promises as fs } from "fs";
import path from "path";

/** Shape of a Monaco IModelContentChange as it arrives over the socket. */
export interface ContentChange {
  rangeOffset: number;
  rangeLength: number;
  text: string;
}

/**
 * In-memory mirror of files being edited. Each file has a promise chain so change batches
 * from the editor are applied strictly in order, and we remember what we last wrote so the
 * file watcher can tell our own writes apart from changes made in the terminal.
 */
const contents = new Map<string, string>();
const recentWrites = new Map<string, string[]>();
const queues = new Map<string, Promise<void>>();
const RECENT_WRITES = 25;

function remember(absolutePath: string, content: string) {
  contents.set(absolutePath, content);
  const history = recentWrites.get(absolutePath) ?? [];
  history.push(content);
  if (history.length > RECENT_WRITES) history.shift();
  recentWrites.set(absolutePath, history);
}

function enqueue(absolutePath: string, task: () => Promise<void>): Promise<void> {
  const previous = queues.get(absolutePath) ?? Promise.resolve();
  const next = previous.then(task, task);
  queues.set(absolutePath, next);
  next.finally(() => {
    if (queues.get(absolutePath) === next) queues.delete(absolutePath);
  });
  return next;
}

export function applyChanges(original: string, changes: ContentChange[]): string {
  // Offsets in one batch all refer to the pre-edit text, so apply from the end backwards.
  const sorted = [...changes].sort((a, b) => b.rangeOffset - a.rangeOffset);
  let result = original;
  for (const change of sorted) {
    result =
      result.slice(0, change.rangeOffset) +
      change.text +
      result.slice(change.rangeOffset + change.rangeLength);
  }
  return result;
}

export function applyEditorChanges(absolutePath: string, changes: ContentChange[]): Promise<void> {
  return enqueue(absolutePath, async () => {
    let current = contents.get(absolutePath);
    if (current === undefined) {
      current = await fs.readFile(absolutePath, "utf-8").catch(() => "");
    }
    const updated = applyChanges(current, changes);
    remember(absolutePath, updated);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, updated, "utf-8");
  });
}

export function writeDocument(absolutePath: string, content: string): Promise<void> {
  return enqueue(absolutePath, async () => {
    remember(absolutePath, content);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, content, "utf-8");
  });
}

/**
 * True when the file on disk matches something Nimbus itself wrote recently. The watcher can
 * observe an older write of ours while newer keystrokes are still queued, so check the history.
 */
export function isOwnWrite(absolutePath: string, diskContent: string): boolean {
  return (
    contents.get(absolutePath) === diskContent ||
    (recentWrites.get(absolutePath)?.includes(diskContent) ?? false)
  );
}

/** Records a write made outside the editor flow (e.g. hydration) as our own. */
export function recordWrite(absolutePath: string, content: string) {
  remember(absolutePath, content);
}

/** Called when a change comes from outside the editor (terminal, git, build tools…). */
export function trackExternalContent(absolutePath: string, content: string) {
  contents.set(absolutePath, content);
}

export function forgetDocument(absolutePath: string) {
  for (const key of contents.keys()) {
    if (key === absolutePath || key.startsWith(absolutePath + path.sep)) {
      contents.delete(key);
      recentWrites.delete(key);
    }
  }
}
