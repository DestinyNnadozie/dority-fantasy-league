import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const teams = Math.max(1, await prisma.team.count());
  const grouped = await prisma.squadPick.groupBy({
    by: ["playerId"],
    _count: { playerId: true },
    orderBy: { _count: { playerId: "desc" } },
    take: 10
  });
  const players = await prisma.schoolPlayer.findMany({ where: { id: { in: grouped.map((g) => g.playerId) } } });
  const byId = Object.fromEntries(players.map((p) => [p.id, p]));
  return NextResponse.json({
    players: grouped.map((g) => {
      const p = byId[g.playerId];
      return {
        id: g.playerId,
        name: p ? p.firstName + " " + p.lastName : "Unknown",
        position: p?.position,
        teamName: p?.teamName,
        selected: g._count.playerId,
        percent: Math.round((g._count.playerId / teams) * 1000) / 10
      };
    })
  });
}
