import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
export async function GET(req: Request) {
  const session = await readSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const params = new URL(req.url).searchParams;
  const playerId = params.get("playerId");
  const gameweekId = Number(params.get("gameweekId"));
  if (!playerId || !Number.isSafeInteger(gameweekId) || gameweekId < 1) {
    return NextResponse.json({ error: "Invalid player or gameweek" }, { status: 400 });
  }
  const stats = await prisma.playerGameweekStat.findUnique({
    where: { playerId_gameweekId: { playerId, gameweekId } }
  });
  return NextResponse.json({ stats });
}
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
