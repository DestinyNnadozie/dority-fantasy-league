import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { setSessionCookie, signSession } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "").trim();
    const teamName = String(body.teamName || "").trim();
    const password = String(body.password || "");
    if (!email || !name || !teamName || password.length < 6) {
      return NextResponse.json({ error: "Fill all fields. Password must be 6+ characters." }, { status: 400 });
    }
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: "Email already registered. Use Login." }, { status: 409 });
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: await bcrypt.hash(password, 10),
        role: "STUDENT",
        team: { create: { name: teamName, bank: 3000 } }
      }
    });
    const token = await signSession({ id: user.id, email: user.email, name: user.name, role: user.role });
    await setSessionCookie(token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Register failed" }, { status: 500 });
  }
}
