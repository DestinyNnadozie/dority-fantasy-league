import type { SchoolPlayer, SquadPick } from "@prisma/client";

// Plan on copies: historical picks and their points must never change.
export function planReplacements(picks: SquadPick[], players: SchoolPlayer[]) {
  const byId = new Map(players.map((p) => [p.id, p]));
  const next = picks.map((p) => ({ ...p }));
  const departing = next.filter((p) => byId.get(p.playerId)?.status === "retired");
  const retained = next.filter((p) => byId.get(p.playerId)?.status !== "retired");
  const used = new Set(retained.map((p) => p.playerId));
  const clubs = new Map<string, number>();
  let spent = 0;
  for (const pick of retained) {
    const player = byId.get(pick.playerId);
    if (!player) return null;
    spent += player.price;
    const club = player.teamName || "Unknown";
    clubs.set(club, (clubs.get(club) || 0) + 1);
  }
  const isIcon = (p: SchoolPlayer) => p.teamName?.toLowerCase() === "icons";
  // Transfers or admin club changes can leave retained players above today's cap.
  // Don't remove unrelated players, but never increase an existing excess.
  const clubLimit = (club: string) => clubLimits.get(club) ?? 4;
  const clubLimits = new Map([...clubs].map(([club, count]) => [club, Math.max(4, count)]));
  const options = departing.map((pick) => {
    const old = byId.get(pick.playerId)!;
    return players.filter((p) => p.status === "available" && p.position === old.position && (!isIcon(old) || isIcon(p)))
      .sort((a, b) => Number(isIcon(a)) - Number(isIcon(b)) || Math.abs(a.price - old.price) - Math.abs(b.price - old.price) || a.price - b.price || a.id.localeCompare(b.id));
  });
  // Backtrack so multiple departing players don't consume each other's only option.
  function choose(index: number, allowIconFallback: boolean): boolean {
    if (index === departing.length) return spent <= 3000 && [...clubs].every(([club, count]) => count <= clubLimit(club));
    const pick = departing[index];
    const oldId = pick.playerId;
    const oldPrice = pick.purchasePrice;
    for (const candidate of options[index]) {
      if (!allowIconFallback && isIcon(candidate) && !isIcon(byId.get(oldId)!)) continue;
      const club = candidate.teamName || "Unknown";
      const count = clubs.get(club) || 0;
      if (used.has(candidate.id) || count >= clubLimit(club) || spent + candidate.price > 3000) continue;
      used.add(candidate.id); clubs.set(club, count + 1); spent += candidate.price;
      pick.playerId = candidate.id; pick.purchasePrice = candidate.price;
      if (choose(index + 1, allowIconFallback)) return true;
      used.delete(candidate.id); clubs.set(club, count); spent -= candidate.price;
      pick.playerId = oldId; pick.purchasePrice = oldPrice;
    }
    return false;
  }
  // Exhaust regular-player combinations first, then allow same-position Icons.
  if (departing.length && !choose(0, false) && !choose(0, true)) return null;
  const replacements = next.flatMap((p, i) => p.playerId === picks[i].playerId ? [] : [{ playerOutId: picks[i].playerId, playerInId: p.playerId }]);
  return { picks: next, replacements, bank: 3000 - spent };
}
