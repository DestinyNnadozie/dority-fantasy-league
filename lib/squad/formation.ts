type Position = "GK" | "DEF" | "MID" | "FWD";
type SavedPick = { position: Position; slot: "STARTING" | "BENCH"; pitchKey?: string };
const supported = ["3-3-2", "3-4-1", "4-3-1", "4-2-2", "2-4-2", "3-2-3"];

export function restoreSavedSquad<T extends SavedPick>(saved: T[]) {
  const starting = saved.filter((p) => p.slot === "STARTING");
  const count = (pos: Position) => starting.filter((p) => p.position === pos).length;
  const inferred = `${count("DEF")}-${count("MID")}-${count("FWD")}`;
  const formation = supported.includes(inferred) ? inferred : "3-3-2";
  const rows: Record<Position, number> = { GK: 0, DEF: 1, MID: 2, FWD: 3 };
  const indexes: Record<Position, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  let benchIndex = 0;
  const picks = saved.map((p) => ({ ...p, pitchKey: p.slot === "BENCH"
    ? `BENCH-${benchIndex++}`
    : `${p.position}-${rows[p.position]}-${indexes[p.position]++}` }));
  return { formation, picks };
}

export function pitchOrder(p: SavedPick) {
  const parts = p.pitchKey?.split("-") || [];
  return p.slot === "BENCH" ? 100 + Number(parts[1] || 0) : Number(parts[1] || 0) * 10 + Number(parts[2] || 0);
}
