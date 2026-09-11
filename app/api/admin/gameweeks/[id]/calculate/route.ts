import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { readSession } = await import("@/lib/auth/session");
  const session = await readSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { prisma } = await import("@/lib/db");
  const { id } = await ctx.params;
  return NextResponse.json({ ok: true, gameweekId: Number(id) });
}
