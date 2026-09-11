import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") || "";
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
  const user = await prisma.user.findFirst({ where: { verifyToken: token } });
  if (!user) return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date(), verifyToken: null } });
  return NextResponse.json({ ok: true });
}
