import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
export const dynamic = "force-dynamic";

function isAdmin(session: any) {
  return session && (session.role === "ADMIN" || session.role === "TEACHER" || session.email === "coordinator@school.local");
}

export async function GET() {
  const fixtures = await (prisma as any).fixture.findMany({ orderBy: { kickoff: "asc" } });
  return NextResponse.json({ fixtures });
}

export async function POST(req: Request) {
  const session = await readSession();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  const home = String(b.home || "");
  const away = String(b.away || "");
  if (!home || !away || home === away) return NextResponse.json({ error: "Pick two different teams" }, { status: 400 });
  const kickoff = b.kickoff ? new Date(b.kickoff) : new Date();
  if (Number.isNaN(kickoff.getTime())) return NextResponse.json({ error: "Bad date" }, { status: 400 });
  const fixture = await (prisma as any).fixture.create({
    data: { home, away, kickoff }
  });
  return NextResponse.json({ fixture });
}

export async function PUT(req: Request) {
  const session = await readSession();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  const fixture = await (prisma as any).fixture.update({
    where: { id: String(b.id) },
    data: {
      homeGoals: b.homeGoals === "" || b.homeGoals == null ? null : Number(b.homeGoals),
      awayGoals: b.awayGoals === "" || b.awayGoals == null ? null : Number(b.awayGoals)
    }
  });
  return NextResponse.json({ fixture });
}

export async function DELETE(req: Request) {
  const session = await readSession();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  await (prisma as any).fixture.delete({ where: { id: String(b.id) } });
  return NextResponse.json({ ok: true });
}