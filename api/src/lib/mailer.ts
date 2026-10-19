import nodemailer, { type Transporter } from "nodemailer";
import { config } from "../config";

let transporter: Transporter | null = null;

if (config.smtp.host && config.smtp.user) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
  });
}

function layout(title: string, body: string, actionUrl: string, actionLabel: string): string {
  return `
  <div style="font-family:Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:36px 28px;border:1px solid #e5e7eb;border-radius:14px;background:#ffffff">
    <h2 style="color:#111827;font-size:22px;margin:0 0 16px">${title}</h2>
    <p style="color:#4b5563;font-size:15px;line-height:1.6">${body}</p>
    <div style="text-align:center;margin:28px 0">
      <a href="${actionUrl}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">${actionLabel}</a>
    </div>
    <p style="color:#9ca3af;font-size:12px;text-align:center">&copy; ${new Date().getFullYear()} Nimbus</p>
  </div>`;
}

async function send(to: string, subject: string, html: string, link: string) {
  if (!transporter) {
    // No SMTP configured (typical in local dev): print the link so the flow still works.
    console.log(`📧 [email to ${to}] ${subject}\n   ${link}`);
    return;
  }
  await transporter.sendMail({
    from: config.smtp.from || `"Nimbus" <${config.smtp.user}>`,
    to,
    subject,
    html,
  });
}

export async function sendVerificationEmail(email: string, token: string) {
  const link = `${config.frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;
  await send(
    email,
    "Verify your Nimbus email",
    layout(
      "Welcome to Nimbus ☁️",
      "Confirm your email address to activate your workspace. This link expires in 24 hours.",
      link,
      "Verify email"
    ),
    link
  );
}

export async function sendResetPasswordEmail(email: string, token: string) {
  const link = `${config.frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
  await send(
    email,
    "Reset your Nimbus password",
    layout(
      "🔐 Reset your password",
      "We received a request to reset your password. This link expires in 1 hour. If you didn't ask for this, you can ignore this email.",
      link,
      "Reset password"
    ),
    link
  );
}
