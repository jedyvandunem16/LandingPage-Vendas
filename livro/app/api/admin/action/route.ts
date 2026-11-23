import { db, isAdmin } from "@/lib";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  if (!(await isAdmin())) return new NextResponse("Não autorizado", { status: 401 });
  const f = await req.formData();
  const id = String(f.get("id"));
  const a = String(f.get("action"));
  const note = String(f.get("note") || "").trim();
  const back = NextResponse.redirect(new URL("/admin", req.url), 303);

  const o = await db.order.findUnique({ where: { id } });
  if (!o) return back;

  const ev = (text: string) => ({ events: { create: { text } } });

  /* ── Criador de transporter SMTP ── */
  function makeTransporter() {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /* ── Função de envio simples (texto) ── */
  async function sendSimple(to: string, subject: string, text: string) {
    const t = makeTransporter();
    await t.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
    });
  }

  /* ── Função de envio com PDF em anexo ── */
  async function sendWithBook(to: string, name: string) {
    const bookTitle = process.env.BOOK_TITLE || "Manual de Gestão de Vendas";
    const support = process.env.SUPPORT_EMAIL || process.env.ADMIN_EMAIL || "";

    // Localiza o PDF: variável de ambiente ou pasta storage/
    const pdfPath =
      process.env.BOOK_PDF_PATH ||
      path.join(process.cwd(), "storage", "livro.pdf");

    if (!fs.existsSync(pdfPath)) {
      throw new Error(
        `PDF não encontrado em: ${pdfPath}. Coloca o ficheiro livro.pdf na pasta storage/ do projeto.`
      );
    }

    const t = makeTransporter();
    await t.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject: `📘 O teu livro: ${bookTitle}`,
      text: [
        `Olá ${name},`,
        ``,
        `Obrigado pela tua compra! O pagamento foi confirmado e tens aqui o teu livro em anexo.`,
        ``,
        `Título: ${bookTitle}`,
        ``,
        `Boas vendas e muito sucesso! 🚀`,
        ``,
        `Qualquer dúvida, contacta-nos: ${support}`,
        ``,
        `Atenciosamente,`,
        `Empire GA`,
      ].join("\n"),
      attachments: [
        {
          filename: `${bookTitle}.pdf`,
          path: pdfPath,
          contentType: "application/pdf",
        },
      ],
    });
  }

  /* ── APROVAR pagamento ── */
  if (a === "approve" && o.status === "EM_VALIDACAO") {
    const now = new Date();
    await db.order.update({
      where: { id },
      data: {
        status: "PAGAMENTO_CONFIRMADO",
        approvedAt: now,
        deadline: new Date(+now + 864e5),
        ...ev("Pagamento aprovado"),
      },
    });
    // Aviso ao cliente: pagamento confirmado, livro a caminho
    sendSimple(
      o.email,
      "✅ Pagamento confirmado — Manual de Gestão de Vendas",
      [
        `Olá ${o.name},`,
        ``,
        `Confirmámos o teu pagamento (ref: ${o.ref}).`,
        `Vais receber o livro por e-mail em, no máximo, 24 horas.`,
        ``,
        `Obrigado pela tua compra!`,
        `Empire GA`,
      ].join("\n")
    ).catch(() => {});
  }

  /* ── REJEITAR pagamento ── */
  if (a === "reject" && o.status === "EM_VALIDACAO") {
    await db.order.update({
      where: { id },
      data: {
        status: "REJEITADO",
        adminNote: note,
        ...ev("Pagamento rejeitado: " + note),
      },
    });
    sendSimple(
      o.email,
      `Pagamento não validado (${o.ref})`,
      [
        `Olá ${o.name},`,
        ``,
        `Não conseguimos validar o teu pagamento.`,
        `Motivo: ${note || "comprovativo ilegível ou valor incorreto"}.`,
        ``,
        `Podes enviar um novo comprovativo em:`,
        `${process.env.APP_URL}/pagamento/${o.ref}`,
        ``,
        `Empire GA`,
      ].join("\n")
    ).catch(() => {});
  }

  /* ── ENVIAR LIVRO por email (com PDF em anexo) ── */
  if (
    a === "send" &&
    ["PAGAMENTO_CONFIRMADO", "LIVRO_ENVIADO", "FALHA_ENVIO"].includes(o.status)
  ) {
    try {
      await sendWithBook(o.email, o.name);
      await db.order.update({
        where: { id },
        data: {
          status: "LIVRO_ENVIADO",
          sentAt: new Date(),
          sendStatus: "Livro enviado por email (PDF em anexo)",
          sendError: null,
          ...ev("Livro enviado para " + o.email),
        },
      });
    } catch (e: any) {
      await db.order.update({
        where: { id },
        data: {
          status: "FALHA_ENVIO",
          sendStatus: "Falha no envio",
          sendError: String(e.message).slice(0, 300),
          ...ev("Falha no envio: " + String(e.message).slice(0, 200)),
        },
      });
    }
  }

  return back;
}

