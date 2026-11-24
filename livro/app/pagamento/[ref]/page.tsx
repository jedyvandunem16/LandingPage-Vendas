import { db, kz } from "@/lib";
import { notFound } from "next/navigation";
import { Copy, ProofForm } from "../../forms";

export const dynamic = "force-dynamic";

export default async function Pay({ params }: { params: { ref: string } }) {
  const o = await db.order.findUnique({ where: { ref: params.ref } });
  if (!o) notFound();

  const e = process.env;
  const rows = [
    ["Titular", e.PAY_HOLDER || "Domingos Muginga António"],
    ["Banco", e.PAY_BANK],
    ["IBAN", e.PAY_IBAN || "0055.0000.8169.4888.1017.0"],
    ["Multicaixa Express", e.PAY_MULTICAIXA || "941583066"],
  ].filter((r) => r[1]);

  const isApproved = ["PAGAMENTO_CONFIRMADO", "LIVRO_ENVIADO"].includes(o.status);
  const downloadUrl = o.downloadToken ? `/api/download/${o.downloadToken}` : null;

  return (
    <main className="box" style={{ maxWidth: 600, margin: "40px auto", padding: "32px 24px" }}>
      <span style={{ fontSize: 11, color: "var(--primary)", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
        Empire GA · Encomenda {o.ref}
      </span>
      <h1 style={{ fontSize: 26, margin: "0 0 12px", color: "var(--title-blue)" }}>
        {isApproved ? "Pagamento Confirmado!" : "Instruções de Pagamento"}
      </h1>

      <p style={{ fontSize: 15, color: "var(--muted)", margin: "0 0 24px" }}>
        Titular da encomenda: <strong style={{ color: "#f8fafc" }}>{o.name}</strong> · Valor: <strong style={{ color: "var(--primary)" }}>{kz(o.amount)}</strong>
      </p>

      {/* ── CASO 1: PAGAMENTO JÁ APROVADO (LIBERA O LIVRO NA HORA) ── */}
      {isApproved ? (
        <div
          className="card"
          style={{
            padding: "24px 20px",
            borderLeft: "4px solid #10b981",
            background: "rgba(16, 185, 129, 0.04)",
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: 12, color: "#10b981", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", display: "block" }}>
            Acesso Liberado com Sucesso
          </span>
          <h2 style={{ fontSize: 20, margin: "8px 0 12px", color: "#f8fafc" }}>
            O teu Manual de Gestão de Vendas está pronto
          </h2>
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, margin: "0 auto 24px", maxWidth: 480 }}>
            O teu pagamento foi validado pela Empire GA. Clica no botão abaixo para descarregar o manual completo em formato PDF.
          </p>

          {downloadUrl && (
            <a
              href={downloadUrl}
              download
              style={{
                display: "inline-block",
                backgroundColor: "#22d3ee",
                color: "#060e12",
                fontSize: 15,
                fontWeight: 700,
                textDecoration: "none",
                padding: "14px 28px",
                borderRadius: 6,
                letterSpacing: 0.5,
              }}
            >
              Descarregar manual completo (PDF)
            </a>
          )}

          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 20, marginBottom: 0 }}>
            Podes guardar esta página nos teus favoritos para descarregar o livro quando quiseres.
          </p>
        </div>
      ) : (
        /* ── CASO 2: AGUARDANDO PAGAMENTO OU VALIDAÇÃO ── */
        <>
          {o.status === "EM_VALIDACAO" && (
            <div className="card" style={{ padding: 16, borderLeft: "4px solid var(--primary)", marginBottom: 20 }}>
              <strong style={{ color: "var(--primary)", display: "block", fontSize: 14 }}>
                Comprovativo em validação
              </strong>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 0" }}>
                Recebemos o teu comprovativo e estamos a validá-lo. Assim que for confirmado, esta página será atualizada com o teu livro para download imediato.
              </p>
            </div>
          )}

          {o.status === "REJEITADO" && (
            <div className="card" style={{ padding: 16, borderLeft: "4px solid #ef4444", marginBottom: 20 }}>
              <strong style={{ color: "#ef4444", display: "block", fontSize: 14 }}>
                Comprovativo não validado
              </strong>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 0" }}>
                {o.adminNote ? `Motivo: ${o.adminNote}. ` : ""}
                Por favor, verifica os dados e anexa um novo comprovativo abaixo.
              </p>
            </div>
          )}

          <div className="card" style={{ marginBottom: 24, padding: 20 }}>
            <span style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 12 }}>
              Dados para transferência / pagamento
            </span>
            {rows.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14 }}>
                {rows.map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
                    <span style={{ color: "var(--muted)" }}>{k}:</span>
                    <strong style={{ color: "#f8fafc" }}>{v}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p>Os dados de pagamento ainda não estão configurados. Contacta o suporte.</p>
            )}
            {rows.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <Copy text={rows.map((r) => r.join(": ")).join("\n") + "\nValor: " + kz(o.amount) + "\nReferência: " + o.ref} />
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 16, margin: "0 0 8px", color: "var(--title-blue)" }}>
              Enviar comprovativo de pagamento
            </h3>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 16px" }}>
              Após efetuar o pagamento, anexa o comprovativo abaixo para validação.
            </p>
            <ProofForm code={o.ref} name={o.name} />
          </div>
        </>
      )}
    </main>
  );
}

