import "dotenv/config";
import path from "path";

function list(value: string | undefined, fallback: string[]): string[] {
  if (!value) return fallback;
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

const isProduction = process.env.NODE_ENV === "production";
// Local dev state (embedded DB, stored files) lives in <repo>/.nimbus by default.
const devDataDir = path.resolve(__dirname, "../../.nimbus");

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret && isProduction) {
  throw new Error("JWT_SECRET must be set in production");
}

export const config = {
  isProduction,
  port: Number(process.env.PORT || 3001),
  clientOrigins: list(process.env.CLIENT_ORIGINS, [
    "http://localhost:5173",
    "http://localhost:5174",
  ]),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",

  jwtSecret: jwtSecret || "nimbus-dev-secret-change-me",
  tokenTtl: process.env.TOKEN_TTL || "7d",

  // Leave DATABASE_URL empty to use an embedded PGlite database on disk.
  databaseUrl: process.env.DATABASE_URL || "",
  databaseSsl: process.env.DATABASE_SSL === "true",
  pgliteDir: path.resolve(process.env.PGLITE_DIR || path.join(devDataDir, "db")),

  storageDriver: (process.env.STORAGE_DRIVER || "local") as "local" | "azure",
  storageLocalRoot: path.resolve(process.env.STORAGE_LOCAL_ROOT || path.join(devDataDir, "storage")),
  azureConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || "",
  azureContainer: process.env.AZURE_STORAGE_CONTAINER_NAME || "nimbus",

  // Every user gets one workspace stored under users/<username>/<projectName>/
  projectName: process.env.PROJECT_NAME || "workspace",

  requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === "true",
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "",
  },
};
