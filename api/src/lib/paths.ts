import { HttpError } from "./http-error";

/**
 * Normalises a client supplied workspace path ("src/app.ts", "/src//app.ts", "./src")
 * and rejects anything that could escape the user's workspace.
 */
export function normalizeRelPath(input: unknown): string {
  if (typeof input !== "string") throw new HttpError(400, "Path is required");

  const segments = input
    .replace(/\\/g, "/")
    .split("/")
    .filter((s) => s !== "" && s !== ".");

  if (segments.length === 0) throw new HttpError(400, "Path is required");
  if (segments.some((s) => s === "..")) throw new HttpError(400, "Path may not contain '..'");
  if (segments.some((s) => s.length > 255)) throw new HttpError(400, "Path segment too long");

  return segments.join("/");
}

/** Validates a single file / folder name used for rename. */
export function validateName(input: unknown): string {
  if (typeof input !== "string" || !input.trim()) throw new HttpError(400, "Name is required");
  const name = input.trim();
  if (name.includes("/") || name.includes("\\") || name === "." || name === "..") {
    throw new HttpError(400, "Name may not contain slashes");
  }
  return name;
}
