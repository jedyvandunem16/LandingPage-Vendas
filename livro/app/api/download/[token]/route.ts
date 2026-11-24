import { db } from "@/lib";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: { token: string } }) {
  const o = await db.order.findUnique({ where: { downloadToken: params.token } });

  // Validação do token
  if (
    !o ||
    !["PAGAMENTO_CONFIRMADO", "LIVRO_ENVIADO", "FALHA_ENVIO"].includes(o.status) ||
    (o.downloadExpiresAt && o.downloadExpiresAt < new Date())
  ) {
    return new Response("Link inválido ou expirado.", { status: 404 });
  }

  // Redirecionar para o ficheiro estático servido pelo Vercel diretamente
  // /livro.pdf está em public/livro.pdf e é servido como ficheiro estático
  const appUrl = (process.env.APP_URL || "https://empire-ga.vercel.app").replace(/\/$/, "");
  const fileUrl = `${appUrl}/livro.pdf`;

  return NextResponse.redirect(fileUrl, {
    status: 302,
    headers: {
      // Força o navegador a descarregar o ficheiro em vez de abrir inline
      "Content-Disposition": `attachment; filename="Manual-de-Gestao-de-Vendas.pdf"`,
    },
  });
}
