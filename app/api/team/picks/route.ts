import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { assertPicksEditable, getCurrentGameweek } from "@/lib/gameweek";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const gw = await getCurrentGameweek();
  const team = await prisma.team.findUnique({
    where: { userId: session.id },
    include: {
      picks: {
        where: gw ? { gameweekId: gw.id } : undefined,
        include: { player: true },
        orderBy: { squadOrder: "asc" }
      }
    }
  });
  return NextResponse.json({ team, gameweek: gw });
}

export async function PUT(req: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const gw = await assertPicksEditable();
    const team = await prisma.team.findUnique({ where: { userId: session.id } });
    if (!team) return NextResponse.json({ error: "No team" }, { status: 400 });
    const incoming = (await req.json()).picks as {
      playerId: string; slot: "STARTING" | "BENCH"; squadOrder: number;
      isCaptain: boolean; isViceCaptain: boolean;
    }[];
    const unique = incoming.filter((p, i, arr) => arr.findIndex((x) => x.playerId === p.playerId) === i);
    if (unique.filter((p) => p.slot === "BENCH").length !== 6) throw new Error("Need 6 bench players");`n    if (unique.filter((p) => p.slot === "STARTING").length !== 9) {
      throw new Error("Starting lineup must be 9 players");
    }
    const players = await prisma.schoolPlayer.findMany({
      where: { id: { in: unique.map((p) => p.playerId) } }
    });
    const byId = Object.fromEntries(players.map((p) => [p.id, p]));
    const spent = unique.reduce((s, p) => s + (byId[p.playerId]?.price ?? 9999), 0);
    if (spent > 3000) throw new Error("Over budget");
    const clubCount: Record<string, number> = {};
    for (const p of unique) {
      const club = byId[p.playerId]?.teamName || "Unknown";
      clubCount[club] = (clubCount[club] || 0) + 1;
      if (clubCount[club] > 4) throw new Error("Max 4 players from " + club);
    }
    await prisma.squadPick.deleteMany({ where: { teamId: team.id, gameweekId: gw.id } });
    await prisma.squadPick.createMany({
      data: unique.map((p, i) => ({
        teamId: team.id,
        playerId: p.playerId,
        gameweekId: gw.id,
        slot: p.slot,
        squadOrder: p.squadOrder || i + 1,
        isCaptain: p.isCaptain,
        isViceCaptain: p.isViceCaptain,
        purchasePrice: byId[p.playerId].price
      }))
    });
    await prisma.team.update({ where: { id: team.id }, data: { bank: 3000 - spent } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 });
  }
}
