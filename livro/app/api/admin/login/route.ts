import { setSession, consumeRateLimit, requestThrottleKey } from "@/lib";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (!(await consumeRateLimit(requestThrottleKey(req, "admin-login"), 8, 15 * 60 * 1000))) {
    return NextResponse.redirect(new URL("/admin/login?e=1&locked=1", req.url), 303);
  }
  const f = await req.formData();
  const emailInput = String(f.get("email") || "").trim().toLowerCase();
  const passwordInput = String(f.get("password") || "").trim();
  const expectedEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const hash = process.env.ADMIN_PASSWORD_HASH || "";
  const validHash = /^\$2[aby]\$\d\d\$[./A-Za-z0-9]{53}$/.test(hash);

  const ok =
    emailInput === expectedEmail &&
    validHash &&
    (await bcrypt.compare(passwordInput, hash));

  if (!ok) return NextResponse.redirect(new URL("/admin/login?e=1", req.url), 303);
  await setSession();
  return NextResponse.redirect(new URL("/admin", req.url), 303);
}
