import { Position } from "@prisma/client";
export const POINTS = {
  appearance: 1, longAppearance: 1,
  goal: { GK: 6, DEF: 6, MID: 5, FWD: 4 } as Record<Position, number>,
  assist: 3,
  cleanSheet: { GK: 4, DEF: 4, MID: 1, FWD: 0 } as Record<Position, number>,
  yellow: -1, red: -3, ownGoal: -2, penaltyMiss: -2, penaltySave: 5, savePer: 3
};
export function calculatePlayerPoints(s: any) {
  if (s.minutes <= 0) return 0;
  let pts = POINTS.appearance;
  if (s.minutes >= 60) pts += POINTS.longAppearance;
  pts += s.goals * POINTS.goal[s.position as Position];
  pts += s.assists * POINTS.assist;
  if (s.cleanSheet) pts += POINTS.cleanSheet[s.position as Position];
  pts += s.yellowCards * POINTS.yellow + s.redCards * POINTS.red + s.ownGoals * POINTS.ownGoal;
  pts += s.penaltyMisses * POINTS.penaltyMiss + s.penaltySaves * POINTS.penaltySave;
  pts += Math.floor((s.saves || 0) / POINTS.savePer) + (s.bonus || 0);
  return pts;
}
