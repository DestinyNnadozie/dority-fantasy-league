import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
export const dynamic = "force-dynamic";
export async function GET() {
  const awards = await prisma.award.findMany();
  return NextResponse.json({ awards });
}
export async function POST(req: Request) {
  const session = await readSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  const kind = String(b.kind);
  if (kind === "TOTW" || kind === "TOTS") {
    await prisma.award.deleteMany({ where: { kind } });
    const names = String(b.players || "").split("\n").map((s: string) => s.trim()).filter(Boolean);
    await prisma.award.createMany({ data: names.map((n: string) => ({ kind, label: kind, playerName: n, teamName: "", fixtureKey: "" })) });
    return NextResponse.json({ ok: true });
  }
  if (kind === "POTW") await prisma.award.deleteMany({ where: { kind: "POTW" } });
  await prisma.award.create({ data: { kind, label: kind, playerName: String(b.playerName || ""), teamName: String(b.teamName || ""), fixtureKey: String(b.fixtureKey || "") } });
  return NextResponse.json({ ok: true });
}
