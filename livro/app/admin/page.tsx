import { db, isAdmin, kz } from "@/lib";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const L: any = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  EM_VALIDACAO: "Em validação",
  PAGAMENTO_CONFIRMADO: "Aguardando envio",
  REJEITADO: "Pagamento rejeitado",
  LIVRO_ENVIADO: "Livro enviado",
  FALHA_ENVIO: "Falha no envio",
};

const Act = ({ id, a, label, note }: any) => (
  <form method="post" action="/api/admin/action">
    <input type="hidden" name="id" value={id} />
    <input type="hidden" name="action" value={a} />
    {note && <input name="note" placeholder="Motivo" required />}
    <button>{label}</button>
  </form>
);

export default async function Admin() {
  if (!(await isAdmin())) redirect("/admin/login");

  let os: any[] = [];
  let dbError = "";

  try {
    os = await db.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { events: { orderBy: { at: "asc" } } },
    });
  } catch (err: any) {
    dbError =
      "Base de dados PostgreSQL não conectada. Configura o DATABASE_URL no ficheiro .env para listar e gerir encomendas.";
  }

  const paid = os.filter((o) =>
    ["PAGAMENTO_CONFIRMADO", "LIVRO_ENVIADO", "FALHA_ENVIO"].includes(o.status)
  );

  return (
    <main style={{ maxWidth: 1200 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1>Encomendas</h1>
        <form action="/api/admin/logout" method="post">
          <button
            type="submit"
            style={{
              padding: "8px 16px",
              fontSize: 13,
              background: "transparent",
              color: "var(--muted)",
              borderColor: "var(--line)",
            }}
          >
            Terminar sessão
          </button>
        </form>
      </div>

      {dbError ? (
        <div className="card" style={{ borderLeft: "4px solid var(--danger)", margin: "20px 0" }}>
          <p className="err" style={{ margin: 0, fontWeight: 700 }}>
            ⚠️ {dbError}
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--muted)" }}>
            A autenticação de administrador está a funcionar normalmente. Para registar e sincronizar as
            encomendas com a base de dados, adiciona uma string de ligação PostgreSQL válida no ficheiro{" "}
            <code>.env</code> (por exemplo Neon, Supabase ou PostgreSQL local) e executa{" "}
            <code>npx prisma db push</code> dentro da pasta <code>livro</code>.
          </p>
        </div>
      ) : (
        <>
          <p>
            Total: {os.length} · Confirmadas: {paid.length} · Receita confirmada:{" "}
            {kz(paid.reduce((s, o) => s + o.amount, 0))} · Por validar:{" "}
            {os.filter((o) => o.status === "EM_VALIDACAO").length} · Por enviar:{" "}
            {os.filter((o) => o.status === "PAGAMENTO_CONFIRMADO" || o.status === "FALHA_ENVIO").length} ·
            Enviados: {os.filter((o) => o.status === "LIVRO_ENVIADO").length}
          </p>
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Ref.</th>
                  <th>Comprador</th>
                  <th>Valor</th>
                  <th>Estado</th>
                  <th>Comprovativo</th>
                  <th>Entrega</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {os.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{ textAlign: "center", padding: "32px", color: "var(--muted)" }}
                    >
                      Nenhuma encomenda registada ainda.
                    </td>
                  </tr>
                ) : (
                  os.map((o) => (
                    <tr key={o.id}>
                      <td>
                        {o.ref}
                        <br />
                        {o.createdAt.toLocaleString("pt-AO")}
                      </td>
                      <td>
                        {o.name}
                        <br />
                        {o.email}
                        <br />
                        {o.phone}
                      </td>
                      <td>{kz(o.amount)}</td>
                      <td>{L[o.status]}</td>
                      <td>
                        {o.proofPath ? (
                          <>
                            {o.proofMethod}
                            <br />
                            Titular: {o.proofHolder}
                            <br />
                            Declarado: {kz(o.proofAmount || 0)} em {o.proofDate}
                            <br />
                            <a href={`/api/admin/proof/${o.id}`} target="_blank">
                              Ver ficheiro
                            </a>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        {o.deadline ? (
                          <>
                            Prazo: {o.deadline.toLocaleString("pt-AO")}
                            <br />
                            {o.sendStatus || "Por enviar"}
                            {o.sendError && (
                              <>
                                <br />
                                {o.sendError}
                              </>
                            )}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        {o.status === "EM_VALIDACAO" && (
                          <div style={{ display: "flex", gap: "6px", flexDirection: "column" }}>
                            <Act id={o.id} a="approve" label="✓ Aprovar e Enviar Livro" />
                            <Act id={o.id} a="reject" label="✕ Rejeitar" note />
                          </div>
                        )}
                        {["PAGAMENTO_CONFIRMADO", "FALHA_ENVIO", "LIVRO_ENVIADO"].includes(o.status) && (
                          <Act
                            id={o.id}
                            a="send"
                            label={o.status === "LIVRO_ENVIADO" ? "Reenviar livro" : "Enviar livro"}
                          />
                        )}
                        <details>
                          <summary>Histórico</summary>
                          {o.events.map((e: any) => (
                            <div key={e.id}>
                              {e.at.toLocaleString("pt-AO")} · {e.text}
                            </div>
                          ))}
                        </details>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
