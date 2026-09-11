import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { sendVerifyEmail } from "@/lib/mail";

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
    if (exists) {
      return NextResponse.json({ error: "Email already registered. Use Login." }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: await bcrypt.hash(password, 10),
        role: "STUDENT",
        team: { create: { name: teamName, bank: 3000 } }
      }
    });

    const token = crypto.randomBytes(24).toString("hex");
    await prisma.user.update({ where: { id: user.id }, data: { verifyToken: token } });
    try {
      await sendVerifyEmail(user.email, token);
    } catch (e) {
      console.error(e);
    }

    return NextResponse.json({
      ok: true,
      message: "Check your email and tap Verify account before login."
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Register failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}