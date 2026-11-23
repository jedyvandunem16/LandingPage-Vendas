"use client";
import { useState } from "react";

export function OrderForm() {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      id="encomenda"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        setErr("");
        try {
          const form = e.currentTarget;
          const data = Object.fromEntries(new FormData(form).entries());
          const r = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          const j = await r.json();
          if (r.ok) {
            location.href = "/pagamento/" + encodeURIComponent(j.ref);
          } else {
            setErr(j.error || "Erro ao registar a encomenda.");
          }
        } catch {
          setErr("Falha de ligação. Verifica a internet e tenta novamente.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <input name="name" placeholder="Nome completo" required />
      <input name="email" type="email" placeholder="E-mail (o livro será enviado para aqui)" required />
      <input name="phone" placeholder="Telefone" required />
      <input name="province" placeholder="Província (opcional)" />
      <textarea name="notes" placeholder="Observações (opcional)" rows={2} />
      {err && <p className="err">{err}</p>}
      <button disabled={busy}>{busy ? "A registar..." : "Fazer encomenda"}</button>
    </form>
  );
}

export function Copy({ text }: { text: string }) {
  const [d, setD] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setD(true);
        setTimeout(() => setD(false), 2500);
      }}
    >
      {d ? "Copiado!" : "Copiar dados de pagamento"}
    </button>
  );
}

export function ProofForm({ code, name }: { code: string; name: string }) {
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        try {
          const r = await fetch("/api/proof", {
            method: "POST",
            body: new FormData(e.currentTarget),
          });
          const j = await r.json();
          setMsg({
            ok: r.ok,
            t: r.ok ? j.message : j.error || "Não foi possível enviar o comprovativo.",
          });
        } catch {
          setMsg({
            ok: false,
            t: "Falha de ligação. Verifica a internet e tenta novamente.",
          });
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Código da encomenda
        <input name="code" defaultValue={code} readOnly />
      </label>
      <label>
        Nome do comprador
        <input name="name" defaultValue={name} placeholder="Nome completo do comprador" required />
      </label>
      <label>
        Método de pagamento
        <select name="method" required>
          <option value="">Método de pagamento</option>
          <option>Transferência bancária</option>
          <option>Multicaixa Express</option>
        </select>
      </label>
      <label>
        Titular da conta de origem
        <input name="holder" placeholder="Nome do titular da conta que pagou" required />
      </label>
      <label>
        Valor transferido (Kz)
        <input name="amount" type="number" min="1" placeholder="Valor transferido (Kz)" required />
      </label>
      <label>
        Data do pagamento
        <input name="date" type="date" required />
      </label>
      <label>
        Comprovativo (PDF, JPG ou PNG; máximo 4 MB)
        <input
          name="file"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          required
        />
      </label>
      {msg && <p className={msg.ok ? "ok" : "err"}>{msg.t}</p>}
      <button disabled={busy}>{busy ? "A enviar..." : "Enviar comprovativo"}</button>
    </form>
  );
}
