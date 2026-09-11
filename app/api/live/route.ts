import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function liveStatus(kickoff: Date, stored: string) {
  if (stored === "FT") return "FT";
  return Date.now() >= kickoff.getTime() ? "LIVE" : "UPCOMING";
}

export async function GET() {
  const rows = await prisma.liveMatch.findMany({ orderBy: { kickoff: "asc" } });
  const matches = rows.map((m) => ({
    ...m,
    homeXi: JSON.parse(m.homeXi || "[]"),
    awayXi: JSON.parse(m.awayXi || "[]"),
    events: JSON.parse(m.events || "[]"),
    status: liveStatus(m.kickoff, m.status)
  }));
  return NextResponse.json({ matches });
}

export async function POST(req: Request) {
  const session = await readSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const fixtureKey = String(body.fixtureKey || body.homeTeam + "-vs-" + body.awayTeam + "-" + body.kickoff);
  const data = {
    fixtureKey,
    homeTeam: String(body.homeTeam),
    awayTeam: String(body.awayTeam),
    kickoff: new Date(body.kickoff),
    status: String(body.status || "UPCOMING"),
    homeXi: JSON.stringify(body.homeXi || []),
    awayXi: JSON.stringify(body.awayXi || []),
    events: JSON.stringify(body.events || [])
  };
  const row = await prisma.liveMatch.upsert({
    where: { fixtureKey },
    update: data,
    create: data
  });
  return NextResponse.json({ ok: true, id: row.id });
}