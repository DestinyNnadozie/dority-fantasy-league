import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "Login as coordinator" }, { status: 401 });
  const ok = session.role === "ADMIN" || session.email === "coordinator@school.local";
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const users = await prisma.user.findMany({ include: { team: true } });
  return NextResponse.json({
    count: users.length,
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      teamName: u.team?.name || "-",
      points: u.team?.overallPoints || 0
    }))
  });
}
