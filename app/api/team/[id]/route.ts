import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentGameweek } from "@/lib/gameweek";
export const dynamic = "force-dynamic";
export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const gw = await getCurrentGameweek();
  const team = await prisma.team.findUnique({
    where: { id },
    include: { user: { select: { name: true } }, picks: { where: gw ? { gameweekId: gw.id } : undefined, include: { player: true } } }
  });
  if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const stats = gw ? await prisma.playerGameweekStat.findMany({
    where: { gameweekId: gw.id, playerId: { in: team.picks.map((pick) => pick.playerId) } },
    select: { playerId: true, rawPoints: true }
  }) : [];
  const points = Object.fromEntries(stats.map((stat) => [stat.playerId, stat.rawPoints]));
  const picks = team.picks.map((pick) => ({
    ...pick, player: { ...pick.player, gwPoints: points[pick.playerId] ?? 0 }
  }));
  return NextResponse.json({ team: {
    id: team.id, name: team.name, owner: team.user?.name,
    overallPoints: team.overallPoints, gameweekName: gw?.name, picks
  } });
}
