import { db, isAdmin, kz } from "@/lib";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  EM_VALIDACAO: {
    label: "Aguardando aprovação",
    bg: "rgba(34, 211, 238, 0.08)",
    color: "var(--primary)",
    border: "rgba(34, 211, 238, 0.3)",
  },
  LIVRO_ENVIADO: {
    label: "Livro entregue",
    bg: "rgba(16, 185, 129, 0.1)",
    color: "#10b981",
    border: "rgba(16, 185, 129, 0.3)",
  },
  PAGAMENTO_CONFIRMADO: {
    label: "Pago (envio pendente)",
    bg: "rgba(150, 195, 225, 0.1)",
    color: "var(--title-blue)",
    border: "rgba(150, 195, 225, 0.3)",
  },
  AGUARDANDO_PAGAMENTO: {
    label: "Aguardando pagamento",
    bg: "rgba(148, 163, 184, 0.08)",
    color: "var(--muted)",
    border: "rgba(148, 163, 184, 0.2)",
  },
  REJEITADO: {
    label: "Rejeitado",
    bg: "rgba(239, 68, 68, 0.1)",
    color: "#ef4444",
    border: "rgba(239, 68, 68, 0.3)",
  },
  FALHA_ENVIO: {
    label: "Falha no envio",
    bg: "rgba(239, 68, 68, 0.1)",
    color: "#ef4444",
    border: "rgba(239, 68, 68, 0.3)",
  },
};

export default async function Admin() {
  if (!(await isAdmin())) redirect("/admin/login");

  let os: any[] = [];
  let dbError = "";

  try {
    os = await db.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { events: { orderBy: { at: "desc" } } },
    });
  } catch {
    dbError = "Não foi possível carregar as encomendas da base de dados.";
  }

  const pendingValidation = os.filter((o) => o.status === "EM_VALIDACAO");
  const delivered = os.filter((o) => o.status === "LIVRO_ENVIADO");
  const paid = os.filter((o) =>
    ["PAGAMENTO_CONFIRMADO", "LIVRO_ENVIADO", "FALHA_ENVIO"].includes(o.status)
  );
  const totalRevenue = paid.reduce((acc, o) => acc + (o.amount || 0), 0);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 16px 80px" }}>
      {/* ── Cabeçalho ── */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          paddingBottom: 20,
          borderBottom: "1px solid var(--line)",
          marginBottom: 28,
        }}
      >
        <div>
          <span style={{ fontSize: 11, color: "var(--primary)", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>
            Empire GA · Painel de Gestão
          </span>
          <h1 style={{ fontSize: 24, margin: "4px 0 0", color: "var(--title-blue)", fontWeight: 700 }}>
            Encomendas
          </h1>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a
            href="/"
            target="_blank"
            style={{
              padding: "7px 14px",
              fontSize: 13,
              borderRadius: 6,
              border: "1px solid var(--line)",
              color: "var(--muted)",
              textDecoration: "none",
            }}
          >
            Ver landing page
          </a>
          <form action="/api/admin/logout" method="post">
            <button
              type="submit"
              style={{
                padding: "7px 14px",
                fontSize: 13,
                borderRadius: 6,
                background: "transparent",
                color: "#ef4444",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                cursor: "pointer",
              }}
            >
              Terminar sessão
            </button>
          </form>
        </div>
      </header>

      {/* ── Indicadores ── */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 14,
          marginBottom: 32,
        }}
      >
        <div className="card" style={{ padding: 18, borderLeft: "3px solid var(--line)" }}>
          <span style={{ fontSize: 12, color: "var(--muted)", display: "block" }}>Total de encomendas</span>
          <strong style={{ fontSize: 24, color: "#f8fafc", display: "block", marginTop: 4 }}>
            {os.length}
          </strong>
        </div>

        <div
          className="card"
          style={{
            padding: 18,
            borderLeft: "3px solid var(--primary)",
            background: pendingValidation.length > 0 ? "rgba(34, 211, 238, 0.03)" : undefined,
          }}
        >
          <span style={{ fontSize: 12, color: "var(--primary)", display: "block", fontWeight: 600 }}>
            Por validar
          </span>
          <strong style={{ fontSize: 24, color: "var(--primary)", display: "block", marginTop: 4 }}>
            {pendingValidation.length}
          </strong>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: "3px solid #10b981" }}>
          <span style={{ fontSize: 12, color: "#10b981", display: "block", fontWeight: 600 }}>
            Livros entregues
          </span>
          <strong style={{ fontSize: 24, color: "#10b981", display: "block", marginTop: 4 }}>
            {delivered.length}
          </strong>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: "3px solid var(--title-blue)" }}>
          <span style={{ fontSize: 12, color: "var(--muted)", display: "block" }}>Receita confirmada</span>
          <strong style={{ fontSize: 22, color: "var(--title-blue)", display: "block", marginTop: 4 }}>
            {kz(totalRevenue)}
          </strong>
        </div>
      </section>

      {/* ── Aviso de Erro de BD ── */}
      {dbError && (
        <div className="card" style={{ borderLeft: "3px solid #ef4444", margin: "20px 0" }}>
          <p style={{ margin: 0, fontWeight: 600, color: "#ef4444" }}>
            {dbError}
          </p>
        </div>
      )}

      {/* ── Lista de Pedidos ── */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, margin: 0, color: "var(--title-blue)" }}>
            Registo de Encomendas ({os.length})
          </h2>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>Ordem cronológica inversa</span>
        </div>

        {os.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "48px 20px", color: "var(--muted)" }}>
            <p style={{ fontSize: 15, margin: 0 }}>Nenhuma encomenda registada ainda.</p>
            <p style={{ fontSize: 13, marginTop: 6 }}>As novas compras realizadas na landing page serão listadas aqui.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {os.map((o) => {
              const statusCfg = STATUS_CONFIG[o.status] || {
                label: o.status,
                bg: "rgba(148, 163, 184, 0.08)",
                color: "var(--muted)",
                border: "var(--line)",
              };

              const cleanPhone = (o.phone || "").replace(/[^0-9]/g, "");
              const waUrl = cleanPhone.length >= 9 ? `https://wa.me/244${cleanPhone.slice(-9)}` : null;

              return (
                <div
                  key={o.id}
                  className="card"
                  style={{
                    padding: "18px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                    border: o.status === "EM_VALIDACAO" ? "1px solid rgba(34, 211, 238, 0.4)" : "1px solid var(--line)",
                    background: o.status === "EM_VALIDACAO" ? "rgba(34, 211, 238, 0.02)" : undefined,
                  }}
                >
                  {/* Linha 1: Ref, Data e Badge de Estado */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 10,
                      paddingBottom: 10,
                      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    <div>
                      <span style={{ fontFamily: "monospace", fontSize: 13, color: "var(--primary)", fontWeight: 700 }}>
                        {o.ref}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 10 }}>
                        {new Date(o.createdAt).toLocaleString("pt-AO", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div
                      style={{
                        padding: "3px 10px",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        backgroundColor: statusCfg.bg,
                        color: statusCfg.color,
                        border: `1px solid ${statusCfg.border}`,
                      }}
                    >
                      {statusCfg.label}
                    </div>
                  </div>

                  {/* Linha 2: Dados do Cliente e Pagamento */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                      gap: 16,
                    }}
                  >
                    {/* Comprador */}
                    <div>
                      <span style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Comprador
                      </span>
                      <strong style={{ display: "block", fontSize: 15, color: "#f8fafc", marginTop: 2 }}>
                        {o.name}
                      </strong>
                      <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4, display: "flex", flexDirection: "column", gap: 3 }}>
                        <a href={`mailto:${o.email}`} style={{ color: "var(--primary)", textDecoration: "none" }}>
                          {o.email}
                        </a>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span>{o.phone}</span>
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              style={{
                                color: "#10b981",
                                textDecoration: "none",
                                fontSize: 11,
                                background: "rgba(16, 185, 129, 0.1)",
                                border: "1px solid rgba(16, 185, 129, 0.25)",
                                padding: "1px 6px",
                                borderRadius: 4,
                              }}
                            >
                              WhatsApp
                            </a>
                          )}
                        </div>
                        {o.province && <span>{o.province}</span>}
                      </div>
                    </div>

                    {/* Pagamento e Comprovativo */}
                    <div>
                      <span style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Valor e comprovativo
                      </span>
                      <strong style={{ display: "block", fontSize: 17, color: "var(--title-blue)", marginTop: 2 }}>
                        {kz(o.amount)}
                      </strong>

                      {o.proofPath ? (
                        <div style={{ marginTop: 6, fontSize: 13 }}>
                          <span style={{ color: "var(--muted)", display: "block" }}>
                            Método: <strong style={{ color: "#cbd5e1" }}>{o.proofMethod || "Transferência"}</strong>
                          </span>
                          <span style={{ color: "var(--muted)", display: "block" }}>
                            Titular declarado: <strong style={{ color: "#cbd5e1" }}>{o.proofHolder || "—"}</strong>
                          </span>
                          <a
                            href={`/api/admin/proof/${o.id}`}
                            target="_blank"
                            style={{
                              display: "inline-block",
                              marginTop: 8,
                              padding: "5px 12px",
                              borderRadius: 4,
                              background: "rgba(34, 211, 238, 0.08)",
                              color: "var(--primary)",
                              textDecoration: "none",
                              fontSize: 12,
                              fontWeight: 600,
                              border: "1px solid rgba(34, 211, 238, 0.25)",
                            }}
                          >
                            Abrir comprovativo
                          </a>
                        </div>
                      ) : (
                        <span style={{ display: "block", marginTop: 6, fontSize: 13, color: "var(--muted)" }}>
                          Nenhum comprovativo anexado.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Estado de Envio ou Notas */}
                  {(o.sendStatus || o.sendError || o.adminNote) && (
                    <div
                      style={{
                        padding: "8px 12px",
                        borderRadius: 4,
                        background: "rgba(255, 255, 255, 0.02)",
                        border: "1px solid rgba(255, 255, 255, 0.05)",
                        fontSize: 12,
                        color: "var(--muted)",
                      }}
                    >
                      {o.sendStatus && <div><strong style={{ color: "#cbd5e1" }}>Envio:</strong> {o.sendStatus}</div>}
                      {o.sendError && <div style={{ color: "#ef4444", marginTop: 2 }}><strong>Aviso:</strong> {o.sendError}</div>}
                      {o.adminNote && <div style={{ color: "var(--title-blue)", marginTop: 2 }}><strong>Nota interna:</strong> {o.adminNote}</div>}
                    </div>
                  )}

                  {/* Linha de Ações */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 10,
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: 10,
                      borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {o.status === "EM_VALIDACAO" && (
                        <>
                          <form method="post" action="/api/admin/action">
                            <input type="hidden" name="id" value={o.id} />
                            <input type="hidden" name="action" value="approve" />
                            <button
                              type="submit"
                              style={{
                                background: "#10b981",
                                color: "#060e12",
                                fontWeight: 700,
                                padding: "8px 16px",
                                borderRadius: 6,
                                border: "none",
                                cursor: "pointer",
                                fontSize: 13,
                              }}
                            >
                              Aprovar e enviar livro
                            </button>
                          </form>

                          <form
                            method="post"
                            action="/api/admin/action"
                            style={{ display: "inline-flex", gap: 6 }}
                          >
                            <input type="hidden" name="id" value={o.id} />
                            <input type="hidden" name="action" value="reject" />
                            <input
                              name="note"
                              placeholder="Motivo da rejeição"
                              style={{ padding: "6px 10px", fontSize: 12, width: 160 }}
                              required
                            />
                            <button
                              type="submit"
                              style={{
                                background: "transparent",
                                color: "#ef4444",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                padding: "6px 12px",
                                borderRadius: 6,
                                cursor: "pointer",
                                fontSize: 12,
                              }}
                            >
                              Rejeitar
                            </button>
                          </form>
                        </>
                      )}

                      {["PAGAMENTO_CONFIRMADO", "FALHA_ENVIO", "LIVRO_ENVIADO"].includes(o.status) && (
                        <>
                          {waUrl && (
                            <a
                              href={`https://wa.me/244${cleanPhone.slice(-9)}?text=${encodeURIComponent(
                                `Olá ${o.name}! O teu pagamento do Manual de Gestão de Vendas foi confirmado pela Empire GA. Podes descarregar o teu livro oficial agora através deste link seguro: https://empire-ga.vercel.app/api/download/${o.downloadToken || ""} - Desejamos-te excelentes vendas!`
                              )}`}
                              target="_blank"
                              style={{
                                background: "#10b981",
                                color: "#060e12",
                                fontWeight: 700,
                                padding: "7px 14px",
                                borderRadius: 6,
                                textDecoration: "none",
                                fontSize: 12,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              Enviar livro por WhatsApp
                            </a>
                          )}

                          <a
                            href={`/pagamento/${o.ref}`}
                            target="_blank"
                            style={{
                              background: "rgba(34, 211, 238, 0.08)",
                              color: "var(--primary)",
                              border: "1px solid rgba(34, 211, 238, 0.25)",
                              padding: "7px 14px",
                              borderRadius: 6,
                              textDecoration: "none",
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            Ver página com download
                          </a>
                        </>
                      )}
                    </div>

                    {/* Eliminar registo */}
                    <form
                      method="post"
                      action="/api/admin/action"
                      // @ts-ignore
                      onSubmit="return confirm('Eliminar este registo de encomenda permanentemente?')"
                    >
                      <input type="hidden" name="id" value={o.id} />
                      <input type="hidden" name="action" value="delete" />
                      <button
                        type="submit"
                        style={{
                          background: "transparent",
                          color: "var(--muted)",
                          border: "none",
                          fontSize: 12,
                          cursor: "pointer",
                          padding: "6px 8px",
                          opacity: 0.75,
                        }}
                        title="Eliminar encomenda"
                      >
                        Eliminar registo
                      </button>
                    </form>
                  </div>

                  {/* Histórico recolhível */}
                  {o.events && o.events.length > 0 && (
                    <details style={{ fontSize: 11, color: "var(--muted)", marginTop: -4 }}>
                      <summary style={{ cursor: "pointer", opacity: 0.7 }}>
                        Histórico ({o.events.length} registos)
                      </summary>
                      <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3, paddingLeft: 6 }}>
                        {o.events.map((e: any) => (
                          <div key={e.id}>
                            {new Date(e.at).toLocaleString("pt-AO")} · {e.text}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}


