import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { assertPicksEditable, getCurrentGameweek } from "@/lib/gameweek";

export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const gw = await getCurrentGameweek();
  const team = await prisma.team.findUnique({
    where: { userId: session.id },
    include: { picks: { where: { gameweekId: gw?.id ?? 0 }, include: { player: true } } }
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
    const incoming = (await req.json()).picks as { playerId: string; slot: "STARTING" | "BENCH"; squadOrder: number; isCaptain: boolean; isViceCaptain: boolean }[];
    if (incoming.filter((p) => p.slot === "STARTING").length !== 9) throw new Error("Starting lineup must be 9 players (1 GK + 8)");

    const old = await prisma.squadPick.findMany({ where: { teamId: team.id, gameweekId: gw.id } });
    const oldIds = new Set(old.map((p) => p.playerId));
    const newIds = new Set(incoming.map((p) => p.playerId));
    const outIds = [...oldIds].filter((id) => !newIds.has(id));
    const inIds = [...newIds].filter((id) => !oldIds.has(id));

    const players = await prisma.schoolPlayer.findMany({ where: { id: { in: incoming.map((p) => p.playerId) } } });
    const byId = Object.fromEntries(players.map((p) => [p.id, p]));
    const spent = incoming.reduce((s, p) => s + (byId[p.playerId]?.price ?? 9999), 0);
    if (spent > 3000) throw new Error("Over budget");

    const clubCount: Record<string, number> = {};
    for (const p of incoming) {
      const club = byId[p.playerId]?.teamName || "Unknown";
      clubCount[club] = (clubCount[club] || 0) + 1;
      if (clubCount[club] > 4) throw new Error("Max 4 players from " + club);
    }

    const pairs = Math.max(outIds.length, inIds.length);
    const transferRows = [];
    for (let i = 0; i < pairs; i++) {
      if (!outIds[i] || !inIds[i]) continue;
      transferRows.push({ teamId: team.id, gameweekId: gw.id, playerOutId: outIds[i], playerInId: inIds[i], cost: 0 });
    }

    await prisma.$transaction([
      prisma.squadPick.deleteMany({ where: { teamId: team.id, gameweekId: gw.id } }),
      prisma.squadPick.createMany({
        data: incoming.map((p) => ({
          teamId: team.id, playerId: p.playerId, gameweekId: gw.id, slot: p.slot,
          squadOrder: p.squadOrder, isCaptain: p.isCaptain, isViceCaptain: p.isViceCaptain,
          purchasePrice: byId[p.playerId].price
        }))
      }),
      ...(transferRows.length ? [prisma.transfer.createMany({ data: transferRows })] : []),
      prisma.team.update({ where: { id: team.id }, data: { bank: 3000 - spent } })
    ]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 });
  }
}
