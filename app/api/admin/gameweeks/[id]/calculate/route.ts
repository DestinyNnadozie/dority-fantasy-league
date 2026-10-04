import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { calculateGameweek } from "@/lib/scoring/calculateGameweek";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await readSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const gameweekId = Number((await context.params).id);
  if (!Number.isSafeInteger(gameweekId) || gameweekId < 1) {
    return NextResponse.json({ error: "Invalid gameweek" }, { status: 400 });
  }
  const playerId = new URL(req.url).searchParams.get("playerId") || undefined;
  try {
    const gameweek = await prisma.gameweek.findUnique({ where: { id: gameweekId } });
    if (!gameweek) return NextResponse.json({ error: "Gameweek not found" }, { status: 404 });
    const count = await prisma.playerGameweekStat.count({ where: { gameweekId, playerId } });
    if (!count) {
      return NextResponse.json({ error: "Save stats for this gameweek before calculating points" }, { status: 400 });
    }
    const result = await calculateGameweek(gameweekId, playerId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Point calculation failed", error);
    return NextResponse.json({ error: "Could not calculate points. Please try again." }, { status: 500 });
  }
}
