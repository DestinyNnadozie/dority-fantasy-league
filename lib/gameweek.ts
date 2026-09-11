import { prisma } from "./db";

export async function getCurrentGameweek() {
  const open = await prisma.gameweek.findFirst({ where: { status: "OPEN" }, orderBy: { id: "asc" } });
  if (open) return open;
  return prisma.gameweek.findFirst({ orderBy: { id: "desc" } });
}

export async function assertPicksEditable() {
  const gw = await getCurrentGameweek();
  if (!gw) throw new Error("No gameweek configured");
  if (gw.status !== "OPEN") throw new Error("Gameweek is locked");
  if (new Date() >= gw.deadline) throw new Error("Deadline has passed");
  return gw;
}
