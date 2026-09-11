"use client";
import { useEffect, useState } from "react";
import { RenameTeam } from "@/components/squad/RenameTeam";

type Pos = "GK"|"DEF"|"MID"|"FWD";
type P = { id: string; firstName: string; lastName: string; position: Pos; price: number; teamName: string | null; gwPoints?: number };
type Pick = P & { slot: "STARTING" | "BENCH"; isCaptain: boolean; pitchKey?: string };

const FORMATIONS: Record<string, Pos[][]> = {
  "3-3-2": [["GK"],["DEF","DEF","DEF"],["MID","MID","MID"],["FWD","FWD"]],
  "3-4-1": [["GK"],["DEF","DEF","DEF"],["MID","MID","MID","MID"],["FWD"]],
  "4-3-1": [["GK"],["DEF","DEF","DEF","DEF"],["MID","MID","MID"],["FWD"]],
  "4-2-2": [["GK"],["DEF","DEF","DEF","DEF"],["MID","MID"],["FWD","FWD"]],
  "2-4-2": [["GK"],["DEF","DEF"],["MID","MID","MID","MID"],["FWD","FWD"]],
  "3-2-3": [["GK"],["DEF","DEF","DEF"],["MID","MID"],["FWD","FWD","FWD"]]
};

function remapToFormation(prev: Pick[], formation: string): Pick[] {
  const rows = FORMATIONS[formation];
  const slots: { key: string; pos: Pos }[] = [];
  rows.forEach((row, i) => row.forEach((pos, j) => slots.push({ key: pos + "-" + i + "-" + j, pos })));
  const used = new Set<string>();
  const next: Pick[] = [];
  for (const s of slots) {
    const p = prev.find((x) => x.position === s.pos && !used.has(x.id));
    if (p) { used.add(p.id); next.push({ ...p, slot: "STARTING", pitchKey: s.key }); }
  }
  const benchPos: Record<string, number> = {};
  let b = 0;
  for (const p of prev) {
    if (used.has(p.id) || b >= 6) continue;
    const n = benchPos[p.position] || 0;
    if (n >= 2) continue;
    benchPos[p.position] = n + 1;
    next.push({ ...p, slot: "BENCH", pitchKey: "BENCH-" + b, isCaptain: false });
    used.add(p.id);
    b += 1;
  }
  return next;
}

function Markings() {
  return (
    <svg viewBox="0 0 100 140" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
      <rect x="3" y="3" width="94" height="134" fill="none" stroke="white" strokeOpacity="0.9" strokeWidth="0.7" />
      <line x1="3" y1="70" x2="97" y2="70" stroke="white" strokeOpacity="0.9" strokeWidth="0.5" />
      <circle cx="50" cy="70" r="10" fill="none" stroke="white" strokeOpacity="0.9" strokeWidth="0.5" />
      <circle cx="50" cy="70" r="0.8" fill="white" />
      <rect x="22" y="3" width="56" height="18" fill="none" stroke="white" strokeOpacity="0.9" strokeWidth="0.5" />
      <rect x="36" y="3" width="28" height="8" fill="none" stroke="white" strokeOpacity="0.9" strokeWidth="0.5" />
      <rect x="22" y="119" width="56" height="18" fill="none" stroke="white" strokeOpacity="0.9" strokeWidth="0.5" />
      <rect x="36" y="129" width="28" height="8" fill="none" stroke="white" strokeOpacity="0.9" strokeWidth="0.5" />
    </svg>
  );
}

export default function SquadPage() {
  const [market, setMarket] = useState<P[]>([]);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [formation, setFormation] = useState("3-3-2");
  const [filter, setFilter] = useState<"ALL"|Pos>("ALL");
  const [query, setQuery] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<{ key: string; pos?: Pos; bench?: boolean } | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [swapId, setSwapId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("Your team");
  const [msg, setMsg] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([fetch("/api/players"), fetch("/api/team/picks")]).then(async ([pr, tr]) => {
      const pd = await pr.json();
      const td = await tr.json();
      setMarket(pd.players || []);
      if (td.team?.name) setTeamName(td.team.name);
      const saved = (td.team?.picks || []).map((x: any) => ({
        id: x.player.id,
        firstName: x.player.firstName,
        lastName: x.player.lastName,
        position: x.player.position,
        price: x.player.price,
        teamName: x.player.teamName,
        gwPoints: x.player.gwPoints || 0,
        slot: x.slot,
        isCaptain: x.isCaptain,
        pitchKey: undefined
      }));
      setPicks(remapToFormation(saved, "3-3-2"));
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    setPicks((prev) => prev.length ? remapToFormation(prev, formation) : prev);
  }, [formation, loaded]);

  const rows = FORMATIONS[formation];
  const spent = picks.reduce((s, p) => s + p.price, 0);
  const bank = (3000 - spent) / 10;
  const over = bank < 0;
  const starters = picks.filter((p) => p.slot === "STARTING");
  const bench = picks.filter((p) => p.slot === "BENCH");
  const menuPlayer = picks.find((p) => p.id === menuId);
  const listed = market.filter((p) =>
    !picks.some((x) => x.id === p.id) &&
    (filter === "ALL" || p.position === filter) &&
    (p.firstName + " " + p.lastName).toLowerCase().includes(query.toLowerCase())
  );

  function playerInSlot(key: string) {
    return picks.find((p) => p.pitchKey === key);
  }

  function canAdd(player: P, asBench: boolean) {
    if (picks.some((p) => p.id === player.id)) return false;
    if (spent + player.price > 3000) {
      alert("Budget exceeded. You only have " + bank.toFixed(1) + "m left. This player costs " + (player.price / 10).toFixed(1) + "m.");
      setMsg("Over budget");
      return false;
    }
    if (picks.filter((p) => p.teamName === player.teamName).length >= 4) {
      setMsg("Max 4 players from " + player.teamName); return false;
    }
    if (asBench) {
      const benchNow = picks.filter((p) => p.slot === "BENCH");
      if (benchNow.length >= 6) { setMsg("Bench is full"); return false; }
      if (benchNow.filter((p) => p.position === player.position).length >= 2) {
        setMsg("Max 2 " + player.position + " on the bench"); return false;
      }
    }
    return true;
  }

  function place(player: P, key: string, asBench: boolean, pos?: Pos) {
    if (!asBench && pos && player.position !== pos) { setMsg("That player is not a " + pos); return; }
    if (!picks.some((p) => p.id === player.id) && !canAdd(player, asBench)) return;
    setPicks((prev) => prev.filter((p) => p.id !== player.id && p.pitchKey !== key).concat({
      ...player, slot: asBench ? "BENCH" : "STARTING", pitchKey: key, isCaptain: false
    }));
    setSelectedSlot(null);
    setMsg("");
  }

  function swapPlayers(aId: string, bId: string) {
    const a = picks.find((p) => p.id === aId);
    const b = picks.find((p) => p.id === bId);
    if (!a || !b) return;
    if (a.position !== b.position) { setSwapId(null); setMsg("Only substitute same position"); return; }
    setPicks((prev) => prev.map((p) => {
      if (p.id === aId) return { ...p, slot: b.slot, pitchKey: b.pitchKey, isCaptain: b.slot === "STARTING" ? p.isCaptain : false };
      if (p.id === bId) return { ...p, slot: a.slot, pitchKey: a.pitchKey, isCaptain: a.slot === "STARTING" ? p.isCaptain : false };
      return p;
    }));
    setSwapId(null);
    setMsg("Substituted");
  }

  function tapPlayer(player: Pick) {
    if (swapId && swapId !== player.id) { swapPlayers(swapId, player.id); return; }
    setSelectedSlot(null);
    setMenuId(player.id);
  }

  async function save() {
    if (over) { alert("You are over budget. Remove players before saving."); return; }
    if (picks.filter((p) => p.slot === "STARTING").length !== 9) { setMsg("Need 9 starters"); return; }
    const res = await fetch("/api/team/picks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ picks: picks.map((p, i) => ({ playerId: p.id, slot: p.slot, squadOrder: i + 1, isCaptain: p.isCaptain, isViceCaptain: false })) })
    });
    const data = await res.json();
    setMsg(res.ok ? "Squad saved" : data.error || "Could not save");
    if (!res.ok) alert(data.error || "Could not save");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <section>
        <h1 className="text-3xl font-extrabold text-white">{teamName}</h1>
        <RenameTeam current={teamName} onSaved={setTeamName} />
        <div className={"mt-3 inline-block rounded-2xl border-2 px-5 py-3 " + (over ? "border-red-500 bg-red-950" : "border-blue-400 bg-blue-950")}>
          <p className="text-xs uppercase tracking-wide text-blue-200">Budget remaining</p>
          <p className={"text-3xl font-black " + (over ? "text-red-400" : "text-white")}>{bank.toFixed(1)}m</p>
          <p className="text-xs text-blue-300">300.0m total · {starters.length}/9 start · {bench.length}/6 bench</p>
        </div>
        <div className="mt-3">
          <select value={formation} onChange={(e) => setFormation(e.target.value)} className="rounded bg-black px-2 py-1 text-sm ring-1 ring-blue-500/30">
            {Object.keys(FORMATIONS).map((f) => <option key={f}>{f}</option>)}
          </select>
        </div>
        {msg && <p className="mb-2 mt-2 text-sm text-yellow-300">{msg}</p>}

        {menuPlayer && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={() => setMenuId(null)}>
            <div className="w-full max-w-sm rounded-2xl bg-zinc-900 p-4" onClick={(e) => e.stopPropagation()}>
              <p className="mb-3 text-white">{menuPlayer.position} {menuPlayer.lastName}</p>
              {menuPlayer.slot === "STARTING" && <button type="button" className="mb-2 min-h-12 w-full rounded-xl bg-yellow-300 text-black" onClick={() => { setPicks((prev) => prev.map((p) => ({ ...p, isCaptain: p.id === menuPlayer.id }))); setMenuId(null); }}>Make captain</button>}
              <button type="button" className="mb-2 min-h-12 w-full rounded-xl bg-blue-600 text-black" onClick={() => { setSwapId(menuPlayer.id); setMenuId(null); }}>Substitute</button>
              <button type="button" className="min-h-12 w-full rounded-xl bg-red-600 text-white" onClick={() => { setPicks((prev) => prev.filter((p) => p.id !== menuPlayer.id)); setMenuId(null); }}>Remove player</button>
              <button type="button" className="mt-2 text-sm text-blue-300" onClick={() => setMenuId(null)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="relative mt-4 min-h-[620px] overflow-hidden rounded-2xl border-4 border-white/80 bg-[#15803d] p-6">
          <Markings />
          <div className="relative z-10 flex min-h-[572px] flex-col justify-between py-2">
            {rows.map((row, i) => (
              <div key={i} className="flex justify-center gap-4">
                {row.map((pos, j) => {
                  const key = pos + "-" + i + "-" + j;
                  const player = playerInSlot(key);
                  const active = selectedSlot?.key === key;
                  return (
                    <button key={key} type="button" onClick={() => player ? tapPlayer(player) : setSelectedSlot({ key, pos, bench: false })} className={"relative flex h-24 w-20 flex-col items-center justify-center rounded-xl bg-black/35 text-[11px] ring-1 " + (active ? "ring-2 ring-yellow-300" : "ring-white/40")}>
                      {player ? (
                        <>
                          <span className="absolute right-1 top-1 rounded bg-black/70 px-1 text-[10px] font-bold text-yellow-300">{player.isCaptain ? (player.gwPoints || 0) * 2 : (player.gwPoints || 0)}</span>
                          <span className="text-yellow-200">{player.position}</span>
                          <span className="font-medium text-white">{player.lastName}</span>
                          {player.isCaptain && <span className="bg-yellow-300 px-1 text-black">C</span>}
                        </>
                      ) : pos}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <p className="mt-3 text-xs uppercase text-blue-300">Bench</p>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => {
            const key = "BENCH-" + i;
            const player = playerInSlot(key);
            const active = selectedSlot?.key === key;
            return (
              <button key={key} type="button" onClick={() => player ? tapPlayer(player) : setSelectedSlot({ key, bench: true })} className={"relative h-16 rounded-xl bg-blue-950 text-[11px] ring-1 " + (active ? "ring-2 ring-yellow-300" : "ring-blue-500/30")}>
                {player ? (<><span className="absolute right-1 top-1 text-[10px] text-yellow-300">{player.gwPoints || 0}</span>{player.position} {player.lastName}</>) : "BENCH"}
              </button>
            );
          })}
        </div>
        <button onClick={save} className="mt-4 rounded-full bg-blue-600 px-5 py-2 text-sm text-black">Save squad</button>
      </section>

      <aside className="rounded-2xl border border-blue-500/20 bg-black p-4">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search player name" className="mb-3 w-full rounded-lg bg-white p-3 text-black" />
        <div className="mb-3 flex flex-wrap gap-2">
          {(["ALL","GK","DEF","MID","FWD"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={"rounded-full px-3 py-1 text-xs " + (filter===f ? "bg-blue-600 text-black" : "bg-blue-950 text-blue-200")}>{f}</button>
          ))}
        </div>
        <ul className="max-h-[640px] space-y-1 overflow-y-auto text-sm">
          {listed.map((p) => (
            <li key={p.id}>
              <button onClick={() => selectedSlot ? place(p, selectedSlot.key, !!selectedSlot.bench, selectedSlot.pos) : setMsg("Tap an empty card first")} className="grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-blue-950">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{p.position} {p.lastName}</span>
                  <span className="block truncate text-xs text-blue-400">{p.firstName} · {p.teamName}</span>
                </span>
                <span className="shrink-0 text-right font-mono text-xs leading-5">
                  <span className="block">{(p.price / 10).toFixed(1)}m</span>
                  <span className="block text-yellow-300">{p.gwPoints || 0} pts</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
