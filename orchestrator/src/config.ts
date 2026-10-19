import "dotenv/config";
import path from "path";

const isProduction = process.env.NODE_ENV === "production";

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in production (same value as the API)");
}

const list = (value: string | undefined, fallback: string) =>
  (value || fallback)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

export const config = {
  isProduction,
  port: Number(process.env.PORT || 3002),
  mode: (process.env.ORCHESTRATOR_MODE || "local") as "local" | "kubernetes",
  clientOrigins: list(process.env.CLIENT_ORIGINS, "http://localhost:5173,http://localhost:5174"),
  // Must match the API so session tokens can be verified here.
  jwtSecret: process.env.JWT_SECRET || "nimbus-dev-secret-change-me",
  sessionCookie: "nimbus_session",
  secureCookies: process.env.SECURE_COOKIES === "true",

  /** Port the runtime listens on inside every workspace; /user/<name>/<runtimePort> reaches it. */
  runtimePort: 3000,
  /** Where runtimes fetch their initial files from (must be reachable from the runtime). */
  runtimeApiUrl: process.env.RUNTIME_API_URL || "http://localhost:3001",

  local: {
    runtimeDir: path.resolve(process.env.LOCAL_RUNTIME_DIR || path.join(__dirname, "../../runtime")),
    workspacesDir: path.resolve(
      process.env.LOCAL_WORKSPACES_DIR || path.join(__dirname, "../../.nimbus/workspaces")
    ),
  },

  kubernetes: {
    namespace: process.env.K8S_NAMESPACE || "default",
    runtimeImage: process.env.RUNTIME_IMAGE || "nimbus/runtime:latest",
    // Ports exposed on each workspace Service for the preview panel.
    previewPorts: list(process.env.PREVIEW_PORTS, "8080,5173,8000,5000,4200,3001").map(Number),
    cpuLimit: process.env.RUNTIME_CPU_LIMIT || "1",
    memoryLimit: process.env.RUNTIME_MEMORY_LIMIT || "1Gi",
  },
};
