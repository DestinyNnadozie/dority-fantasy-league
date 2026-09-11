import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { readSession } = await import("@/lib/auth/session");
  const { prisma } = await import("@/lib/db");
  const session = await readSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const gwId = Number(id);
  const picks = await prisma.squadPick.findMany({
    where: { gameweekId: gwId },
    include: { player: true }
  });
  const stats = await prisma.playerGameweekStat.findMany({ where: { gameweekId: gwId } });
  const pts: Record<string, number> = {};
  for (const s of stats) pts[s.playerId] = s.rawPoints || 0;
  const byTeam: Record<string, number> = {};
  for (const p of picks) {
    if (p.slot !== "STARTING") continue;
    const raw = pts[p.playerId] || 0;
    const add = p.isCaptain ? raw * 2 : raw;
    byTeam[p.teamId] = (byTeam[p.teamId] || 0) + add;
  }
  for (const [teamId, score] of Object.entries(byTeam)) {
    await prisma.team.update({
      where: { id: teamId },
      data: { overallPoints: { increment: score } }
    });
  }
  await prisma.gameweek.update({ where: { id: gwId }, data: { status: "COMPLETED" } });
  return NextResponse.json({ ok: true, teams: Object.keys(byTeam).length });
}