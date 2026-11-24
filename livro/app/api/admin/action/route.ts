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

  /* ── Função de envio com e-mail personalizado em HTML e download seguro ── */
  async function sendWithBook(to: string, name: string, token: string) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error("SMTP não configurado (define SMTP_USER e SMTP_PASS nas variáveis da Vercel).");
    }

    const bookTitle = process.env.BOOK_TITLE || "Manual de Gestão de Vendas";
    const support = process.env.SUPPORT_EMAIL || process.env.ADMIN_EMAIL || "antonioguerreiro518@gmail.com";
    const appUrl = (process.env.APP_URL || "https://empire-ga.vercel.app").replace(/\/$/, "");
    const downloadUrl = `${appUrl}/api/download/${token}`;

    const candidatePaths = [
      process.env.BOOK_PDF_PATH,
      path.join(process.cwd(), "storage", "livro.pdf"),
      path.join(process.cwd(), "public", "livro.pdf"),
    ].filter(Boolean) as string[];

    const existingPdf = candidatePaths.find((p) => fs.existsSync(p));

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-AO">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${bookTitle}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #060e12; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #cbd5e1;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #060e12; padding: 40px 16px;">
        <tr>
          <td align="center">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #0a171d; border: 1px solid #162f3b; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
              
              <!-- Topo / Marca -->
              <tr>
                <td style="background: linear-gradient(135deg, #0a171d 0%, #0d222b 100%); padding: 32px 32px 24px; border-bottom: 1px solid #162f3b;">
                  <span style="font-size: 11px; font-weight: 700; letter-spacing: 2px; color: #22d3ee; text-transform: uppercase; display: block; margin-bottom: 8px;">
                    EMPIRE GA · CONFIRMAÇÃO OFICIAL
                  </span>
                  <h1 style="margin: 0; font-size: 24px; color: #96c3e1; font-weight: 700; line-height: 1.3;">
                    Pagamento confirmado
                  </h1>
                </td>
              </tr>

              <!-- Corpo do E-mail -->
              <tr>
                <td style="padding: 32px;">
                  <p style="font-size: 17px; color: #f8fafc; font-weight: 600; margin-top: 0; margin-bottom: 16px;">
                    Olá, ${name}!
                  </p>
                  
                  <p style="font-size: 15px; line-height: 1.6; color: #94a3b8; margin-bottom: 20px;">
                    Confirmámos a validação do teu pagamento. Parabéns pela decisão de investir no crescimento e na profissionalização da estrutura comercial da tua empresa.
                  </p>

                  <!-- Card do Livro -->
                  <div style="background-color: #071217; border: 1px solid #162f3b; border-radius: 8px; padding: 20px; margin-bottom: 28px;">
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 600; display: block; margin-bottom: 6px;">
                      Material adquirido
                    </span>
                    <strong style="font-size: 18px; color: #f8fafc; display: block; margin-bottom: 4px;">
                      ${bookTitle}
                    </strong>
                    <span style="font-size: 13px; color: #22d3ee; display: block;">
                      Por Guerreiro António — Consultor de Vendas & Fundador da Empire GA
                    </span>
                  </div>

                  <!-- Botão de Download -->
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${downloadUrl}" style="background-color: #22d3ee; color: #060e12; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 6px; display: inline-block; letter-spacing: 0.5px;">
                      Descarregar manual completo (PDF)
                    </a>
                  </div>

                  <p style="font-size: 13px; line-height: 1.5; color: #64748b; text-align: center; margin-bottom: 28px;">
                    O teu link de acesso é exclusivo e vitalício. Podes descarregar o ficheiro para o teu computador ou telemóvel a qualquer momento.
                  </p>

                  <div style="border-top: 1px solid #162f3b; padding-top: 24px; margin-top: 24px;">
                    <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0;">
                      Desejamos-te uma excelente leitura, uma implementação rigorosa e resultados consistentes nas tuas vendas.
                    </p>
                    <p style="font-size: 14px; font-weight: 600; color: #cbd5e1; margin-top: 16px; margin-bottom: 0;">
                      Atenciosamente,<br>
                      <span style="color: #22d3ee;">Guerreiro António</span> & Equipa Empire GA
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Rodapé -->
              <tr>
                <td style="background-color: #071217; padding: 20px 32px; border-top: 1px solid #162f3b; text-align: center;">
                  <p style="font-size: 12px; color: #64748b; margin: 0;">
                    Precisas de assistência ou suporte? Contacta-nos através de <a href="mailto:${support}" style="color: #22d3ee; text-decoration: none;">${support}</a>
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    const textContent = [
      `Olá ${name},`,
      ``,
      `Confirmámos a validação do teu pagamento com sucesso!`,
      ``,
      `Material adquirido: ${bookTitle}`,
      `Autor: Guerreiro António (Empire GA)`,
      ``,
      `Podes descarregar o teu manual através do seguinte link seguro:`,
      `${downloadUrl}`,
      ``,
      `Desejamos-te excelente leitura e resultados consistentes nas tuas vendas.`,
      ``,
      `Suporte: ${support}`,
      ``,
      `Atenciosamente,`,
      `Guerreiro António & Equipa Empire GA`,
    ].join("\n");

    const t = makeTransporter();
    const mailOptions: any = {
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject: `Confirmação de Pagamento — ${bookTitle}`,
      text: textContent,
      html: htmlContent,
    };

    // Anexa o PDF se o ficheiro tiver até 20MB (limite de segurança SMTP do Gmail)
    if (existingPdf) {
      try {
        const stats = fs.statSync(existingPdf);
        if (stats.size <= 20 * 1024 * 1024) {
          mailOptions.attachments = [
            {
              filename: `${bookTitle}.pdf`,
              path: existingPdf,
              contentType: "application/pdf",
            },
          ];
        }
      } catch {}
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


