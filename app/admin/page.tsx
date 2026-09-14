"use client";
import { useEffect, useState } from "react";

type Player = { id: string; firstName: string; lastName: string; position: string; teamName: string | null };
type GW = { id: number; name: string; deadline: string; status: string };

const TEAM_ORDER = ["Marseille", "PSG", "Lyon", "Monaco", "Icons"];

export default function AdminPage() {
  const [allowed, setAllowed] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameweeks, setGameweeks] = useState<GW[]>([]);
  const [openGw, setOpenGw] = useState<GW | null>(null);
  const [playerId, setPlayerId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("20:00");
  const [status, setStatus] = useState("OPEN");
  const [msg, setMsg] = useState("");

  async function load() {
    const me = await (await fetch("/api/auth/me")).json();
    const ok = me.user?.role === "ADMIN" || me.user?.role === "TEACHER";
    setAllowed(ok);
    if (!ok) return;
    const [p, g] = await Promise.all([fetch("/api/players"), fetch("/api/admin/gameweeks")]);
    const pd = await p.json();
    const gd = await g.json();
    setPlayers(pd.players || []);
    if (!playerId) setPlayerId(pd.players?.[0]?.id || "");
    const list: GW[] = gd.gameweeks || [];
    setGameweeks(list);
    const open = list.find((x) => x.status === "OPEN") || list[list.length - 1] || null;
    setOpenGw(open);
    if (open) {
      setStatus(open.status === "LOCKED" ? "LOCKED" : "OPEN");
      const dt = new Date(open.deadline);
      setDate(dt.toISOString().slice(0, 10));
      setTime(String(dt.getHours()).padStart(2, "0") + ":" + String(dt.getMinutes()).padStart(2, "0"));
    }
  }

  useEffect(() => { load(); }, []);

  const selected = players.find((p) => p.id === playerId);
  const isGK = selected?.position === "GK";
  const gwId = openGw?.id || 1;
  const box = "min-h-12 w-full rounded-xl bg-white p-3 text-base text-black";
  const btn = "min-h-12 w-full rounded-xl bg-blue-600 px-4 text-base font-medium text-black";

  const groups: Record<string, Player[]> = {};
  for (const p of players) {
    const g = p.teamName || "Other";
    if (!groups[g]) groups[g] = [];
    groups[g].push(p);
  }
  const groupNames = [
    ...TEAM_ORDER.filter((t) => groups[t]?.length),
    ...Object.keys(groups).filter((t) => TEAM_ORDER.indexOf(t) === -1)
  ];

  async function saveDeadline(e: React.FormEvent) {
    e.preventDefault();
    if (!openGw) return;
    const res = await fetch("/api/admin/gameweeks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: openGw.id, name: openGw.name, deadline: date + "T" + time + ":00", status })
    });
    setMsg(res.ok ? "Deadline saved" : "Save failed");
    load();
  }

  async function createNext() {
    const res = await fetch("/api/admin/gameweeks/next", { method: "POST" });
    const data = await res.json();
    setMsg(res.ok ? "Created " + data.gameweek.name : data.error || "Failed");
    load();
  }

  async function saveStats(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/stats", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId, gameweekId: gwId,
        minutes: Number(f.get("minutes") || 0),
        goals: Number(f.get("goals") || 0),
        assists: Number(f.get("assists") || 0),
        yellowCards: Number(f.get("yellowCards") || 0),
        redCards: Number(f.get("redCards") || 0),
        cleanSheet: isGK && f.get("cs") === "on",
        saves: Number(f.get("saves") || 0)
      })
    });
    setMsg(res.ok ? "Stats saved" : "Failed to save stats");
  }

  async function calc() {
    const res = await fetch("/api/admin/gameweeks/" + gwId + "/calculate", { method: "POST" });
    setMsg(res.ok ? "Points calculated" : "Calculate failed");
  }

  if (!allowed) {
    return <p className="text-blue-200">Admin is only for the sports coordinator. Login with the coordinator account.</p>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-10">
      {msg && <p className="rounded-xl bg-yellow-400 px-3 py-2 text-sm text-black">{msg}</p>}

      <section className="space-y-3 rounded-2xl border border-blue-500/20 bg-black p-4">
        <p className="text-sm text-blue-300">Open gameweek</p>
        <p className="text-2xl font-bold text-white">{openGw?.name || "None"}</p>
        <button type="button" onClick={createNext} className={btn}>Create next GW (after fixture scores)</button>
        <p className="text-xs text-blue-400">{gameweeks.map((g) => g.name + " " + g.status).join(" · ")}</p>
      </section>

      <form onSubmit={saveDeadline} className="space-y-3 rounded-2xl border border-blue-500/20 bg-black p-4">
        <h2 className="text-lg font-semibold text-blue-300">Deadline</h2>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={box} />
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={box} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={box}>
          <option value="OPEN">OPEN — transfers on</option>
          <option value="LOCKED">LOCKED — transfers off</option>
        </select>
        <button className={btn}>Save deadline</button>
      </form>

      <form onSubmit={saveStats} className="space-y-3 rounded-2xl border border-blue-500/20 bg-black p-4">
        <h2 className="text-lg font-semibold text-blue-300">Match stats</h2>
        <select value={playerId} onChange={(e) => setPlayerId(e.target.value)} className={box}>
          {groupNames.map((team) => (
            <optgroup key={team} label={team}>
              {groups[team].map((p) => (
                <option key={p.id} value={p.id}>{p.position} {p.firstName} {p.lastName}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <input name="minutes" type="number" inputMode="numeric" placeholder="Minutes" className={box} />
        <input name="goals" type="number" inputMode="numeric" placeholder="Goals" className={box} />
        <input name="assists" type="number" inputMode="numeric" placeholder="Assists" className={box} />
        <input name="yellowCards" type="number" inputMode="numeric" placeholder="Yellow cards" className={box} />
        <input name="redCards" type="number" inputMode="numeric" placeholder="Red cards" className={box} />
        {isGK && (
          <>
            <input name="saves" type="number" inputMode="numeric" placeholder="Saves" className={box} />
            <label className="flex min-h-12 items-center gap-3 text-white"><input name="cs" type="checkbox" className="h-5 w-5" /> Clean sheet</label>
          </>
        )}
        <button className={btn}>Save stats</button>
        <button type="button" onClick={calc} className="min-h-12 w-full rounded-xl border border-blue-400 px-4 text-base">Calculate points</button>
      </form>

      <section className="grid grid-cols-2 gap-3">
        <a href="/fixtures" className="rounded-xl bg-blue-950 p-4 text-center text-sm">Fixtures</a>
        <a href="/table" className="rounded-xl bg-blue-950 p-4 text-center text-sm">Club table</a>
        <a href="/news" className="rounded-xl bg-blue-950 p-4 text-center text-sm">News</a>
        <a href="/awards" className="rounded-xl bg-blue-950 p-4 text-center text-sm">Awards</a>
      </section>
    </div>
  );
}