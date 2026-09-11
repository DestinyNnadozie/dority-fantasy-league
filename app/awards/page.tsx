"use client";
import { useEffect, useState } from "react";

type Pos = "GK"|"DEF"|"MID"|"FWD";
type P = { id: string; firstName: string; lastName: string; position: Pos; teamName: string | null };

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

function AwardPitch({ title, players }: { title: string; players: P[] }) {
  const rows: Pos[][] = [["GK"],["DEF","DEF","DEF"],["MID","MID","MID"],["FWD","FWD"]];
  const used = new Set<string>();
  function take(pos: Pos) {
    const p = players.find((x) => x.position === pos && !used.has(x.id));
    if (p) used.add(p.id);
    return p;
  }
  return (
    <section>
      <h2 className="mb-3 text-lg text-blue-300">{title}</h2>
      <div className="relative min-h-[560px] overflow-hidden rounded-2xl border-4 border-white/80 bg-[#15803d] p-5">
        <Markings />
        <div className="relative z-10 flex min-h-[520px] flex-col justify-between py-2">
          {rows.map((row, i) => (
            <div key={i} className="flex justify-center gap-3">
              {row.map((pos, j) => {
                const player = take(pos);
                return (
                  <div key={pos + j} className="flex h-20 w-16 flex-col items-center justify-center rounded-xl bg-black/35 text-center text-[11px] ring-1 ring-white/40">
                    {player ? (
                      <>
                        <span className="line-clamp-2 font-medium text-white">{player.lastName}</span>
                        <span className="text-green-100">{player.teamName}</span>
                      </>
                    ) : <span className="text-white/70">{pos}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function AwardsPage() {
  const [market, setMarket] = useState<P[]>([]);
  const [totw, setTotw] = useState<string[]>([]);
  const [tots, setTots] = useState<string[]>([]);
  const [gw, setGw] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    Promise.all([fetch("/api/players"), fetch("/api/awards"), fetch("/api/auth/me")]).then(async ([p, a, me]) => {
      setMarket((await p.json()).players || []);
      const awards = (await a.json()).awards;
      setTotw(awards?.totw?.playerIds || []);
      setTots(awards?.tots?.playerIds || []);
      setGw(awards?.totw?.gameweek || 1);
      const user = (await me.json()).user;
      setIsAdmin(user?.role === "ADMIN" || user?.role === "TEACHER");
    });
  }, []);

  const totwPlayers = market.filter((p) => totw.includes(p.id));
  const totsPlayers = market.filter((p) => tots.includes(p.id));

  function toggle(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : list.length >= 9 ? list : [...list, id]);
  }

  async function save() {
    const res = await fetch("/api/awards", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ totw: { gameweek: gw, playerIds: totw }, tots: { playerIds: tots } })
    });
    setMsg(res.ok ? "Awards saved" : "Only coordinator can save");
  }

  function Picker({ label, list, setList }: { label: string; list: string[]; setList: (v: string[]) => void }) {
    return (
      <div className="rounded-2xl border border-blue-500/20 bg-black p-4">
        <p className="mb-2 text-sm text-blue-300">{label} ({list.length}/9)</p>
        <div className="max-h-56 overflow-y-auto text-sm">
          {market.map((p) => (
            <label key={p.id} className="flex items-center gap-2 py-1">
              <input type="checkbox" checked={list.includes(p.id)} onChange={() => toggle(list, setList, p.id)} />
              {p.position} {p.lastName} <span className="text-blue-400">{p.teamName}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-blue-300">Teams of the week & season</h1>
      <div className="grid gap-8 lg:grid-cols-2">
        <AwardPitch title={"Team of the week — GW " + gw} players={totwPlayers} />
        <AwardPitch title="Team of the season" players={totsPlayers} />
      </div>
      {isAdmin && (
        <div className="space-y-4">
          <label className="text-sm text-blue-200">Gameweek
            <input type="number" value={gw} onChange={(e) => setGw(Number(e.target.value))} className="ml-2 w-20 rounded bg-zinc-950 p-1" />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <Picker label="Select TOTW" list={totw} setList={setTotw} />
            <Picker label="Select TOTS" list={tots} setList={setTots} />
          </div>
          <button onClick={save} className="rounded-lg bg-blue-600 px-4 py-2 text-black">Save awards</button>
          {msg && <p className="text-sm text-blue-200">{msg}</p>}
        </div>
      )}
    </div>
  );
}
