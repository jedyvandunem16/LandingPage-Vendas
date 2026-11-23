"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const locked = searchParams.get("locked");
  const error = searchParams.get("e");

  return (
    <main className="box" style={{ maxWidth: 420, margin: "60px auto", padding: "32px 24px" }}>
      <h1 style={{ fontSize: 24, marginBottom: 8, textAlign: "center" }}>Painel de Gestão</h1>
      <p style={{ fontSize: 13, color: "var(--muted)", textAlign: "center", marginBottom: 24 }}>
        Empire GA — Acesso Restrito
      </p>

      <form
        method="post"
        action="/api/admin/login"
        onSubmit={() => setLoading(true)}
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        <div>
          <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>
            E-mail de Administrador
          </label>
          <input
            name="email"
            type="email"
            placeholder="antonioguerreiro518@gmail.com"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            required
            defaultValue="antonioguerreiro518@gmail.com"
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>
            Palavra-passe
          </label>
          <div style={{ position: "relative" }}>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Digita a tua palavra-passe"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              required
              style={{ width: "100%", paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                padding: "4px 8px",
                color: "var(--primary)",
                boxShadow: "none",
              }}
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>
        </div>

        {locked ? (
          <p className="err" style={{ fontSize: 13, margin: "4px 0" }}>
            Demasiadas tentativas incorretas. Aguarda alguns minutos antes de tentar novamente.
          </p>
        ) : error ? (
          <p className="err" style={{ fontSize: 13, margin: "4px 0" }}>
            Dados incorretos. Confirma a tua palavra-passe e tenta novamente.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 8,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {loading ? "A entrar..." : "Entrar no Painel"}
        </button>
      </form>
    </main>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<main className="box" style={{ maxWidth: 420, margin: "60px auto", textAlign: "center" }}>A carregar...</main>}>
      <LoginForm />
    </Suspense>
  );
}


