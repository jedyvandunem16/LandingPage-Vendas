import { db, mail, consumeRateLimit, requestThrottleKey } from "@/lib";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import crypto from "crypto";

const types = {
  "application/pdf": { ext: "pdf", valid: (b: Buffer) => b.subarray(0, 5).toString() === "%PDF-" },
  "image/jpeg": { ext: "jpg", valid: (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[b.length - 2] === 0xff && b[b.length - 1] === 0xd9 },
  "image/png": { ext: "png", valid: (b: Buffer) => b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
} as const;
const err = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export async function POST(req: Request) {
  if (!(await consumeRateLimit(requestThrottleKey(req, "proof"), 10, 60 * 60 * 1000))) return err("Foram feitos demasiados envios deste endereço. Aguarda uma hora e tenta novamente.", 429);
  let f: FormData;
  try { f = await req.formData(); } catch { return err("Não foi possível ler o formulário."); }
  const get = (k: string) => String(f.get(k) || "").trim();
  const file = f.get("file");
  const o = await db.order.findUnique({ where: { ref: get("code") } });
  if (!o) return err("Código de encomenda inválido.");
  if (!["AGUARDANDO_PAGAMENTO", "EM_VALIDACAO", "REJEITADO"].includes(o.status)) return err("Esta encomenda já foi confirmada.");
  if (get("name").toLocaleLowerCase() !== o.name.trim().toLocaleLowerCase()) return err("O nome não corresponde ao titular da encomenda.");
  if (!["Transferência bancária", "Multicaixa Express"].includes(get("method")) || !get("holder") || get("holder").length > 120) return err("Verifica o método e o titular do pagamento.");
  const amount = Number(get("amount"));
  if (!Number.isSafeInteger(amount) || amount <= 0) return err("Indica um valor válido.");
  const date = get("date");
  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date || parsedDate > new Date()) return err("Indica uma data de pagamento válida.");
  if (!(file instanceof File) || file.size === 0 || file.size > 4 * 1024 * 1024 || !Object.hasOwn(types, file.type)) return err("Comprovativo inválido: usa PDF, JPG ou PNG até 4 MB.");
  const fileType = types[file.type as keyof typeof types];
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!fileType.valid(bytes)) return err("O conteúdo do ficheiro não corresponde ao formato indicado.");
  const uploadBody = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

  let proofPath: string;
  try {
    const blob = await put(`proofs/${o.ref}/${crypto.randomBytes(12).toString("hex")}.${fileType.ext}`, uploadBody, {
      access: "private", addRandomSuffix: false, contentType: file.type, cacheControlMaxAge: 60,
    });
    proofPath = blob.pathname;
  } catch {
    return err("Não foi possível guardar o comprovativo no armazenamento. Tenta novamente.", 503);
  }
  try {
    const result = await db.order.updateMany({
      where: { id: o.id, status: { in: ["AGUARDANDO_PAGAMENTO", "EM_VALIDACAO", "REJEITADO"] } },
      data: { status: "EM_VALIDACAO", proofPath, proofMethod: get("method"), proofHolder: get("holder"), proofAmount: amount, proofDate: date },
    });
    if (!result.count) return err("Esta encomenda já foi confirmada.");
    await db.event.create({ data: { orderId: o.id, text: "Comprovativo submetido" } });
  } catch {
    return err("Não foi possível guardar o comprovativo. Tenta novamente.", 503);
  }
  mail(o.email, `Comprovativo recebido (${o.ref})`, `Olá ${o.name},\n\nRecebemos o teu comprovativo e estamos a validá-lo.`).catch(() => {});
  if (process.env.ADMIN_NOTIFY_EMAIL) mail(process.env.ADMIN_NOTIFY_EMAIL, `Comprovativo por validar ${o.ref}`, `${o.name} enviou um comprovativo.`).catch(() => {});
  return NextResponse.json({ message: "Comprovativo recebido. Vamos validar o pagamento e enviar o livro em até 24 horas após a confirmação." });
}
