import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { calculateGameweek } from "@/lib/scoring/calculateGameweek";
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await readSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await calculateGameweek(Number(id));
  return NextResponse.json({ ok: true });
}
