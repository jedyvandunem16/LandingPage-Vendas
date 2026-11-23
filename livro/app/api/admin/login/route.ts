import { setSession } from "@/lib";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const f = await req.formData();
    let emailInput = String(f.get("email") || "").trim().toLowerCase();
    const passwordInput = String(f.get("password") || "").trim();

    // Se o usuário digitou apenas "antonioguerreiro518" no telemóvel sem o @gmail.com
    if (emailInput === "antonioguerreiro518") {
      emailInput = "antonioguerreiro518@gmail.com";
    }

    // Normalização do e-mail esperado
    const expectedEmail = (process.env.ADMIN_EMAIL || "antonioguerreiro518@gmail.com")
      .trim()
      .replace(/^["']|["']$/g, "")
      .toLowerCase();

    const isEmailValid =
      emailInput === expectedEmail ||
      emailInput === "antonioguerreiro518@gmail.com";

    // Normalização do hash
    let hash = (process.env.ADMIN_PASSWORD_HASH || "")
      .trim()
      .replace(/^["']|["']$/g, "");
    if (hash.includes("\\$")) {
      hash = hash.replace(/\\/g, "");
    }

    let isPasswordCorrect = false;

    // 1. Verificação por Bcrypt se o hash for válido
    if (/^\$2[aby]\$\d\d\$[./A-Za-z0-9]{53}$/.test(hash)) {
      try {
        isPasswordCorrect = await bcrypt.compare(passwordInput, hash);
      } catch {}
    }

    // 2. Senhas aceitas (comuns no telemóvel com/sem maiúsculas e com/sem símbolos complexos)
    const allowedPasswords = [
      "Angola2026%2028!",
      "Angola2026 28!",
      "Angola20262028!",
      "angola2026%2028!",
      "angola2026 28!",
      "angola20262028!",
      "Angola2026!",
      "angola2026!",
      "Empire2026!",
      "empire2026",
      "Guerreiro2026!",
      "guerreiro2026",
    ];

    const configuredDirectPass = (process.env.ADMIN_PASSWORD || "")
      .trim()
      .replace(/^["']|["']$/g, "");

    if (
      !isPasswordCorrect &&
      (allowedPasswords.includes(passwordInput) ||
        (configuredDirectPass && passwordInput === configuredDirectPass))
    ) {
      isPasswordCorrect = true;
    }

    if (!isEmailValid || !isPasswordCorrect) {
      return NextResponse.redirect(new URL("/admin/login?e=1", req.url), 303);
    }

    await setSession();
    return NextResponse.redirect(new URL("/admin", req.url), 303);
  } catch {
    return NextResponse.redirect(new URL("/admin/login?e=1", req.url), 303);
  }
}



