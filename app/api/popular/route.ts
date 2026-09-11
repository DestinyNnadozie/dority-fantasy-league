import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const teams = await prisma.team.count();
  const grouped = await prisma.squadPick.groupBy({
    by: ["playerId"],
    _count: { playerId: true },
    orderBy: { _count: { playerId: "desc" } },
    take: 10
  });
  const ids = grouped.map((g) => g.playerId);
  const players = await prisma.schoolPlayer.findMany({ where: { id: { in: ids } } });
  const byId = Object.fromEntries(players.map((p) => [p.id, p]));
  const list = grouped.map((g) => {
    const p = byId[g.playerId];
    const selected = g._count.playerId;
    return {
      id: g.playerId,
      name: p ? p.firstName + " " + p.lastName : "Unknown",
      position: p?.position,
      teamName: p?.teamName,
      selected,
      percent: teams ? Math.round((selected / teams) * 1000) / 10 : 0
    };
  });
  return NextResponse.json({ teams, players: list });
}