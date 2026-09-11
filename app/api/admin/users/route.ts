import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth/session";

export async function GET() {
  const session = await readSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { team: true }
  });
  return NextResponse.json({
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

export async function PATCH(req: Request) {
  const session = await readSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { userId, password } = await req.json();
  if (!userId || String(password || "").length < 6) {
    return NextResponse.json({ error: "Password must be 6+ characters" }, { status: 400 });
  }
  await prisma.user.update({
    where: { id: String(userId) },
    data: { passwordHash: await bcrypt.hash(String(password), 10) }
  });
  return NextResponse.json({ ok: true });
}
