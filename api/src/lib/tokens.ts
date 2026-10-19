import jwt, { type SignOptions } from "jsonwebtoken";
import { config } from "../config";

/**
 * Every token carries a scope so a password-reset or hydration token can never be
 * replayed as a login session. The orchestrator shares JWT_SECRET to verify sessions.
 */
export type TokenScope = "session" | "verify-email" | "reset-password" | "snapshot";

export interface TokenPayload {
  sub: string;
  username: string;
  scope: TokenScope;
  /** Fingerprint of the password hash: reset links die once the password changes. */
  pwv?: string;
}

export function signToken(payload: TokenPayload, expiresIn: SignOptions["expiresIn"]): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn });
}

export function verifyToken(token: string, scope: TokenScope): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
    return decoded.scope === scope ? decoded : null;
  } catch {
    return null;
  }
}

export function passwordFingerprint(hash: string): string {
  return hash.slice(-12);
}
