"use client";
import { useEffect, useState } from "react";
export default function PredictionsPage() {
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [mine, setMine] = useState<Record<string, string>>({});
  const [pct, setPct] = useState<Record<string, any>>({});
  const [msg, setMsg] = useState("");
  function keyOf(f: any, i: number) {
    return f.home && f.away ? f.home + " vs " + f.away + " " + (f.kickoff || f.date || i) : String(f.title || f.name || i);
  }
  async function load() {
    const [f, p] = await Promise.all([fetch("/api/fixtures"), fetch("/api/predictions")]);
    const fd = await f.json();
    const pd = await p.json();
    setFixtures(fd.fixtures || fd || []);
    setMine(pd.mine || {});
    setPct(pd.pct || {});
  }
  useEffect(() => { load(); }, []);
  async function vote(fixtureKey: string, choice: string) {
    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fixtureKey, choice })
    });
    const d = await res.json();
    if (!res.ok) { setMsg(d.error || "Login first"); return; }
    setMsg("Vote saved");
    load();
  }
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-blue-300">Predictions</h1>
      <p className="text-sm text-blue-400">Pick Home, Draw or Away. Percentages are from all votes.</p>
      {msg && <p className="text-sm text-yellow-300">{msg}</p>}
      {fixtures.map((f, i) => {
        const key = keyOf(f, i);
        const p = pct[key] || { HOME: 0, DRAW: 0, AWAY: 0, n: 0 };
        const home = f.home || "Home";
        const away = f.away || "Away";
        return (
          <div key={key} className="rounded-2xl border border-blue-500/20 bg-black p-4">
            <p className="font-semibold text-white">{home} vs {away}</p>
            <p className="text-xs text-blue-400">{f.kickoff || f.date || ""} · {p.n} votes</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button onClick={() => vote(key, "HOME")} className={"rounded-xl p-3 text-sm " + (mine[key] === "HOME" ? "bg-blue-600 text-black" : "bg-blue-950")}>{home}<div className="text-lg font-black text-yellow-300">{p.HOME}%</div></button>
              <button onClick={() => vote(key, "DRAW")} className={"rounded-xl p-3 text-sm " + (mine[key] === "DRAW" ? "bg-blue-600 text-black" : "bg-blue-950")}>Draw<div className="text-lg font-black text-yellow-300">{p.DRAW}%</div></button>
              <button onClick={() => vote(key, "AWAY")} className={"rounded-xl p-3 text-sm " + (mine[key] === "AWAY" ? "bg-blue-600 text-black" : "bg-blue-950")}>{away}<div className="text-lg font-black text-yellow-300">{p.AWAY}%</div></button>
            </div>
          </div>
        );
      })}
      {!fixtures.length && <p className="text-blue-400">No fixtures yet.</p>}
    </section>
  );
}
