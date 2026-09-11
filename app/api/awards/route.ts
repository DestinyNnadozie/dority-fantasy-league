import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth/session";

const file = path.join(process.cwd(), "data", "awards.json");

async function readAwards() {
  try { return JSON.parse(await fs.readFile(file, "utf8")); }
  catch { return { totw: { gameweek: 1, playerIds: [] }, tots: { playerIds: [] } }; }
}

export async function GET() {
  const awards = await readAwards();
  const ids = [...new Set([...(awards.totw.playerIds || []), ...(awards.tots.playerIds || [])])];
  const players = ids.length
    ? await prisma.schoolPlayer.findMany({ where: { id: { in: ids } } })
    : [];
  const byId = Object.fromEntries(players.map((p) => [p.id, p]));
  return NextResponse.json({ awards, players: byId });
}

export async function PUT(req: Request) {
  const session = await readSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const current = await readAwards();
  const next = {
    totw: { gameweek: Number(body.totw?.gameweek || current.totw.gameweek || 1), playerIds: body.totw?.playerIds || current.totw.playerIds },
    tots: { playerIds: body.tots?.playerIds || current.tots.playerIds }
  };
  await fs.writeFile(file, JSON.stringify(next, null, 2));
  return NextResponse.json({ ok: true });
}
