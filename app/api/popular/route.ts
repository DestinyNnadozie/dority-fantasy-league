import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentGameweek } from "@/lib/gameweek";
export const dynamic = "force-dynamic";

export async function GET() {
  const teams = Math.max(1, await prisma.team.count());
  const selected = await prisma.squadPick.groupBy({
    by: ["playerId"],
    _count: { playerId: true },
    orderBy: { _count: { playerId: "desc" } },
    take: 20
  });
  const captains = await prisma.squadPick.groupBy({
    by: ["playerId"],
    where: { isCaptain: true },
    _count: { playerId: true },
    orderBy: { _count: { playerId: "desc" } },
    take: 20
  });
  const gw = await getCurrentGameweek();
  const eligible = { OR: [{ teamName: null }, { teamName: { not: "Icons", mode: "insensitive" as const } }] };
  const seasonPts = await prisma.playerGameweekStat.groupBy({
    by: ["playerId"], where: { player: eligible }, _sum: { rawPoints: true },
    orderBy: [{ _sum: { rawPoints: "desc" } }, { playerId: "asc" }], take: 10
  });
  const gwPts = gw ? await prisma.playerGameweekStat.groupBy({
    by: ["playerId"], where: { gameweekId: gw.id, player: eligible }, _sum: { rawPoints: true },
    orderBy: [{ _sum: { rawPoints: "desc" } }, { playerId: "asc" }], take: 10
  }) : [];
  const ids = Array.from(new Set([...selected, ...captains, ...seasonPts, ...gwPts].map((g) => g.playerId)));
  const players = await prisma.schoolPlayer.findMany({ where: { id: { in: ids } } });
  const byId = Object.fromEntries(players.map((p) => [p.id, p]));
  const map = (rows: typeof selected) => rows.map((g) => {
    const p = byId[g.playerId];
    return {
      id: g.playerId,
      name: p ? p.firstName + " " + p.lastName : "Unknown",
      position: p?.position,
      teamName: p?.teamName,
      selected: g._count.playerId,
      percent: Math.round((g._count.playerId / teams) * 1000) / 10
    };
  });
  const mapPoints = (rows: typeof seasonPts) => rows.map((g) => {
    const p = byId[g.playerId];
    return {
      id: g.playerId,
      name: p ? p.firstName + " " + p.lastName : "Unknown",
      position: p?.position, teamName: p?.teamName, points: g._sum.rawPoints ?? 0
    };
  });
  return NextResponse.json({
    selected: map(selected), captains: map(captains),
    seasonPts: mapPoints(seasonPts), gwPts: mapPoints(gwPts), gwName: gw?.name
  });
}
