import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { getCurrentGameweek } from "@/lib/gameweek";

export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const team = await prisma.team.findUnique({
    where: { userId: session.id },
    include: { gameweekScores: true }
  });
  if (!team) return NextResponse.json({ points: 0, overall: 0 });
  const gw = await getCurrentGameweek();
  const thisGw = team.gameweekScores.find((s) => s.gameweekId === gw?.id);
  return NextResponse.json({
    teamName: team.name,
    overall: team.overallPoints,
    gameweek: gw?.id || 1,
    gameweekPoints: thisGw?.finalPoints || 0
  });
}
