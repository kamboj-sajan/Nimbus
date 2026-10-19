import cors from "cors";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { config } from "./config";
import { initDatabase } from "./db";
import { errorHandler } from "./lib/http-error";
import authRoutes from "./routes/auth";
import fileRoutes from "./routes/files";
import { registerCollaboration } from "./sockets/hub";

async function main() {
  await initDatabase();

  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: config.clientOrigins, credentials: true }));
  app.use(express.json({ limit: "10mb" }));

  app.get("/health", (_req, res) => {
    res.send("OK");
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/files", fileRoutes);
  app.use("/api", (_req, res) => {
    res.status(404).json({ message: "Not found" });
  });
  app.use(errorHandler);

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: config.clientOrigins, credentials: true },
    maxHttpBufferSize: 5e6,
  });
  registerCollaboration(io);

  server.listen(config.port, () => {
    console.log(`✅ Nimbus API + realtime hub on http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error("❌ Failed to start API:", err);
  process.exit(1);
});
