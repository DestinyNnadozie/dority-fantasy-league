import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readSession } from "@/lib/auth/session";

export async function GET() {
  const user = await readSession();
  return NextResponse.json({ user });
}

export async function DELETE() {
  (await cookies()).delete("sfl_session");
  return NextResponse.json({ ok: true });
}
