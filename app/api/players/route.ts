import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentGameweek } from "@/lib/gameweek";

export async function GET() {
  const gw = await getCurrentGameweek();
  const players = await prisma.schoolPlayer.findMany({ orderBy: [{ position: "asc" }, { price: "desc" }] });
  const stats = gw
    ? await prisma.playerGameweekStat.findMany({ where: { gameweekId: gw.id } })
    : [];
  const pts = Object.fromEntries(stats.map((s) => [s.playerId, s.rawPoints]));
  return NextResponse.json({
    players: players.map((p) => ({ ...p, gwPoints: pts[p.id] || 0 }))
  });
}
