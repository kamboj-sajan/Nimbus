import type { IncomingMessage } from "http";
import jwt from "jsonwebtoken";
import { config } from "../config";

export interface Session {
  userId: string;
  username: string;
}

function parseCookies(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const part of (header || "").split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    cookies[part.slice(0, eq).trim()] = decodeURIComponent(part.slice(eq + 1).trim());
  }
  return cookies;
}

/**
 * Accepts the session token from (in order) an Authorization header, a `token` query param
 * (WebSocket handshakes can't set headers) or the session cookie (preview iframes).
 */
export function readToken(req: IncomingMessage): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);

  const url = new URL(req.url || "/", "http://localhost");
  const queryToken = url.searchParams.get("token");
  if (queryToken) return queryToken;

  return parseCookies(req.headers.cookie)[config.sessionCookie] || null;
}

export function verifySession(token: string | null): Session | null {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, config.jwtSecret) as {
      sub: string;
      username: string;
      scope: string;
    };
    if (payload.scope !== "session") return null;
    return { userId: payload.sub, username: payload.username };
  } catch {
    return null;
  }
}

export function authenticateRequest(req: IncomingMessage): Session | null {
  return verifySession(readToken(req));
}

/** Short-lived, read-only token a runtime uses to download the user's files. */
export function mintSnapshotToken(session: Session, expiresIn: jwt.SignOptions["expiresIn"]) {
  return jwt.sign(
    { sub: session.userId, username: session.username, scope: "snapshot" },
    config.jwtSecret,
    { expiresIn }
  );
}
