import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth/session";

export async function GET() {
  const gws = await prisma.gameweek.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json({ gameweeks: gws });
}

export async function PUT(req: Request) {
  const session = await readSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const id = Number(body.id || 1);
  const deadline = new Date(body.deadline);
  if (Number.isNaN(deadline.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  const status = body.status === "LOCKED" || body.status === "FINISHED" ? body.status : "OPEN";
  const gw = await prisma.gameweek.upsert({
    where: { id },
    update: { deadline, status, name: body.name || "Gameweek " + id },
    create: { id, name: body.name || "Gameweek " + id, deadline, status }
  });
  return NextResponse.json({ gameweek: gw });
}
