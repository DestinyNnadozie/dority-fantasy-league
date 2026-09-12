import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
export const dynamic = "force-dynamic";

export async function GET() {
  const news = await (prisma as any).news.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ news });
}

export async function POST(req: Request) {
  const session = await readSession();
  if (!session || (session.role !== "ADMIN" && session.email !== "coordinator@school.local")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const b = await req.json();
  const title = String(b.title || "").trim();
  const body = String(b.body || b.content || "").trim();
  if (!title || !body) return NextResponse.json({ error: "Need title and body" }, { status: 400 });
  const item = await (prisma as any).news.create({ data: { title, body } });
  return NextResponse.json({ item });
}
