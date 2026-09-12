import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
export const dynamic = "force-dynamic";

type Choice = "HOME" | "DRAW" | "AWAY";

export async function GET() {
  const session = await readSession();
  const votes = await (prisma as any).prediction.findMany();
  const mine = session ? votes.filter((v: any) => v.userId === session.id) : [];
  const totals: Record<string, { HOME: number; DRAW: number; AWAY: number; n: number }> = {};
  for (const v of votes) {
    const choice = String(v.choice);
    if (choice !== "HOME" && choice !== "DRAW" && choice !== "AWAY") continue;
    if (!totals[v.fixtureKey]) totals[v.fixtureKey] = { HOME: 0, DRAW: 0, AWAY: 0, n: 0 };
    const row = totals[v.fixtureKey];
    if (choice === "HOME") row.HOME += 1;
    if (choice === "DRAW") row.DRAW += 1;
    if (choice === "AWAY") row.AWAY += 1;
    row.n += 1;
  }
  const pct: Record<string, { HOME: number; DRAW: number; AWAY: number; n: number }> = {};
  for (const k of Object.keys(totals)) {
    const t = totals[k];
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
  const choice = String(b.choice || "") as Choice;
  if (!fixtureKey || (choice !== "HOME" && choice !== "DRAW" && choice !== "AWAY")) {
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
