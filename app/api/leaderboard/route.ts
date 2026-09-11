import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export async function GET() {
  const teams = await prisma.team.findMany({ orderBy: { overallPoints: "desc" }, include: { user: true } });
  return NextResponse.json({ standings: teams.map((t, i) => ({ rank: i + 1, teamName: t.name, manager: t.user.name, points: t.overallPoints })) });
}
