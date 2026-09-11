import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { readSession } from "@/lib/auth/session";

const file = path.join(process.cwd(), "data", "fixtures.json");
async function readFix() {
  try { return JSON.parse(await fs.readFile(file, "utf8")); }
  catch { return []; }
}

export async function GET() {
  return NextResponse.json({ fixtures: await readFix() });
}

export async function POST(req: Request) {
  const session = await readSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const items = await readFix();
  items.push({
    id: String(Date.now()),
    gameweekId: Number(body.gameweekId || 1),
    kickoff: String(body.kickoff || ""),
    home: String(body.home || ""),
    away: String(body.away || ""),
    homeGoals: body.homeGoals === "" || body.homeGoals == null ? "" : Number(body.homeGoals),
    awayGoals: body.awayGoals === "" || body.awayGoals == null ? "" : Number(body.awayGoals)
  });
  await fs.writeFile(file, JSON.stringify(items, null, 2));
  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request) {
  const session = await readSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const items = (await readFix()).map((f: any) => f.id === body.id ? { ...f, ...body } : f);
  await fs.writeFile(file, JSON.stringify(items, null, 2));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await readSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await req.json();
  const items = (await readFix()).filter((f: any) => f.id !== String(id));
  await fs.writeFile(file, JSON.stringify(items, null, 2));
  return NextResponse.json({ ok: true });
}
