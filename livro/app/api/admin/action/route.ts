import { db, isAdmin } from "@/lib";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import crypto from "crypto";

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
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error("SMTP não configurado (define SMTP_USER e SMTP_PASS nas variáveis da Vercel).");
    }
    const t = makeTransporter();
    await t.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
    });
  }

  /* ── Função de envio com PDF em anexo e link de download ── */
  async function sendWithBook(to: string, name: string, token: string) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error("SMTP não configurado (define SMTP_USER e SMTP_PASS nas variáveis da Vercel).");
    }

    const bookTitle = process.env.BOOK_TITLE || "Manual de Gestão de Vendas";
    const support = process.env.SUPPORT_EMAIL || process.env.ADMIN_EMAIL || "";
    const appUrl = (process.env.APP_URL || "https://empire-ga.vercel.app").replace(/\/$/, "");
    const downloadUrl = `${appUrl}/api/download/${token}`;

    // Localiza o PDF se existir
    const candidatePaths = [
      process.env.BOOK_PDF_PATH,
      path.join(process.cwd(), "storage", "livro.pdf"),
      path.join(process.cwd(), "public", "livro.pdf"),
    ].filter(Boolean) as string[];

    const existingPdf = candidatePaths.find((p) => fs.existsSync(p));

    const t = makeTransporter();
    const mailOptions: any = {
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject: `✅ Pagamento Confirmado — O teu ${bookTitle}`,
      text: [
        `Olá ${name},`,
        ``,
        `Confirmámos o teu pagamento! Muito obrigado pela tua confiança.`,
        ``,
        `📘 ${bookTitle}`,
        ``,
        `Tens o ficheiro anexado a este e-mail.`,
        `Também podes descarregar diretamente através do seguinte link seguro:`,
        `${downloadUrl}`,
        ``,
        `Boas vendas e muito sucesso! 🚀`,
        ``,
        `Suporte: ${support}`,
        ``,
        `Atenciosamente,`,
        `Empire GA`,
      ].join("\n"),
    };

    if (existingPdf) {
      mailOptions.attachments = [
        {
          filename: `${bookTitle}.pdf`,
          path: existingPdf,
          contentType: "application/pdf",
        },
      ];
    }

    await t.sendMail(mailOptions);
  }

  /* ── APROVAR pagamento (Confirma e envia o livro de imediato) ── */
  if (a === "approve" && o.status === "EM_VALIDACAO") {
    const now = new Date();
    const token = o.downloadToken || crypto.randomBytes(32).toString("hex");

    let emailSent = false;
    let emailErrorMsg = "";

    try {
      await sendWithBook(o.email, o.name, token);
      emailSent = true;
    } catch (err: any) {
      emailErrorMsg = String(err.message || "Erro no envio").slice(0, 250);
    }

    await db.order.update({
      where: { id },
      data: {
        status: emailSent ? "LIVRO_ENVIADO" : "PAGAMENTO_CONFIRMADO",
        approvedAt: now,
        deadline: new Date(+now + 864e5),
        downloadToken: token,
        downloadExpiresAt: new Date(+now + 30 * 864e5),
        sentAt: emailSent ? now : null,
        sendStatus: emailSent
          ? "Livro enviado por e-mail com sucesso"
          : `Aprovado. E-mail pendente: ${emailErrorMsg}`,
        sendError: emailSent ? null : emailErrorMsg,
        ...ev(
          emailSent
            ? `Pagamento aprovado e livro enviado por e-mail para ${o.email}`
            : `Pagamento aprovado. Aviso: ${emailErrorMsg}`
        ),
      },
    });
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
        `${process.env.APP_URL || "https://empire-ga.vercel.app"}/pagamento/${o.ref}`,
        ``,
        `Empire GA`,
      ].join("\n")
    ).catch(() => {});
  }

  /* ── REENVIAR LIVRO por e-mail ── */
  if (
    a === "send" &&
    ["PAGAMENTO_CONFIRMADO", "LIVRO_ENVIADO", "FALHA_ENVIO"].includes(o.status)
  ) {
    const token = o.downloadToken || crypto.randomBytes(32).toString("hex");
    try {
      await sendWithBook(o.email, o.name, token);
      await db.order.update({
        where: { id },
        data: {
          status: "LIVRO_ENVIADO",
          sentAt: new Date(),
          downloadToken: token,
          sendStatus: "Livro enviado por e-mail com sucesso",
          sendError: null,
          ...ev("Livro reenviado para " + o.email),
        },
      });
    } catch (e: any) {
      await db.order.update({
        where: { id },
        data: {
          status: "FALHA_ENVIO",
          sendStatus: "Falha no envio de e-mail",
          sendError: String(e.message).slice(0, 300),
          ...ev("Falha no reenvio: " + String(e.message).slice(0, 200)),
        },
      });
    }
  }

  /* ── APAGAR ENCOMENDA ── */
  if (a === "delete") {
    try {
      await db.order.delete({ where: { id } });
    } catch {}
    return back;
  }

  return back;
}


