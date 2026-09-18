import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { getCurrentGameweek } from "@/lib/gameweek";
export const dynamic = "force-dynamic";

function isAdmin(session: any) {
  return session && (session.role === "ADMIN" || session.role === "TEACHER" || session.email === "coordinator@school.local");
}

function shape(f: any) {
  return {
    id: f.id,
    home: f.homeTeam,
    away: f.awayTeam,
    kickoff: f.kickoff,
    homeGoals: f.homeGoals,
    awayGoals: f.awayGoals,
    finished: f.finished,
    gameweekId: f.gameweekId
  };
}

export async function GET() {
  const fixtures = await prisma.fixture.findMany({ orderBy: { kickoff: "asc" } });
  return NextResponse.json({ fixtures: fixtures.map(shape) });
}

export async function POST(req: Request) {
  try {
    const session = await readSession();
    if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const b = await req.json();
    const homeTeam = String(b.home || b.homeTeam || "");
    const awayTeam = String(b.away || b.awayTeam || "");
    if (!homeTeam || !awayTeam || homeTeam === awayTeam) {
      return NextResponse.json({ error: "Pick two different teams" }, { status: 400 });
    }
    const kickoff = new Date(b.kickoff);
    if (Number.isNaN(kickoff.getTime())) return NextResponse.json({ error: "Bad date" }, { status: 400 });
    const gw = await getCurrentGameweek();
    if (!gw) return NextResponse.json({ error: "No open gameweek" }, { status: 400 });
    const fixture = await prisma.fixture.create({
      data: { homeTeam, awayTeam, kickoff, gameweekId: gw.id }
    });
    return NextResponse.json({ fixture: shape(fixture) });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not add fixture" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await readSession();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  const fixture = await prisma.fixture.update({
    where: { id: String(b.id) },
    data: {
      homeGoals: b.homeGoals === "" || b.homeGoals == null ? null : Number(b.homeGoals),
      awayGoals: b.awayGoals === "" || b.awayGoals == null ? null : Number(b.awayGoals)
    }
  });
  return NextResponse.json({ fixture: shape(fixture) });
}

export async function DELETE(req: Request) {
  const session = await readSession();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  await prisma.fixture.delete({ where: { id: String(b.id) } });
  return NextResponse.json({ ok: true });
}