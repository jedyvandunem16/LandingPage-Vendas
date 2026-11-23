import { db } from "@/lib";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { issueSignedToken, presignUrl } from "@vercel/blob";

export async function GET(_: Request, { params }: { params: { token: string } }) {
  const o = await db.order.findUnique({ where: { downloadToken: params.token } });
  if (!o || !["PAGAMENTO_CONFIRMADO", "LIVRO_ENVIADO", "FALHA_ENVIO"].includes(o.status) || (o.downloadExpiresAt && o.downloadExpiresAt < new Date())) {
    return new Response("Link inválido ou expirado.", { status: 404 });
  }

  // 1. Se estiver configurado Vercel Blob:
  if (process.env.BOOK_BLOB_PATH && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const signedToken = await issueSignedToken({ operations: ["get"] });
      const { presignedUrl } = await presignUrl(signedToken, {
        pathname: process.env.BOOK_BLOB_PATH,
        access: "private",
        operation: "get",
        validUntil: Date.now() + 5 * 60 * 1000,
      });
      return Response.redirect(presignedUrl, 302);
    } catch {}
  }

  // 2. Servir a partir do ficheiro incluído no projeto (storage/livro.pdf)
  const candidatePaths = [
    process.env.BOOK_PDF_PATH,
    path.join(process.cwd(), "storage", "livro.pdf"),
    path.join(process.cwd(), "public", "livro.pdf"),
    "./storage/livro.pdf",
  ].filter(Boolean) as string[];

  for (const p of candidatePaths) {
    if (existsSync(p)) {
      try {
        const b = await readFile(p);
        const filename = `${(process.env.BOOK_TITLE || "Manual-de-Gestao-de-Vendas").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
        return new Response(b, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "private, no-store",
          },
        });
      } catch {}
    }
  }

  return new Response("Ficheiro do livro temporariamente indisponível.", { status: 503 });
}

