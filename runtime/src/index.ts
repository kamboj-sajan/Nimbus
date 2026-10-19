import cors from "cors";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { config } from "./config";
import { hydrateWorkspace } from "./lib/hydrate";
import fsRoutes from "./routes/fs";
import { registerEditor } from "./sockets/editor";
import { registerTerminal } from "./sockets/terminal";
import { startWatcher } from "./watcher";

// Access control happens in the orchestrator, which is the only way traffic reaches this
// process; CORS still restricts which web origins may talk to it.
async function main() {
  try {
    await hydrateWorkspace();
  } catch (err) {
    // A failed hydration shouldn't stop the runtime: the editor re-syncs files on open.
    console.error("⚠️  Workspace hydration failed:", err);
  }

  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: config.clientOrigins, credentials: true }));
  app.use(express.json({ limit: "10mb" }));

  app.get("/health", (_req, res) => {
    res.send("OK");
  });
  app.use("/fs", fsRoutes);

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: config.clientOrigins, credentials: true },
    maxHttpBufferSize: 5e6,
  });

  io.on("connection", (socket) => {
    registerEditor(socket);
    registerTerminal(socket);
  });

  startWatcher(io);

  server.listen(config.port, () => {
    console.log(`✅ Nimbus runtime on :${config.port} — workspace ${config.workspaceDir}`);
  });
}

main();
