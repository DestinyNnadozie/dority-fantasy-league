import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth/session";

export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const team = await prisma.team.findUnique({ where: { userId: session.id } });
  if (!team) return NextResponse.json({ transfers: [] });
  const transfers = await prisma.transfer.findMany({
    where: { teamId: team.id },
    orderBy: { createdAt: "desc" }
  });
  const ids = [...new Set(transfers.flatMap((t) => [t.playerInId, t.playerOutId]))];
  const players = await prisma.schoolPlayer.findMany({ where: { id: { in: ids } } });
  const byId = Object.fromEntries(players.map((p) => [p.id, p.firstName + " " + p.lastName + " (" + (p.teamName || "") + ")"]));
  return NextResponse.json({
    transfers: transfers.map((t) => ({
      id: t.id,
      gameweekId: t.gameweekId,
      cost: t.cost,
      createdAt: t.createdAt,
      playerIn: byId[t.playerInId] || t.playerInId,
      playerOut: byId[t.playerOutId] || t.playerOutId
    }))
  });
}
