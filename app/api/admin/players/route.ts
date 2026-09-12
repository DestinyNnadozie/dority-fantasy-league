import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await readSession();
  if (!session || (session.role !== "ADMIN" && session.email !== "coordinator@school.local")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const players = await prisma.schoolPlayer.findMany({
    orderBy: [{ teamName: "asc" }, { lastName: "asc" }]
  });
  return NextResponse.json({ players });
}

export async function POST(req: Request) {
  const session = await readSession();
  if (!session || (session.role !== "ADMIN" && session.email !== "coordinator@school.local")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const b = await req.json();
  const id = String(b.id || "");
  const price = Number(b.price);
  if (!id || Number.isNaN(price)) return NextResponse.json({ error: "Bad data" }, { status: 400 });
  const player = await prisma.schoolPlayer.update({ where: { id }, data: { price } });
  return NextResponse.json({ player });
}
