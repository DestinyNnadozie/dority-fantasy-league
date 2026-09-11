import { NextResponse } from "next/server";
import { getCurrentGameweek } from "@/lib/gameweek";

export async function GET() {
  const gw = await getCurrentGameweek();
  if (!gw) return NextResponse.json({ ok: false });
  const now = Date.now();
  const end = new Date(gw.deadline).getTime();
  const ms = end - now;
  return NextResponse.json({
    ok: true,
    id: gw.id,
    name: gw.name,
    status: gw.status,
    deadline: gw.deadline,
    locked: gw.status !== "OPEN" || ms <= 0,
    msLeft: ms
  });
}
