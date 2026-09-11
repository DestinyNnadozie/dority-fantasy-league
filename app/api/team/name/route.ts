import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth/session";

export async function PUT(req: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name } = await req.json();
  const teamName = String(name || "").trim();
  if (teamName.length < 2) return NextResponse.json({ error: "Team name is too short" }, { status: 400 });
  const team = await prisma.team.findUnique({ where: { userId: session.id } });
  if (!team) return NextResponse.json({ error: "No team" }, { status: 400 });
  await prisma.team.update({ where: { id: team.id }, data: { name: teamName } });
  return NextResponse.json({ ok: true, name: teamName });
}
