import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
export const dynamic = "force-dynamic";
export async function GET() {
  const session = await readSession();
  const votes = await (prisma as any).prediction.findMany();
  const mine = session ? votes.filter((v: any) => v.userId === session.id) : [];
  const totals: Record<string, { HOME: number; DRAW: number; AWAY: number; n: number }> = {};
  for (const v of votes) {
    if (!totals[v.fixtureKey]) totals[v.fixtureKey] = { HOME: 0, DRAW: 0, AWAY: 0, n: 0 };
    if (v.choice === "HOME" || v.choice === "DRAW" || v.choice === "AWAY") {
      totals[v.fixtureKey][v.choice] += 1;
      totals[v.fixtureKey].n += 1;
    }
  }
  const pct: Record<string, any> = {};
  for (const [k, t] of Object.entries(totals)) {
    pct[k] = {
      HOME: t.n ? Math.round((t.HOME / t.n) * 100) : 0,
      DRAW: t.n ? Math.round((t.DRAW / t.n) * 100) : 0,
      AWAY: t.n ? Math.round((t.AWAY / t.n) * 100) : 0,
      n: t.n
    };
  }
  return NextResponse.json({
    mine: Object.fromEntries(mine.map((v: any) => [v.fixtureKey, v.choice])),
    pct
  });
}
export async function POST(req: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "Login first" }, { status: 401 });
  const b = await req.json();
  const fixtureKey = String(b.fixtureKey || "");
  const choice = String(b.choice || "");
  if (!fixtureKey || ["HOME", "DRAW", "AWAY"].indexOf(choice) === -1) {
    return NextResponse.json({ error: "Bad vote" }, { status: 400 });
  }
  const db = prisma as any;
  await db.prediction.upsert({
    where: { userId_fixtureKey: { userId: session.id, fixtureKey } },
    update: { choice },
    create: { userId: session.id, fixtureKey, choice }
  });
  return NextResponse.json({ ok: true });
}
