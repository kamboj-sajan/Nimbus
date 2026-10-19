import { spawn, type ChildProcess } from "child_process";
import fs from "fs";
import net from "net";
import path from "path";
import { config } from "../config";
import { mintSnapshotToken, type Session } from "../lib/auth";
import type { RuntimeDriver, RuntimeStatus } from "./types";

interface LocalRuntime {
  port: number;
  child: ChildProcess;
  ready: boolean;
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as net.AddressInfo;
      server.close(() => resolve(port));
    });
  });
}

/** Only pass through what a shell needs — never the orchestrator's own secrets. */
function baseEnv(): NodeJS.ProcessEnv {
  const keep = ["PATH", "HOME", "USER", "LOGNAME", "SHELL", "LANG", "LC_ALL", "TMPDIR", "TERM"];
  const env: NodeJS.ProcessEnv = {};
  for (const key of keep) if (process.env[key]) env[key] = process.env[key];
  return env;
}

/**
 * Development driver: each user's runtime is a child process on this machine, with its
 * workspace under .nimbus/workspaces/<username>. There is no isolation between users or from
 * the host — use the kubernetes driver for anything shared.
 */
export class LocalDriver implements RuntimeDriver {
  readonly name = "local";
  private runtimes = new Map<string, LocalRuntime>();

  private command(): { cmd: string; args: string[] } {
    const dist = path.join(config.local.runtimeDir, "dist/index.js");
    if (config.isProduction && fs.existsSync(dist)) return { cmd: process.execPath, args: [dist] };
    const tsxCli = path.join(config.local.runtimeDir, "node_modules/tsx/dist/cli.mjs");
    if (!fs.existsSync(tsxCli)) {
      throw new Error(`Runtime dependencies missing — run "npm install" in ${config.local.runtimeDir}`);
    }
    return { cmd: process.execPath, args: [tsxCli, "src/index.ts"] };
  }

  async spawn(session: Session): Promise<RuntimeStatus> {
    const existing = this.runtimes.get(session.username);
    if (existing) return existing.ready ? "running" : "starting";

    const port = await freePort();
    const workspaceDir = path.join(config.local.workspacesDir, session.username);
    fs.mkdirSync(workspaceDir, { recursive: true });

    const { cmd, args } = this.command();
    const child = spawn(cmd, args, {
      cwd: config.local.runtimeDir,
      env: {
        ...baseEnv(),
        NODE_ENV: process.env.NODE_ENV || "development",
        PORT: String(port),
        WORKSPACE_DIR: workspaceDir,
        CLIENT_ORIGINS: config.clientOrigins.join(","),
        NIMBUS_API_URL: config.runtimeApiUrl,
        NIMBUS_HYDRATE_TOKEN: mintSnapshotToken(session, "10m"),
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    const runtime: LocalRuntime = { port, child, ready: false };
    this.runtimes.set(session.username, runtime);

    const prefix = `[runtime:${session.username}]`;
    const log = (chunk: Buffer) => {
      const text = chunk.toString().trimEnd();
      if (!text) return;
      for (const line of text.split("\n")) console.log(prefix, line);
      if (text.includes("Nimbus runtime on")) runtime.ready = true;
    };
    child.stdout?.on("data", log);
    child.stderr?.on("data", log);
    child.on("exit", (code) => {
      console.log(`${prefix} exited with code ${code}`);
      if (this.runtimes.get(session.username) === runtime) this.runtimes.delete(session.username);
    });

    console.log(`🚀 Started local runtime for ${session.username} on port ${port}`);
    return "starting";
  }

  async stop(username: string): Promise<void> {
    const runtime = this.runtimes.get(username);
    if (!runtime) return;
    this.runtimes.delete(username);
    runtime.child.kill("SIGTERM");
  }

  async status(username: string): Promise<RuntimeStatus> {
    const runtime = this.runtimes.get(username);
    if (!runtime) return "stopped";
    return runtime.ready ? "running" : "starting";
  }

  target(username: string, port: number): string | null {
    if (port === config.runtimePort) {
      const runtime = this.runtimes.get(username);
      return runtime ? `http://127.0.0.1:${runtime.port}` : null;
    }
    // Preview servers started from the terminal listen directly on this machine.
    return `http://127.0.0.1:${port}`;
  }

  async shutdown(): Promise<void> {
    for (const username of [...this.runtimes.keys()]) await this.stop(username);
  }
}
