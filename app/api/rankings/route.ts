import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const rows = await prisma.playerGameweekStat.findMany({ include: { player: true } });
  const map = new Map<string, any>();
  for (const r of rows) {
    const cur = map.get(r.playerId) || {
      id: r.playerId,
      name: r.player.firstName + " " + r.player.lastName,
      team: r.player.teamName,
      position: r.player.position,
      goals: 0, assists: 0, yellow: 0, red: 0, cleanSheets: 0
    };
    cur.goals += r.goals;
    cur.assists += r.assists;
    cur.yellow += r.yellowCards;
    cur.red += r.redCards;
    if (r.cleanSheet) cur.cleanSheets += 1;
    map.set(r.playerId, cur);
  }
  const all = [...map.values()];
  const sort = (key: string) => [...all].sort((a, b) => b[key] - a[key] || a.name.localeCompare(b.name));
  return NextResponse.json({
    goals: sort("goals"),
    assists: sort("assists"),
    yellow: sort("yellow"),
    red: sort("red"),
    cleanSheets: sort("cleanSheets")
  });
}
