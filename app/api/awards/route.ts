import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
export const dynamic = "force-dynamic";

function isCoord(session: any) {
  return session && (session.role === "ADMIN" || session.role === "TEACHER" || session.email === "coordinator@school.local");
}

export async function GET() {
  const awards = await (prisma as any).award.findMany();
  return NextResponse.json({ awards });
}

export async function POST(req: Request) {
  const session = await readSession();
  if (!isCoord(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  const kind = String(b.kind);
  if (kind === "POTM") {
    const fixture = await prisma.fixture.findUnique({ where: { id: String(b.fixtureKey || "") } });
    const player = await prisma.schoolPlayer.findUnique({ where: { id: String(b.playerId || "") } });
    if (!fixture || !player) return NextResponse.json({ error: "Choose a saved fixture and player" }, { status: 400 });
    if (player.teamName !== fixture.homeTeam && player.teamName !== fixture.awayTeam) {
      return NextResponse.json({ error: "Choose a player from one of the fixture's teams" }, { status: 400 });
    }
    await prisma.$transaction(async (tx) => {
      await tx.award.deleteMany({ where: { kind, fixtureKey: fixture.id } });
      await tx.award.create({ data: {
        kind, fixtureKey: fixture.id,
        label: `GW${fixture.gameweekId}: ${fixture.homeTeam} vs ${fixture.awayTeam}`,
        playerName: `${player.firstName} ${player.lastName}`, teamName: player.teamName || ""
      } });
    });
    return NextResponse.json({ ok: true });
  }
  const db = prisma as any;
  if (kind === "TOTW" || kind === "TOTS") {
    await db.award.deleteMany({ where: { kind } });
    const names = String(b.players || "").split("\n").map((s: string) => s.trim()).filter(Boolean);
    await db.award.createMany({ data: names.map((n: string) => ({ kind, label: kind, playerName: n, teamName: "", fixtureKey: "" })) });
    return NextResponse.json({ ok: true });
  }
  if (kind === "POTW" || kind === "POTS") await db.award.deleteMany({ where: { kind } });
  await db.award.create({ data: { kind, label: String(b.label || ""), playerName: String(b.playerName || ""), teamName: String(b.teamName || ""), fixtureKey: String(b.fixtureKey || "") } });
  return NextResponse.json({ ok: true });
}
