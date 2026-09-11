import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth/session";

function code() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }

export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const memberships = await prisma.leagueMember.findMany({
    where: { userId: session.id },
    include: { league: true }
  });
  return NextResponse.json({ leagues: memberships.map((m) => m.league) });
}

export async function POST(req: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name } = await req.json();
  const league = await prisma.league.create({
    data: {
      name: String(name || "My League"),
      type: "CLASSIC",
      code: code(),
      createdBy: session.id,
      members: { create: { userId: session.id } }
    }
  });
  return NextResponse.json({ league });
}
