import { db } from "@/lib";
import { readFile } from "fs/promises";
import { issueSignedToken, presignUrl } from "@vercel/blob";
export async function GET(_: Request, { params }: { params: { token: string } }) {
  const o = await db.order.findUnique({ where: { downloadToken: params.token } });
  if (!o || !["PAGAMENTO_CONFIRMADO", "LIVRO_ENVIADO", "FALHA_ENVIO"].includes(o.status) || (o.downloadExpiresAt && o.downloadExpiresAt < new Date())) return new Response("Link inválido ou expirado.", { status: 404 });
  if (process.env.BOOK_BLOB_PATH) {
    try {
      const signedToken = await issueSignedToken({ operations: ["get"] });
      const { presignedUrl } = await presignUrl(signedToken, {
        pathname: process.env.BOOK_BLOB_PATH,
        access: "private",
        operation: "get",
        validUntil: Date.now() + 5 * 60 * 1000,
      });
      return Response.redirect(presignedUrl, 302);
    } catch { return new Response("Armazenamento do livro indisponível.", { status: 503 }); }
  }
  if (process.env.VERCEL) return new Response("Configura BOOK_BLOB_PATH para disponibilizar o livro.", { status: 503 });
  try {
    const b = await readFile(process.env.BOOK_PDF_PATH || "./storage/livro.pdf");
    return new Response(b, { headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="Manual-de-Gestao-de-Vendas.pdf"', "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store" } });
  } catch { return new Response("Ficheiro indisponível.", { status: 500 }); }
}
