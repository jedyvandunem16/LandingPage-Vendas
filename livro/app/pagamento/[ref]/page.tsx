import { db, kz } from "@/lib";
import { notFound } from "next/navigation";
import { Copy, ProofForm } from "../../forms";
export const dynamic = "force-dynamic";
export default async function Pay({ params }: { params: { ref: string } }) {
  const o = await db.order.findUnique({ where: { ref: params.ref } });
  if (!o) notFound();
  const e = process.env;
  const rows = [["Titular", e.PAY_HOLDER || "Domingos Muginga António"], ["Banco", e.PAY_BANK], ["IBAN", e.PAY_IBAN || "0055.0000.8169.4888.1017.0"], ["Multicaixa Express", e.PAY_MULTICAIXA || "941583066"]].filter(r => r[1]);
  const open = ["AGUARDANDO_PAGAMENTO", "EM_VALIDACAO", "REJEITADO"].includes(o.status);
  return <main className="box">
    <h1>Encomenda {o.ref}</h1>
    <p>Valor a pagar: <b>{kz(o.amount)}</b></p>
    {!open ? <p className="ok">Pagamento confirmado. O livro segue para o teu e-mail em até 24 horas.</p> : <>
      {o.status === "EM_VALIDACAO" && <p className="ok">Comprovativo recebido. Estamos a validar. Se precisares, podes enviar outro abaixo.</p>}
      {o.status === "REJEITADO" && <p className="err">O pagamento não foi validado{o.adminNote ? ": " + o.adminNote : ""}. Envia um novo comprovativo.</p>}
      <div className="card">
        {rows.length ? rows.map(([k, v]) => <p key={k}>{k}: <b>{v}</b></p>) : <p>Os dados de pagamento ainda não estão configurados. Contacta o suporte.</p>}
        {rows.length > 0 && <Copy text={rows.map(r => r.join(": ")).join("\n") + "\nValor: " + kz(o.amount) + "\nReferência: " + o.ref} />}
      </div>
      <p>Depois de pagares, guarda o comprovativo e preenche o formulário.</p>
      <ProofForm code={o.ref} name={o.name} />
    </>}
  </main>;
}
