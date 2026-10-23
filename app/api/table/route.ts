import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import initialTable from "@/data/table.json";
import { readSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
const fields = ["played", "won", "drawn", "lost", "gf", "ga", "pts"] as const;
type Row = { team: string } & Record<typeof fields[number], number>;
function sorted(rows: Row[]) {
  return [...rows].sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.team.localeCompare(b.team));
}
function failed(error: unknown) {
  console.error("Club table database operation failed", error);
  const missing = (error as { code?: string })?.code === "P2021";
  return NextResponse.json({ error: missing
    ? "Club table database setup is required. Ask the administrator to run npm run db:club-table."
    : "Could not save or load the club table. Please try again." }, { status: 503 });
}

export async function GET() {
  try {
    const rows = await prisma.clubStanding.findMany();
    return NextResponse.json({ table: sorted(rows.length ? rows : initialTable) });
  } catch (error) { return failed(error); }
}

export async function PUT(req: Request) {
  const session = await readSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let body;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid table data" }, { status: 400 }); }
  const table = body?.table;
  const clubs = new Set(initialTable.map((row) => row.team));
  if (!Array.isArray(table) || table.length !== clubs.size || new Set(table.map((r) => r?.team)).size !== clubs.size ||
    table.some((row) => !row || !clubs.has(row.team) || fields.some((key) => !Number.isSafeInteger(row[key]) || row[key] < 0 || row[key] > 2147483647))) {
    return NextResponse.json({ error: "Include every club once and use non-negative whole numbers for all statistics." }, { status: 400 });
  }
  const clean: Row[] = table.map((row) => ({ team: row.team, played: row.played, won: row.won, drawn: row.drawn, lost: row.lost, gf: row.gf, ga: row.ga, pts: row.pts }));
  try {
    await prisma.$transaction(clean.map((row) => prisma.clubStanding.upsert({
      where: { team: row.team }, create: row, update: row
    })));
    return NextResponse.json({ ok: true, table: sorted(clean) });
  } catch (error) { return failed(error); }
}
