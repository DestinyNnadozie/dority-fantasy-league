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
  const stats = team && gw ? await prisma.playerGameweekStat.findMany({
    where: { gameweekId: gw.id, playerId: { in: team.picks.map((p) => p.playerId) } },
    select: { playerId: true, rawPoints: true }
  }) : [];
  const points = Object.fromEntries(stats.map((s) => [s.playerId, s.rawPoints]));
  return NextResponse.json({
    team: team ? { ...team, picks: team.picks.map((pick) => ({
      ...pick, player: { ...pick.player, gwPoints: points[pick.playerId] ?? 0 }
    })) } : null,
    gameweek: gw
  });
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
    if (unique.filter((p) => p.slot === "STARTING").length !== 9) {
      throw new Error("Need 9 starters");
    }
    if (unique.filter((p) => p.slot === "BENCH").length !== 6) {
      throw new Error("Need 6 bench players");
    }
    if (!unique.some((p) => p.slot === "STARTING" && p.isCaptain)) {
      throw new Error("Choose a captain");
    }
    const players = await prisma.schoolPlayer.findMany({
      where: { id: { in: unique.map((p) => p.playerId) } }
    });
    const byId = Object.fromEntries(players.map((p) => [p.id, p]));
    if (players.length !== unique.length) throw new Error("One or more players no longer exist");
    const existing = await prisma.squadPick.findMany({ where: { teamId: team.id, gameweekId: gw.id }, select: { playerId: true, player: { select: { teamName: true } } } });
    const existingIds = new Set(existing.map((p) => p.playerId));
    if (players.some((p) => p.status === "retired" && !existingIds.has(p.id))) {
      throw new Error("A removed player cannot be added to a squad");
    }
    const spent = unique.reduce((s, p) => s + (byId[p.playerId]?.price ?? 9999), 0);
    if (spent > 3000) throw new Error("Over budget");
    const clubCount: Record<string, number> = {};
    const existingClubCount: Record<string, number> = {};
    for (const pick of existing) {
      const club = pick.player.teamName || "Unknown";
      existingClubCount[club] = (existingClubCount[club] || 0) + 1;
    }
    for (const p of unique) {
      const club = byId[p.playerId]?.teamName || "Unknown";
      clubCount[club] = (clubCount[club] || 0) + 1;
      if (clubCount[club] > Math.max(4, existingClubCount[club] || 0)) throw new Error("Max 4 players from " + club + ". Existing excess cannot be increased.");
    }
    await prisma.$transaction(async (tx) => {
    await tx.squadPick.deleteMany({ where: { teamId: team.id, gameweekId: gw.id } });
    await tx.squadPick.createMany({
      skipDuplicates: true,
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
    await tx.team.update({ where: { id: team.id }, data: { bank: 3000 - spent } });
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 });
  }
}
