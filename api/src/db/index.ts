import fs from "fs";
import path from "path";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { config } from "../config";
import * as schema from "./schema";

const migrationsFolder = path.resolve(__dirname, "../../drizzle");

// Both drivers expose the same query builder; we type against node-postgres.
export let db: NodePgDatabase<typeof schema>;

export async function initDatabase(): Promise<void> {
  if (config.databaseUrl) {
    const pool = new Pool({
      connectionString: config.databaseUrl,
      ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
    });
    db = drizzlePg(pool, { schema });
    await migratePg(db, { migrationsFolder });
    console.log("🗄️  Connected to PostgreSQL");
    return;
  }

  // Zero-config local development: embedded Postgres (PGlite) persisted to disk.
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle: drizzlePglite } = await import("drizzle-orm/pglite");
  const { migrate: migratePglite } = await import("drizzle-orm/pglite/migrator");

  fs.mkdirSync(config.pgliteDir, { recursive: true });
  const client = new PGlite(config.pgliteDir);
  const pgliteDb = drizzlePglite(client, { schema });
  await migratePglite(pgliteDb, { migrationsFolder });
  db = pgliteDb as unknown as NodePgDatabase<typeof schema>;
  console.log(`🗄️  Using embedded PGlite database at ${config.pgliteDir}`);
}
