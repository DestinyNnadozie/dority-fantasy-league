import { prisma } from "@/lib/db";
import { calculatePlayerPoints } from "./rules";

export async function calculateGameweek(gameweekId: number, playerId?: string) {
  // Commit player points and team totals together; recalculating replaces scores.
  return prisma.$transaction(async (tx) => {
    const stats = await tx.playerGameweekStat.findMany({ where: { gameweekId, playerId }, include: { player: true } });
    for (const row of stats) {
      const rawPoints = calculatePlayerPoints({ ...row, position: row.player.position });
      await tx.playerGameweekStat.update({ where: { id: row.id }, data: { rawPoints } });
    }
    const refreshed = await tx.playerGameweekStat.findMany({ where: { gameweekId } });
    const pointsByPlayer = Object.fromEntries(refreshed.map((s) => [s.playerId, s.rawPoints]));
    const minutesByPlayer = Object.fromEntries(refreshed.map((s) => [s.playerId, s.minutes]));
    const teams = await tx.team.findMany({ include: { picks: { where: { gameweekId } }, gameweekScores: { where: { gameweekId } } } });
    for (const team of teams) {
      const starting = team.picks.filter((p) => p.slot === "STARTING");
      const captain = starting.find((p) => p.isCaptain);
      let points = starting.reduce((s, p) => s + (pointsByPlayer[p.playerId] || 0), 0);
      if (captain && (minutesByPlayer[captain.playerId] || 0) > 0) points += pointsByPlayer[captain.playerId] || 0;
      const transferHits = team.gameweekScores[0]?.transferHits ?? 0;
      const finalPoints = points - transferHits;
      await tx.teamGameweekScore.upsert({
        where: { teamId_gameweekId: { teamId: team.id, gameweekId } },
        create: { teamId: team.id, gameweekId, points, transferHits, finalPoints },
        update: { points, finalPoints }
      });
      const season = await tx.teamGameweekScore.aggregate({ where: { teamId: team.id }, _sum: { finalPoints: true } });
      await tx.team.update({ where: { id: team.id }, data: { overallPoints: season._sum.finalPoints || 0 } });
    }
    return { playersCalculated: stats.length, teamsUpdated: teams.length };
  }, { timeout: 30000 });
}
