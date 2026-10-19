import "dotenv/config";
import fs from "fs";
import path from "path";

const workspaceDir = path.resolve(process.env.WORKSPACE_DIR || "./workspace");
fs.mkdirSync(workspaceDir, { recursive: true });

export const config = {
  port: Number(process.env.PORT || 3000),
  // Resolve symlinks (e.g. /tmp on macOS) so watcher paths and resolved paths agree.
  workspaceDir: fs.realpathSync(workspaceDir),
  clientOrigins: (process.env.CLIENT_ORIGINS || "http://localhost:5173,http://localhost:5174")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  shell: process.env.RUNTIME_SHELL || process.env.SHELL || "bash",
  // Optional: pull the user's files from the Nimbus API on boot.
  hydrate: {
    apiUrl: process.env.NIMBUS_API_URL || "",
    token: process.env.NIMBUS_HYDRATE_TOKEN || "",
  },
};

/** Environment for user shells: never leak Nimbus credentials into the terminal. */
export function shellEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith("NIMBUS_") || key === "JWT_SECRET") continue;
    env[key] = value;
  }
  env.TERM = "xterm-256color";
  env.COLORTERM = "truecolor";
  env.NIMBUS_WORKSPACE = config.workspaceDir;
  return env;
}
