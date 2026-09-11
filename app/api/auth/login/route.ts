import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { setSessionCookie, signSession } from "@/lib/auth/session";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const user = await prisma.user.findUnique({
    where: { email: String(email).toLowerCase() }
  });
  if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  if (user.email !== "coordinator@school.local" && !user.emailVerified) {
    return NextResponse.json({ error: "Confirm your email first" }, { status: 403 });
  }
  const token = await signSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  });
  await setSessionCookie(token);
  return NextResponse.json({ ok: true });
}