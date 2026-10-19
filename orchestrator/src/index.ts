import cors from "cors";
import express, { type Request, type Response } from "express";
import http from "http";
import httpProxy from "http-proxy";
import type { Duplex } from "stream";
import { config } from "./config";
import type { RuntimeDriver } from "./drivers/types";
import { authenticateRequest, readToken, type Session } from "./lib/auth";

async function createDriver(): Promise<RuntimeDriver> {
  if (config.mode === "kubernetes") {
    const { KubernetesDriver } = await import("./drivers/kubernetes");
    return new KubernetesDriver();
  }
  const { LocalDriver } = await import("./drivers/local");
  return new LocalDriver();
}

/** /user/<username>/<port>/<rest> → parts, or null. */
function parseUserPath(url: string) {
  const match = url.match(/^\/user\/([a-z0-9_]+)\/(\d{2,5})(\/[^?]*)?(\?.*)?$/);
  if (!match) return null;
  return { username: match[1], port: Number(match[2]), rest: (match[3] || "/") + (match[4] || "") };
}

async function main() {
  const driver = await createDriver();
  const app = express();
  app.disable("x-powered-by");

  const proxy = httpProxy.createProxyServer({ changeOrigin: true, ws: true, xfwd: true });
  proxy.on("error", (err, _req, res) => {
    console.error("❌ Proxy error:", err.message);
    if (res instanceof http.ServerResponse && !res.headersSent) {
      res.writeHead(502, { "Content-Type": "text/plain" });
      res.end("Workspace is not reachable yet");
    } else if (res && "destroy" in res) {
      (res as Duplex).destroy();
    }
  });

  app.get("/health", (_req, res) => {
    res.send("OK");
  });

  // ── Control plane: start / stop / status ────────────────────────────────────────────
  // CORS and body parsing are scoped to these paths so proxied request bodies stay untouched.
  const controlPaths = ["/spawn", "/status", "/delete"];
  app.use(controlPaths, cors({ origin: config.clientOrigins, credentials: true }), express.json());

  const requireSession = (req: Request, res: Response): Session | null => {
    const session = authenticateRequest(req);
    if (!session) res.status(401).json({ message: "Authentication required" });
    return session;
  };

  const describe = (session: Session, status: string) => ({
    status,
    mode: driver.name,
    runtimePath: `/user/${session.username}/${config.runtimePort}`,
    previewPath: `/user/${session.username}`,
  });

  app.post("/spawn", async (req, res) => {
    const session = requireSession(req, res);
    if (!session) return;
    const status = await driver.spawn(session);
    // Lets preview iframes (which can't send headers) reach this user's proxied ports.
    res.cookie(config.sessionCookie, readToken(req)!, {
      httpOnly: true,
      sameSite: "lax",
      secure: config.secureCookies,
      path: `/user/${session.username}`,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(status === "running" ? 200 : 202).json(describe(session, status));
  });

  app.get("/status", async (req, res) => {
    const session = requireSession(req, res);
    if (!session) return;
    res.json(describe(session, await driver.status(session.username)));
  });

  app.post("/delete", async (req, res) => {
    const session = requireSession(req, res);
    if (!session) return;
    await driver.stop(session.username);
    res.clearCookie(config.sessionCookie, { path: `/user/${session.username}` });
    res.json({ message: "Workspace stopped" });
  });

  // ── Data plane: /user/<username>/<port>/* → that user's runtime ─────────────────────
  // No body parsing here: the raw request stream is piped straight through.
  app.use("/user", (req, res) => {
    const parsed = parseUserPath(req.originalUrl);
    if (!parsed) {
      res.status(404).json({ message: "Unknown workspace route" });
      return;
    }

    // CORS preflights never carry credentials; the runtime answers them itself.
    if (req.method !== "OPTIONS") {
      const session = authenticateRequest(req);
      if (!session || session.username !== parsed.username) {
        res.status(session ? 403 : 401).json({ message: "Not allowed to access this workspace" });
        return;
      }
    }

    const target = driver.target(parsed.username, parsed.port);
    if (!target) {
      res.status(503).json({ message: "Workspace is not running" });
      return;
    }

    req.url = parsed.rest;
    proxy.web(req, res, { target });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: express.NextFunction) => {
    console.error("❌ Orchestrator error:", err);
    res.status(500).json({ message: "Orchestrator error" });
  });

  const server = http.createServer(app);

  server.on("upgrade", (req, socket, head) => {
    const parsed = parseUserPath(req.url || "");
    const session = authenticateRequest(req);
    const target = parsed && driver.target(parsed.username, parsed.port);

    if (!parsed || !session || session.username !== parsed.username || !target) {
      socket.write("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
      socket.destroy();
      return;
    }

    req.url = parsed.rest;
    proxy.ws(req, socket, head, { target });
  });

  server.listen(config.port, () => {
    console.log(`✅ Nimbus orchestrator (${driver.name} mode) on http://localhost:${config.port}`);
  });

  const shutdown = async () => {
    await driver.shutdown?.();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("❌ Failed to start orchestrator:", err);
  process.exit(1);
});
