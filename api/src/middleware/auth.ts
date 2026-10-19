import type { NextFunction, Request, Response } from "express";
import { verifyToken, type TokenScope } from "../lib/tokens";

export interface AuthUser {
  id: string;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function bearer(req: Request): string | null {
  const header = req.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice(7) : null;
}

/** Requires a session token; `allow` lets specific routes also accept narrower scopes. */
export function authenticate(...allow: TokenScope[]) {
  const scopes: TokenScope[] = ["session", ...allow];
  return (req: Request, res: Response, next: NextFunction) => {
    const token = bearer(req);
    if (!token) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    for (const scope of scopes) {
      const payload = verifyToken(token, scope);
      if (payload) {
        req.user = { id: payload.sub, username: payload.username };
        next();
        return;
      }
    }
    res.status(401).json({ message: "Invalid or expired token" });
  };
}

export function currentUser(req: Request): AuthUser {
  if (!req.user) throw new Error("authenticate() middleware missing");
  return req.user;
}
