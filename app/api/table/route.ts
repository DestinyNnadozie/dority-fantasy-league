import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { readSession } from "@/lib/auth/session";

const file = path.join(process.cwd(), "data", "table.json");

async function readTable() {
  try { return JSON.parse(await fs.readFile(file, "utf8")); }
  catch { return []; }
}

export async function GET() {
  const rows = await readTable();
  const sorted = [...rows].sort((a: any, b: any) => {
    const gdA = a.gf - a.ga, gdB = b.gf - b.ga;
    return b.pts - a.pts || gdB - gdA || b.gf - a.gf;
  });
  return NextResponse.json({ table: sorted });
}

export async function PUT(req: Request) {
  const session = await readSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { table } = await req.json();
  const clean = (table || []).map((r: any) => ({
    team: String(r.team),
    played: Number(r.played || 0),
    won: Number(r.won || 0),
    drawn: Number(r.drawn || 0),
    lost: Number(r.lost || 0),
    gf: Number(r.gf || 0),
    ga: Number(r.ga || 0),
    pts: Number(r.pts || 0)
  }));
  await fs.writeFile(file, JSON.stringify(clean, null, 2));
  return NextResponse.json({ ok: true });
}
