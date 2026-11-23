import { PrismaClient } from "@prisma/client";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import nodemailer from "nodemailer";
import crypto from "crypto";
export const db: PrismaClient = (globalThis as any).p ?? ((globalThis as any).p = new PrismaClient());
export function requestThrottleKey(req: Request, scope: string) {
  const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return `${scope}:${crypto.createHash("sha256").update(ip).digest("hex")}`;
}
export async function consumeRateLimit(key: string, maxAttempts: number, windowMs: number) {
  try {
    const now = new Date();
    const current = await db.requestThrottle.findUnique({ where: { key } });
    if (current?.lockedUntil && current.lockedUntil > now) return false;
    const cutoff = new Date(now.getTime() - windowMs);
    const lockUntil = new Date(now.getTime() + windowMs);
    const rows = await db.$queryRaw<Array<{ attempts: number; lockedUntil: Date | null }>>`
      INSERT INTO "RequestThrottle" ("key", "attempts", "windowStartedAt", "lockedUntil")
      VALUES (${key}, 1, ${now}, NULL)
      ON CONFLICT ("key") DO UPDATE SET
        "attempts" = CASE WHEN "RequestThrottle"."windowStartedAt" < ${cutoff} THEN 1 ELSE "RequestThrottle"."attempts" + 1 END,
        "windowStartedAt" = CASE WHEN "RequestThrottle"."windowStartedAt" < ${cutoff} THEN ${now} ELSE "RequestThrottle"."windowStartedAt" END,
        "lockedUntil" = CASE WHEN (CASE WHEN "RequestThrottle"."windowStartedAt" < ${cutoff} THEN 1 ELSE "RequestThrottle"."attempts" + 1 END) >= ${maxAttempts} THEN ${lockUntil} ELSE NULL END
      RETURNING "attempts", "lockedUntil"
    `;
    return !rows[0] || rows[0].attempts <= maxAttempts;
  } catch {
    return true;
  }
}
const key = () => new TextEncoder().encode(process.env.AUTH_SECRET!);
export async function setSession() {
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) throw new Error("AUTH_SECRET deve ter pelo menos 32 caracteres.");
  const t = await new SignJWT({ role: "admin" }).setProtectedHeader({ alg: "HS256" }).setIssuer("manual-vendas").setAudience("admin").setIssuedAt().setExpirationTime("8h").sign(key());
  cookies().set("s", t, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 8 * 60 * 60 });
}
export async function isAdmin() {
  const t = cookies().get("s")?.value;
  if (!t) return false;
  try { const { payload } = await jwtVerify(t, key(), { issuer: "manual-vendas", audience: "admin" }); return payload.role === "admin"; } catch { return false; }
}
export const mail = (to: string, subject: string, text: string) =>
  nodemailer.createTransport({ host: process.env.SMTP_HOST, port: +(process.env.SMTP_PORT || 587), auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } })
    .sendMail({ from: process.env.MAIL_FROM, to, subject, text });
export const price = () => +(process.env.BOOK_PRICE_KZ || 3775);
export const kz = (n: number) => n.toLocaleString("pt-AO") + " Kz";
