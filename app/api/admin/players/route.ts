import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth/session";

export async function GET() {
  const session = await readSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const players = await prisma.schoolPlayer.findMany({ orderBy: [{ teamName: "asc" }, { lastName: "asc" }] });
  return NextResponse.json({ players });
}

export async function PATCH(req: Request) {
  const session = await readSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, teamName, position, price } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing player" }, { status: 400 });
  const data: any = {};
  if (teamName) data.teamName = String(teamName);
  if (position && ["GK","DEF","MID","FWD"].includes(position)) data.position = position;
  if (price != null) data.price = Math.round(Number(price) * 10);
  await prisma.schoolPlayer.update({ where: { id: String(id) }, data });
  return NextResponse.json({ ok: true });
}
