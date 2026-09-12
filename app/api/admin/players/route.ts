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
  if (!id) {
    const firstName = String(b.firstName || "").trim();
    const lastName = String(b.lastName || "").trim();
    const position = String(b.position || "DEF");
    const teamName = String(b.teamName || "Icons");
    const price = Math.round(Number(b.priceDisplay || b.price || 5) * 10);
    if (!firstName || !lastName) return NextResponse.json({ error: "Need name" }, { status: 400 });
    const player = await prisma.schoolPlayer.create({
      data: { firstName, lastName, position, teamName, price }
    });
    return NextResponse.json({ player });
  }
  const data: any = {};
  if (b.price !== undefined) {
    const price = Number(b.price);
    if (Number.isNaN(price)) return NextResponse.json({ error: "Bad price" }, { status: 400 });
    data.price = price;
  }
  if (b.teamName !== undefined) data.teamName = String(b.teamName);
  if (b.position !== undefined) data.position = String(b.position);
  const player = await prisma.schoolPlayer.update({ where: { id }, data });
  return NextResponse.json({ player });
}