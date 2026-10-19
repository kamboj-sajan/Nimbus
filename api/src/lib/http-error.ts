import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

// Express 5 forwards rejected promises from async handlers here.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({ message: err.issues[0]?.message ?? "Invalid request" });
    return;
  }
  console.error("❌ Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
}
