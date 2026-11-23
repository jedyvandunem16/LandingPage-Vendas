import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  cookies().delete("s");
  return NextResponse.redirect(new URL("/admin/login", req.url), 303);
}
