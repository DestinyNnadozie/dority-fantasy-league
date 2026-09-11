import { prisma } from "@/lib/db";
import { calculatePlayerPoints } from "./rules";

export async function calculateGameweek(gameweekId: number) {
  const stats = await prisma.playerGameweekStat.findMany({ where: { gameweekId }, include: { player: true } });
  for (const row of stats) {
    const rawPoints = calculatePlayerPoints({ ...row, position: row.player.position });
    await prisma.playerGameweekStat.update({ where: { id: row.id }, data: { rawPoints } });
  }
  const refreshed = await prisma.playerGameweekStat.findMany({ where: { gameweekId } });
  const pointsByPlayer = Object.fromEntries(refreshed.map((s) => [s.playerId, s.rawPoints]));
  const minutesByPlayer = Object.fromEntries(refreshed.map((s) => [s.playerId, s.minutes]));
  const teams = await prisma.team.findMany({ include: { picks: { where: { gameweekId } } } });
  for (const team of teams) {
    const starting = team.picks.filter((p) => p.slot === "STARTING");
    const captain = team.picks.find((p) => p.isCaptain);
    let points = starting.reduce((s, p) => s + (pointsByPlayer[p.playerId] || 0), 0);
    if (captain && (minutesByPlayer[captain.playerId] || 0) > 0) points += pointsByPlayer[captain.playerId] || 0;
    await prisma.teamGameweekScore.upsert({
      where: { teamId_gameweekId: { teamId: team.id, gameweekId } },
      create: { teamId: team.id, gameweekId, points, transferHits: 0, finalPoints: points },
      update: { points, finalPoints: points }
    });
    const season = await prisma.teamGameweekScore.aggregate({ where: { teamId: team.id }, _sum: { finalPoints: true } });
    await prisma.team.update({ where: { id: team.id }, data: { overallPoints: season._sum.finalPoints || 0 } });
  }
}
