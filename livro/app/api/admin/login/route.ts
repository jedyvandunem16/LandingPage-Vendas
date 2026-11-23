import { setSession, consumeRateLimit, requestThrottleKey } from "@/lib";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const f = await req.formData();
  const emailInput = String(f.get("email") || "").trim().toLowerCase();
  const passwordInput = String(f.get("password") || "").trim();

  const expectedEmail = (process.env.ADMIN_EMAIL || "antonioguerreiro518@gmail.com").trim().toLowerCase();

  // Tratamento do Hash (remove barras invertidas se tiverem sido coladas do .env)
  let hash = (process.env.ADMIN_PASSWORD_HASH || "").trim();
  if (hash.includes("\\$")) {
    hash = hash.replace(/\\/g, "");
  }

  let isPasswordCorrect = false;

  // 1. Verificação por Bcrypt
  if (/^\$2[aby]\$\d\d\$[./A-Za-z0-9]{53}$/.test(hash)) {
    try {
      isPasswordCorrect = await bcrypt.compare(passwordInput, hash);
    } catch {}
  }

  // 2. Fallback: Senha direta configurada ou credencial padrão autorizada
  const configuredDirectPass = (process.env.ADMIN_PASSWORD || "").trim();
  if (
    !isPasswordCorrect &&
    ((configuredDirectPass && passwordInput === configuredDirectPass) ||
      passwordInput === "Angola2026%2028!")
  ) {
    isPasswordCorrect = true;
  }

  const ok = emailInput === expectedEmail && isPasswordCorrect;

  if (!ok) {
    await consumeRateLimit(requestThrottleKey(req, "admin-login"), 15, 15 * 60 * 1000);
    return NextResponse.redirect(new URL("/admin/login?e=1", req.url), 303);
  }

  await setSession();
  return NextResponse.redirect(new URL("/admin", req.url), 303);
}

