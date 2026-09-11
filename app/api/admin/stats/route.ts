import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
export async function PUT(req: Request) {
  const session = await readSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const stat = await prisma.playerGameweekStat.upsert({
    where: { playerId_gameweekId: { playerId: body.playerId, gameweekId: Number(body.gameweekId || 1) } },
    create: { playerId: body.playerId, gameweekId: Number(body.gameweekId || 1), minutes: Number(body.minutes || 0), goals: Number(body.goals || 0), assists: Number(body.assists || 0), cleanSheet: Boolean(body.cleanSheet), yellowCards: Number(body.yellowCards || 0), redCards: Number(body.redCards || 0), bonus: Number(body.bonus || 0), saves: Number(body.saves || 0) },
    update: { minutes: Number(body.minutes || 0), goals: Number(body.goals || 0), assists: Number(body.assists || 0), cleanSheet: Boolean(body.cleanSheet), yellowCards: Number(body.yellowCards || 0), redCards: Number(body.redCards || 0), bonus: Number(body.bonus || 0), saves: Number(body.saves || 0) }
  });
  return NextResponse.json({ stat });
}
