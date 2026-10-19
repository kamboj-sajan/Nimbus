import type { Socket } from "socket.io";
import { applyEditorChanges, type ContentChange } from "../lib/documents";
import { resolveInWorkspace } from "../lib/paths";

function isChange(value: any): value is ContentChange {
  return (
    value &&
    Number.isInteger(value.rangeOffset) &&
    Number.isInteger(value.rangeLength) &&
    typeof value.text === "string"
  );
}

/** Applies Monaco change batches to the live workspace so the terminal always sees current code. */
export function registerEditor(socket: Socket) {
  socket.on("editor:changes", async ({ path, changes } = {}) => {
    if (!Array.isArray(changes) || !changes.every(isChange)) return;
    try {
      await applyEditorChanges(resolveInWorkspace(path), changes);
    } catch (err) {
      console.error(`❌ Failed to apply editor changes to ${path}:`, err);
      socket.emit("editor:error", { path, message: "Failed to apply changes in the workspace" });
    }
  });
}
