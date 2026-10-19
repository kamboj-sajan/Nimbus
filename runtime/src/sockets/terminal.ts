import { spawn, type IPty } from "node-pty";
import type { Socket } from "socket.io";
import { config, shellEnv } from "../config";

const clamp = (value: unknown, min: number, max: number, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.floor(n))) : fallback;
};

/** Each browser tab gets its own shell session, killed when the tab disconnects. */
export function registerTerminal(socket: Socket) {
  let pty: IPty | null = null;

  const stop = () => {
    if (!pty) return;
    const proc = pty;
    pty = null;
    try {
      proc.kill();
    } catch {
      // already exited
    }
  };

  socket.on("terminal:start", (size: { cols?: number; rows?: number } = {}) => {
    stop();
    let proc: IPty;
    try {
      proc = spawn(config.shell, [], {
        name: "xterm-256color",
        cols: clamp(size.cols, 10, 500, 80),
        rows: clamp(size.rows, 4, 200, 24),
        cwd: config.workspaceDir,
        env: shellEnv() as { [key: string]: string },
      });
    } catch (err) {
      console.error("❌ Failed to start shell:", err);
      socket.emit("terminal:output", `\r\n\x1b[31mFailed to start shell (${config.shell}): ${(err as Error).message}\x1b[0m\r\n`);
      socket.emit("terminal:exit", { exitCode: -1 });
      return;
    }
    pty = proc;

    proc.onData((data) => socket.emit("terminal:output", data));
    proc.onExit(({ exitCode }) => {
      if (pty === proc) pty = null;
      socket.emit("terminal:exit", { exitCode });
    });
  });

  socket.on("terminal:input", (data: unknown) => {
    if (pty && typeof data === "string") pty.write(data);
  });

  socket.on("terminal:resize", (size: { cols?: number; rows?: number } = {}) => {
    if (!pty) return;
    pty.resize(clamp(size.cols, 10, 500, 80), clamp(size.rows, 4, 200, 24));
  });

  socket.on("disconnect", stop);
}
