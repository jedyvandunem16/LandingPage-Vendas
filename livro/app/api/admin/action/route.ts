import { db, isAdmin, mail } from "@/lib";
import { NextResponse } from "next/server";
import crypto from "crypto";
export async function POST(req: Request) {
  if (!(await isAdmin())) return new NextResponse("Não autorizado", { status: 401 });
  const f = await req.formData(); const id = String(f.get("id")); const a = String(f.get("action")); const note = String(f.get("note") || "").trim();
  const back = NextResponse.redirect(new URL("/admin", req.url), 303);
  const o = await db.order.findUnique({ where: { id } });
  if (!o) return back;
  const ev = (text: string) => ({ events: { create: { text } } });
  if (a === "approve" && o.status === "EM_VALIDACAO") {
    const now = new Date();
    await db.order.update({ where: { id }, data: { status: "PAGAMENTO_CONFIRMADO", approvedAt: now, deadline: new Date(+now + 864e5), downloadToken: crypto.randomBytes(32).toString("hex"), downloadExpiresAt: new Date(+now + 30 * 864e5), ...ev("Pagamento aprovado") } });
    mail(o.email, "Pagamento confirmado", `Olá ${o.name},\n\nConfirmámos o teu pagamento (${o.ref}). Vais receber o livro por e-mail em, no máximo, 24 horas.`).catch(() => {});
  }
  if (a === "reject" && o.status === "EM_VALIDACAO") {
    await db.order.update({ where: { id }, data: { status: "REJEITADO", adminNote: note, ...ev("Pagamento rejeitado: " + note) } });
    mail(o.email, `Pagamento não validado (${o.ref})`, `Olá ${o.name},\n\nNão conseguimos validar o teu pagamento. Motivo: ${note || "comprovativo ilegível ou valor incorreto"}.\nPodes enviar um novo comprovativo aqui: ${process.env.APP_URL}/pagamento/${o.ref}`).catch(() => {});
  }
  if (a === "send" && o.downloadToken && ["PAGAMENTO_CONFIRMADO", "LIVRO_ENVIADO", "FALHA_ENVIO"].includes(o.status)) {
    try {
      await mail(o.email, `O teu livro: ${process.env.BOOK_TITLE || "Manual de Gestão de Vendas"}`, `Olá ${o.name},\n\nObrigado pela tua compra! O pagamento está confirmado.\nDescarrega o livro aqui: ${process.env.APP_URL}/api/download/${o.downloadToken}\n\nSuporte: ${process.env.SUPPORT_EMAIL || ""}`);
      await db.order.update({ where: { id }, data: { status: "LIVRO_ENVIADO", sentAt: new Date(), sendStatus: "Enviado (aceite pelo servidor de e-mail)", sendError: null, ...ev("Livro enviado para " + o.email) } });
    } catch (e: any) {
      await db.order.update({ where: { id }, data: { status: "FALHA_ENVIO", sendStatus: "Falha", sendError: String(e.message).slice(0, 300), ...ev("Falha no envio") } });
    }
  }
  return back;
}
