import { db, isAdmin, kz } from "@/lib";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  EM_VALIDACAO: {
    label: "Aguardando Aprovação",
    bg: "rgba(245, 158, 11, 0.15)",
    color: "#f59e0b",
    icon: "⏳",
  },
  LIVRO_ENVIADO: {
    label: "Livro Entregue",
    bg: "rgba(16, 185, 129, 0.15)",
    color: "#10b981",
    icon: "✅",
  },
  PAGAMENTO_CONFIRMADO: {
    label: "Pago (Envio Pendente)",
    bg: "rgba(34, 211, 238, 0.15)",
    color: "#22d3ee",
    icon: "📘",
  },
  AGUARDANDO_PAGAMENTO: {
    label: "Aguardando Pagamento",
    bg: "rgba(148, 163, 184, 0.15)",
    color: "#94a3b8",
    icon: "🕒",
  },
  REJEITADO: {
    label: "Rejeitado",
    bg: "rgba(239, 68, 68, 0.15)",
    color: "#ef4444",
    icon: "✕",
  },
  FALHA_ENVIO: {
    label: "Falha no Envio",
    bg: "rgba(249, 115, 22, 0.15)",
    color: "#f97316",
    icon: "⚠️",
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
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px 80px" }}>
      {/* ── Topo do Painel ── */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          paddingBottom: 20,
          borderBottom: "1px solid var(--line)",
          marginBottom: 24,
        }}
      >
        <div>
          <span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 700, letterSpacing: 1 }}>
            EMPIRE GA · ADMINISTRAÇÃO
          </span>
          <h1 style={{ fontSize: 26, margin: "4px 0 0", color: "#f8fafc" }}>Gestão de Vendas</h1>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a
            href="/"
            target="_blank"
            style={{
              padding: "8px 14px",
              fontSize: 13,
              borderRadius: 8,
              border: "1px solid var(--line)",
              color: "var(--muted)",
              textDecoration: "none",
            }}
          >
            Ver Site ↗
          </a>
          <form action="/api/admin/logout" method="post">
            <button
              type="submit"
              style={{
                padding: "8px 14px",
                fontSize: 13,
                borderRadius: 8,
                background: "rgba(239, 68, 68, 0.1)",
                color: "#f87171",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                cursor: "pointer",
              }}
            >
              Terminar Sessão
            </button>
          </form>
        </div>
      </header>

      {/* ── Cards de Estatísticas ── */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 14,
          marginBottom: 32,
        }}
      >
        <div className="card" style={{ padding: 18, borderLeft: "4px solid var(--primary)" }}>
          <span style={{ fontSize: 12, color: "var(--muted)", display: "block" }}>Total de Pedidos</span>
          <strong style={{ fontSize: 26, color: "#fff", display: "block", marginTop: 4 }}>
            {os.length}
          </strong>
        </div>

        <div
          className="card"
          style={{
            padding: 18,
            borderLeft: "4px solid #f59e0b",
            background: pendingValidation.length > 0 ? "rgba(245, 158, 11, 0.05)" : undefined,
          }}
        >
          <span style={{ fontSize: 12, color: "#f59e0b", display: "block", fontWeight: 600 }}>
            ⏳ Por Validar
          </span>
          <strong style={{ fontSize: 26, color: "#f59e0b", display: "block", marginTop: 4 }}>
            {pendingValidation.length}
          </strong>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: "4px solid #10b981" }}>
          <span style={{ fontSize: 12, color: "#10b981", display: "block", fontWeight: 600 }}>
            ✅ Livros Entregues
          </span>
          <strong style={{ fontSize: 26, color: "#10b981", display: "block", marginTop: 4 }}>
            {delivered.length}
          </strong>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: "4px solid var(--title-blue)" }}>
          <span style={{ fontSize: 12, color: "var(--muted)", display: "block" }}>Faturação Confirmada</span>
          <strong style={{ fontSize: 24, color: "var(--title-blue)", display: "block", marginTop: 4 }}>
            {kz(totalRevenue)}
          </strong>
        </div>
      </section>

      {/* ── Aviso de Erro de DB se houver ── */}
      {dbError && (
        <div className="card" style={{ borderLeft: "4px solid var(--danger)", margin: "20px 0" }}>
          <p className="err" style={{ margin: 0, fontWeight: 700 }}>
            ⚠️ {dbError}
          </p>
        </div>
      )}

      {/* ── Lista de Pedidos ── */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, margin: 0 }}>Lista de Encomendas ({os.length})</h2>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>Mais recentes primeiro</span>
        </div>

        {os.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "48px 20px", color: "var(--muted)" }}>
            <p style={{ fontSize: 16, margin: 0 }}>Nenhuma encomenda registada ainda.</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>Quando alguém fizer um pedido no site, aparecerá aqui.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {os.map((o) => {
              const statusCfg = STATUS_CONFIG[o.status] || {
                label: o.status,
                bg: "rgba(148, 163, 184, 0.1)",
                color: "#94a3b8",
                icon: "•",
              };

              const cleanPhone = (o.phone || "").replace(/[^0-9]/g, "");
              const waUrl = cleanPhone.length >= 9 ? `https://wa.me/244${cleanPhone.slice(-9)}` : null;

              return (
                <div
                  key={o.id}
                  className="card"
                  style={{
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    border: o.status === "EM_VALIDACAO" ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid var(--line)",
                    background: o.status === "EM_VALIDACAO" ? "rgba(245, 158, 11, 0.02)" : undefined,
                  }}
                >
                  {/* Linha 1: Ref, Data e Badge de Status */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 10,
                      paddingBottom: 12,
                      borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                    }}
                  >
                    <div>
                      <span style={{ fontFamily: "monospace", fontSize: 14, color: "var(--primary)", fontWeight: 700 }}>
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
                        padding: "4px 10px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                        backgroundColor: statusCfg.bg,
                        color: statusCfg.color,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span>{statusCfg.icon}</span>
                      <span>{statusCfg.label}</span>
                    </div>
                  </div>

                  {/* Linha 2: Dados do Comprador e Pagamento */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                      gap: 16,
                    }}
                  >
                    {/* Dados do Cliente */}
                    <div>
                      <span style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Comprador
                      </span>
                      <strong style={{ display: "block", fontSize: 16, color: "#f8fafc", marginTop: 2 }}>
                        {o.name}
                      </strong>
                      <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4, display: "flex", flexDirection: "column", gap: 3 }}>
                        <a href={`mailto:${o.email}`} style={{ color: "var(--primary)", textDecoration: "none" }}>
                          ✉️ {o.email}
                        </a>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span>📞 {o.phone}</span>
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              style={{
                                color: "#10b981",
                                textDecoration: "none",
                                fontSize: 12,
                                background: "rgba(16, 185, 129, 0.1)",
                                padding: "2px 6px",
                                borderRadius: 4,
                              }}
                            >
                              WhatsApp ↗
                            </a>
                          )}
                        </div>
                        {o.province && <span>📍 {o.province}</span>}
                      </div>
                    </div>

                    {/* Detalhes do Pagamento & Comprovativo */}
                    <div>
                      <span style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Valor & Comprovativo
                      </span>
                      <strong style={{ display: "block", fontSize: 18, color: "var(--title-blue)", marginTop: 2 }}>
                        {kz(o.amount)}
                      </strong>

                      {o.proofPath ? (
                        <div style={{ marginTop: 8, fontSize: 13 }}>
                          <span style={{ color: "var(--muted)", display: "block" }}>
                            Método: <strong>{o.proofMethod || "Transferência"}</strong>
                          </span>
                          <span style={{ color: "var(--muted)", display: "block" }}>
                            Titular declarou: <strong>{o.proofHolder || "—"}</strong>
                          </span>
                          <a
                            href={`/api/admin/proof/${o.id}`}
                            target="_blank"
                            style={{
                              display: "inline-block",
                              marginTop: 8,
                              padding: "6px 12px",
                              borderRadius: 6,
                              background: "rgba(34, 211, 238, 0.1)",
                              color: "var(--primary)",
                              textDecoration: "none",
                              fontSize: 12,
                              fontWeight: 600,
                              border: "1px solid rgba(34, 211, 238, 0.2)",
                            }}
                          >
                            📄 Ver Comprovativo Anexado ↗
                          </a>
                        </div>
                      ) : (
                        <span style={{ display: "block", marginTop: 8, fontSize: 13, color: "var(--muted)" }}>
                          Nenhum comprovativo enviado ainda.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Linha 3: Estado de Entrega ou Erro */}
                  {(o.sendStatus || o.sendError || o.adminNote) && (
                    <div
                      style={{
                        padding: "10px 12px",
                        borderRadius: 6,
                        background: "rgba(255, 255, 255, 0.03)",
                        fontSize: 12,
                        color: "var(--muted)",
                      }}
                    >
                      {o.sendStatus && <div><strong>Estado de Envio:</strong> {o.sendStatus}</div>}
                      {o.sendError && <div style={{ color: "#f87171", marginTop: 2 }}><strong>Aviso:</strong> {o.sendError}</div>}
                      {o.adminNote && <div style={{ color: "#f59e0b", marginTop: 2 }}><strong>Nota:</strong> {o.adminNote}</div>}
                    </div>
                  )}

                  {/* Linha 4: Botões de Ação */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 10,
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: 12,
                      borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                    }}
                  >
                    {/* Ações de Negócio */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
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
                                padding: "9px 18px",
                                borderRadius: 8,
                                border: "none",
                                cursor: "pointer",
                                fontSize: 13,
                              }}
                            >
                              ✓ Aprovar e Enviar Livro
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
                              placeholder="Motivo (ex: valor incorreto)"
                              style={{ padding: "6px 10px", fontSize: 12, width: 170 }}
                              required
                            />
                            <button
                              type="submit"
                              style={{
                                background: "transparent",
                                color: "#f87171",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                padding: "6px 12px",
                                borderRadius: 6,
                                cursor: "pointer",
                                fontSize: 12,
                              }}
                            >
                              ✕ Rejeitar
                            </button>
                          </form>
                        </>
                      )}

                      {["PAGAMENTO_CONFIRMADO", "FALHA_ENVIO", "LIVRO_ENVIADO"].includes(o.status) && (
                        <form method="post" action="/api/admin/action">
                          <input type="hidden" name="id" value={o.id} />
                          <input type="hidden" name="action" value="send" />
                          <button
                            type="submit"
                            style={{
                              background: "rgba(34, 211, 238, 0.1)",
                              color: "var(--primary)",
                              border: "1px solid rgba(34, 211, 238, 0.3)",
                              padding: "8px 14px",
                              borderRadius: 8,
                              cursor: "pointer",
                              fontSize: 13,
                              fontWeight: 600,
                            }}
                          >
                            {o.status === "LIVRO_ENVIADO" ? "🔄 Reenviar Livro por E-mail" : "🚀 Enviar Livro por E-mail"}
                          </button>
                        </form>
                      )}
                    </div>

                    {/* Botão de Apagar Registro (com confirmação) */}
                    <form
                      method="post"
                      action="/api/admin/action"
                      // @ts-ignore
                      onSubmit="return confirm('Tens a certeza que queres apagar permanentemente este registo?')"
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
                          padding: "6px 10px",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                        title="Eliminar este pedido do sistema"
                      >
                        🗑️ Eliminar
                      </button>
                    </form>
                  </div>

                  {/* Histórico recolhível */}
                  {o.events && o.events.length > 0 && (
                    <details style={{ fontSize: 11, color: "var(--muted)", marginTop: -4 }}>
                      <summary style={{ cursor: "pointer", opacity: 0.7 }}>
                        Ver histórico do pedido ({o.events.length} registos)
                      </summary>
                      <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3, paddingLeft: 8 }}>
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

