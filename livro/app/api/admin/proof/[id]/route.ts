import { db, isAdmin } from "@/lib";
import { get } from "@vercel/blob";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) return new Response("Não autorizado", { status: 401 });
  const o = await db.order.findUnique({ where: { id: params.id } });
  if (!o?.proofPath) return new Response("Sem comprovativo", { status: 404 });

  // Se o comprovativo foi guardado diretamente na base de dados (Base64)
  if (o.proofPath.startsWith("data:")) {
    const commaIndex = o.proofPath.indexOf(",");
    if (commaIndex === -1) return new Response("Formato inválido", { status: 400 });
    const header = o.proofPath.slice(0, commaIndex);
    const mimeType = header.replace(/^data:/, "").replace(/;base64$/, "");
    const base64Data = o.proofPath.slice(commaIndex + 1);
    const buffer = Buffer.from(base64Data, "base64");

    return new Response(buffer, {
      headers: {
        "Content-Type": mimeType || "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
        "Content-Disposition": "inline",
      },
    });
  }

  // Fallback: se tiver sido guardado no Vercel Blob
  try {
    const blob = await get(o.proofPath, { access: "private" });
    if (!blob || blob.statusCode !== 200) return new Response("Comprovativo indisponível", { status: 404 });
    return new Response(blob.stream, {
      headers: {
        "Content-Type": blob.blob.contentType || "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
        "Content-Disposition": "inline",
      },
    });
  } catch {
    return new Response("Comprovativo indisponível", { status: 404 });
  }
}

