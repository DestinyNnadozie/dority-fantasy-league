import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth/session";

export async function POST(req: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { code } = await req.json();
  const league = await prisma.league.findUnique({ where: { code: String(code || "").toUpperCase() } });
  if (!league) return NextResponse.json({ error: "Invalid code" }, { status: 404 });
  await prisma.leagueMember.upsert({
    where: { leagueId_userId: { leagueId: league.id, userId: session.id } },
    create: { leagueId: league.id, userId: session.id },
    update: {}
  });
  return NextResponse.json({ ok: true, league });
}
