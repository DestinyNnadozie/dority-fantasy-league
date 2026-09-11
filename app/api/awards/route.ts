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
