"use client";
import { useEffect, useState } from "react";
export default function AdminAwardsPage() {
  const [potw, setPotw] = useState("");
  const [potwTeam, setPotwTeam] = useState("Marseille");
  const [potm, setPotm] = useState("");
  const [fixture, setFixture] = useState("");
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [totw, setTotw] = useState("");
  const [tots, setTots] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => { fetch("/api/fixtures").then((r) => r.json()).then((d) => setFixtures(d.fixtures || d || [])); }, []);
  async function save(body: any) {
    const res = await fetch("/api/awards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setMsg(res.ok ? "Saved" : "Failed");
  }
  return (
    <section className="space-y-4">
      <h1 className="text-xl text-yellow-300">Awards admin</h1>
      {msg && <p className="text-yellow-300">{msg}</p>}
      <div className="rounded-2xl bg-black p-4">
        <h2 className="mb-2">Player of the week</h2>
        <input value={potw} onChange={(e) => setPotw(e.target.value)} className="mb-2 w-full rounded bg-white p-2 text-black" />
        <select value={potwTeam} onChange={(e) => setPotwTeam(e.target.value)} className="mb-2 w-full rounded bg-white p-2 text-black">{["Marseille","PSG","Lyon","Monaco"].map((t) => <option key={t}>{t}</option>)}</select>
        <button onClick={() => save({ kind: "POTW", playerName: potw, teamName: potwTeam })} className="rounded bg-blue-600 px-4 py-2 text-black">Save player of the week</button>
      </div>
      <div className="rounded-2xl bg-black p-4">
        <h2 className="mb-2">Player of the match</h2>
        <select value={fixture} onChange={(e) => setFixture(e.target.value)} className="mb-2 w-full rounded bg-white p-2 text-black">
          <option value="">Choose fixture</option>
          {fixtures.map((f: any, i: number) => <option key={i} value={f.home && f.away ? f.home + " vs " + f.away : String(f.title || f.name || i)}>{f.home && f.away ? f.home + " vs " + f.away : String(f.title || f.name || i)}</option>)}
        </select>
        <input value={potm} onChange={(e) => setPotm(e.target.value)} className="mb-2 w-full rounded bg-white p-2 text-black" />
        <button onClick={() => save({ kind: "POTM", playerName: potm, fixtureKey: fixture })} className="rounded bg-blue-600 px-4 py-2 text-black">Save player of the match</button>
      </div>
      <div className="rounded-2xl bg-black p-4">
        <h2 className="mb-2">Team of the week</h2>
        <textarea value={totw} onChange={(e) => setTotw(e.target.value)} className="mb-2 h-32 w-full rounded bg-white p-2 text-black" />
        <button onClick={() => save({ kind: "TOTW", players: totw })} className="rounded bg-yellow-300 px-4 py-2 text-black">Save TOTW</button>
      </div>
      <div className="rounded-2xl bg-black p-4">
        <h2 className="mb-2">Team of the season</h2>
        <textarea value={tots} onChange={(e) => setTots(e.target.value)} className="mb-2 h-32 w-full rounded bg-white p-2 text-black" />
        <button onClick={() => save({ kind: "TOTS", players: tots })} className="rounded bg-yellow-300 px-4 py-2 text-black">Save TOTS</button>
      </div>
    </section>
  );
}
