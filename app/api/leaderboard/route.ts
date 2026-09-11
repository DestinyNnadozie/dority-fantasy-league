import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET() {
  const teams = await prisma.team.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { overallPoints: "desc" }
  });
  return NextResponse.json({
    teams: teams.map((t) => ({
      id: t.id,
      teamId: t.id,
      name: t.name,
      teamName: t.name,
      manager: t.user?.name || "",
      overallPoints: t.overallPoints || 0
    }))
  });
}
