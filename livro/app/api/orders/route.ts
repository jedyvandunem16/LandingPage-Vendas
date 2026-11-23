import { db, mail, price, kz, consumeRateLimit, requestThrottleKey } from "@/lib";
import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
const S = z.object({ name: z.string().trim().min(3).max(120), email: z.string().trim().email().max(120).transform(v => v.toLowerCase()), phone: z.string().trim().min(9).max(20), province: z.string().trim().max(60).optional(), notes: z.string().trim().max(500).optional() });
export async function POST(req: Request) {
  if (!(await consumeRateLimit(requestThrottleKey(req, "orders"), 10, 10 * 60 * 1000))) return NextResponse.json({ error: "Foram feitas demasiadas tentativas. Aguarda alguns minutos e tenta novamente." }, { status: 429 });
  const p = S.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ error: "Verifica o nome, o e-mail e o telefone." }, { status: 400 });
  const amount = price();
  if (!Number.isSafeInteger(amount) || amount <= 0) return NextResponse.json({ error: "As encomendas ainda não estão abertas." }, { status: 503 });
  const d = p.data;
  const dup = await db.order.findFirst({ where: { email: d.email, status: "AGUARDANDO_PAGAMENTO", createdAt: { gt: new Date(Date.now() - 6e5) } } });
  if (dup) return NextResponse.json({ ref: dup.ref });
  const ref = "MGV-" + crypto.randomBytes(8).toString("hex").toUpperCase();
  const o = await db.order.create({
    data: {
      ref,
      name: d.name,
      email: d.email,
      phone: d.phone,
      province: d.province ?? null,
      notes: d.notes ?? null,
      amount,
      events: { create: { text: "Encomenda criada" } },
    },
  });
  const link = `${process.env.APP_URL}/pagamento/${ref}`;
  mail(d.email, `Encomenda ${ref}`, `Olá ${d.name},\n\nRecebemos a tua encomenda ${ref} (${kz(amount)}).\nPaga e envia o comprovativo aqui: ${link}`).catch(() => {});
  if (process.env.ADMIN_NOTIFY_EMAIL) mail(process.env.ADMIN_NOTIFY_EMAIL, `Nova encomenda ${ref}`, `${d.name} (${d.email})`).catch(() => {});
  return NextResponse.json({ ref: o.ref });
}
