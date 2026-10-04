import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { calculateGameweek } from "@/lib/scoring/calculateGameweek";

function scored(f: { homeGoals: number | null; awayGoals: number | null }) {
  return f.homeGoals !== null && f.awayGoals !== null;
}

export async function POST() {
  const session = await readSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const last = await prisma.gameweek.findFirst({ orderBy: { id: "desc" } });
  if (!last) return NextResponse.json({ error: "No gameweek exists" }, { status: 400 });

  // Use the same database records that Save score writes to /api/fixtures.
  const fixtures = await prisma.fixture.findMany({ where: { gameweekId: last.id } });
  if (fixtures.length === 0) {
    return NextResponse.json({ error: "Add and confirm all " + last.name + " fixture scores first" }, { status: 400 });
  }
  const missing = fixtures.filter((f) => !scored(f));
  if (missing.length) {
    return NextResponse.json({
      error: "Confirm scores for all " + last.name + " fixtures first (" + missing.length + " still open)"
    }, { status: 400 });
  }

  const nextId = last.id + 1;
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 7);

  const gw = await prisma.$transaction(async (tx) => {
  const created = await tx.gameweek.create({
    data: { id: nextId, name: "Gameweek " + nextId, deadline, status: "OPEN" }
  });

  const picks = await tx.squadPick.findMany({ where: { gameweekId: last.id } });
  if (picks.length) {
    await tx.squadPick.createMany({
      data: picks.map((p) => ({
        teamId: p.teamId,
        playerId: p.playerId,
        gameweekId: nextId,
        slot: p.slot,
        squadOrder: p.squadOrder,
        isCaptain: p.isCaptain,
        isViceCaptain: p.isViceCaptain,
        purchasePrice: p.purchasePrice
      }))
    });
  }

  await calculateGameweek(nextId, undefined, tx);
  await tx.gameweek.update({ where: { id: last.id }, data: { status: "FINISHED" } });
  return created;
  }, { timeout: 30000 });
  return NextResponse.json({ gameweek: gw });
}
