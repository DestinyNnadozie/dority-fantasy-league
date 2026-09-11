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
  return NextResponse.json({ team: { id: team.id, name: team.name, owner: team.user?.name, overallPoints: team.overallPoints, picks: team.picks } });
}
