import type { Session } from "../lib/auth";

export type RuntimeStatus = "running" | "starting" | "stopped";

export interface RuntimeDriver {
  readonly name: string;
  /** Starts (or reuses) the user's runtime. */
  spawn(session: Session): Promise<RuntimeStatus>;
  stop(username: string): Promise<void>;
  status(username: string): Promise<RuntimeStatus>;
  /** Base URL that requests for /user/<username>/<port>/* are forwarded to, or null if unavailable. */
  target(username: string, port: number): string | null;
  shutdown?(): Promise<void>;
}
