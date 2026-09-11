import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { readSession } from "@/lib/auth/session";

const file = path.join(process.cwd(), "data", "news.json");

async function readNews() {
  try { return JSON.parse(await fs.readFile(file, "utf8")); }
  catch { return []; }
}

export async function GET() {
  return NextResponse.json({ news: await readNews() });
}

export async function POST(req: Request) {
  const session = await readSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const items = await readNews();
  items.unshift({
    id: String(Date.now()),
    title: String(body.title || "Update"),
    body: String(body.body || ""),
    date: new Date().toISOString().slice(0, 10)
  });
  await fs.writeFile(file, JSON.stringify(items, null, 2));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await readSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await req.json();
  const items = (await readNews()).filter((n: any) => n.id !== String(id));
  await fs.writeFile(file, JSON.stringify(items, null, 2));
  return NextResponse.json({ ok: true });
}
