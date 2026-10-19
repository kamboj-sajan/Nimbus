import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { config } from "../config";
import { db } from "../db";
import { users, type User } from "../db/schema";
import { HttpError } from "../lib/http-error";
import { sendResetPasswordEmail, sendVerificationEmail } from "../lib/mailer";
import { passwordFingerprint, signToken, verifyToken } from "../lib/tokens";
import { authenticate, currentUser } from "../middleware/auth";
import { Workspace } from "../storage";

const router = Router();

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[A-Za-z]/, "Password must contain at least one letter")
  .regex(/\d/, "Password must contain at least one number");

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  // Lowercase only: usernames become Kubernetes resource names and URL segments.
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,32}$/, "Username must be 3-32 characters: letters, numbers, underscores"),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password,
});

const loginSchema = z.object({
  // Accepts either an email address or a username.
  email: z.string().trim().toLowerCase().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

function publicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
  };
}

function sessionToken(user: User) {
  return signToken({ sub: user.id, username: user.username, scope: "session" }, config.tokenTtl as any);
}

async function findUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

router.post("/register", async (req, res) => {
  const input = registerSchema.parse(req.body);

  const [conflict] = await db
    .select({ email: users.email, username: users.username })
    .from(users)
    .where(or(eq(users.email, input.email), eq(users.username, input.username)));
  if (conflict) {
    throw new HttpError(
      409,
      conflict.email === input.email ? "Email is already in use" : "Username is already taken"
    );
  }

  const [user] = await db
    .insert(users)
    .values({
      name: input.name,
      username: input.username,
      email: input.email,
      password: await bcrypt.hash(input.password, 10),
      isVerified: !config.requireEmailVerification,
    })
    .returning();

  await new Workspace(user.username).seedStarterProject();

  if (config.requireEmailVerification) {
    const token = signToken({ sub: user.id, username: user.username, scope: "verify-email" }, "1d");
    await sendVerificationEmail(user.email, token);
  }

  res.status(201).json({
    message: config.requireEmailVerification
      ? "Account created! Check your email to verify your address."
      : "Account created! You can sign in now.",
    requiresVerification: config.requireEmailVerification,
  });
});

router.post("/login", async (req, res) => {
  const { email: identifier, password: plain } = loginSchema.parse(req.body);

  const [user] = await db
    .select()
    .from(users)
    .where(identifier.includes("@") ? eq(users.email, identifier) : eq(users.username, identifier));

  if (!user || !(await bcrypt.compare(plain, user.password))) {
    throw new HttpError(401, "Invalid email or password");
  }
  if (user.locked) throw new HttpError(403, "This account is locked");
  if (!user.isVerified) throw new HttpError(403, "Email not verified. Please check your inbox.");

  res.json({ message: "Login successful", token: sessionToken(user), user: publicUser(user) });
});

// Tokens are stateless; the client discards its copy.
router.post("/logout", (_req, res) => {
  res.json({ message: "Logged out" });
});

router.get("/me", authenticate(), async (req, res) => {
  const user = await findUserById(currentUser(req).id);
  if (!user) throw new HttpError(404, "User not found");
  res.json({ user: publicUser(user) });
});

router.get("/verify-email", async (req, res) => {
  const payload = verifyToken(String(req.query.token ?? ""), "verify-email");
  if (!payload) throw new HttpError(400, "Invalid or expired verification link");

  const user = await findUserById(payload.sub);
  if (!user) throw new HttpError(404, "User not found");

  if (!user.isVerified) {
    await db.update(users).set({ isVerified: true }).where(eq(users.id, user.id));
  }
  await new Workspace(user.username).seedStarterProject();
  res.json({ message: "Email verified — you can sign in now." });
});

router.post("/forgot-password", async (req, res) => {
  const { email } = z.object({ email: z.string().trim().toLowerCase().email() }).parse(req.body);
  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (user) {
    const token = signToken(
      {
        sub: user.id,
        username: user.username,
        scope: "reset-password",
        pwv: passwordFingerprint(user.password),
      },
      "1h"
    );
    await sendResetPasswordEmail(user.email, token);
  }

  // Same response either way so the endpoint can't be used to probe for accounts.
  res.json({ message: "If an account exists for that email, a reset link is on its way." });
});

router.post("/reset-password", async (req, res) => {
  const input = z.object({ token: z.string().min(1), password }).parse(req.body);
  const payload = verifyToken(input.token, "reset-password");
  if (!payload) throw new HttpError(400, "Invalid or expired reset link");

  const user = await findUserById(payload.sub);
  if (!user || payload.pwv !== passwordFingerprint(user.password)) {
    throw new HttpError(400, "This reset link has already been used");
  }

  await db
    .update(users)
    .set({ password: await bcrypt.hash(input.password, 10) })
    .where(eq(users.id, user.id));
  res.json({ message: "Password updated — you can sign in now." });
});

router.post("/change-password", authenticate(), async (req, res) => {
  const input = z
    .object({ oldPassword: z.string().min(1, "Current password is required"), newPassword: password })
    .parse(req.body);

  const user = await findUserById(currentUser(req).id);
  if (!user) throw new HttpError(404, "User not found");
  if (!(await bcrypt.compare(input.oldPassword, user.password))) {
    throw new HttpError(400, "Current password is incorrect");
  }

  await db
    .update(users)
    .set({ password: await bcrypt.hash(input.newPassword, 10) })
    .where(eq(users.id, user.id));
  res.json({ message: "Password changed" });
});

export default router;
