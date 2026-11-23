import { db, isAdmin } from "@/lib";
import { get } from "@vercel/blob";
export async function GET(_: Request, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) return new Response("Não autorizado", { status: 401 });
  const o = await db.order.findUnique({ where: { id: params.id } });
  if (!o?.proofPath) return new Response("Sem comprovativo", { status: 404 });
  const blob = await get(o.proofPath, { access: "private" });
  if (!blob || blob.statusCode !== 200) return new Response("Comprovativo indisponível", { status: 404 });
  return new Response(blob.stream, { headers: { "Content-Type": blob.blob.contentType || "application/octet-stream", "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store", "Content-Disposition": "inline" } });
}
