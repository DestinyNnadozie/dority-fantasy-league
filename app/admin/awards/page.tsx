"use client";
import { useEffect, useState } from "react";

export default function AdminAwardsPage() {
  const [msg, setMsg] = useState("");
  const [potw, setPotw] = useState({ name: "", team: "Marseille", photo: "" });
  const [pots, setPots] = useState({ name: "", team: "Marseille", photo: "" });
  const [potm, setPotm] = useState({ name: "", fixture: "", photo: "" });
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [totw, setTotw] = useState("");
  const [tots, setTots] = useState("");

  useEffect(() => { fetch("/api/fixtures").then((r) => r.json()).then((d) => setFixtures(d.fixtures || d || [])); }, []);

  async function save(body: any) {
    const res = await fetch("/api/awards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setMsg(res.ok ? "Saved" : "Failed — check you are logged in as coordinator");
  }

  const teams = ["Marseille","PSG","Lyon","Monaco"];

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold text-yellow-300">Awards admin</h1>
      {msg && <p className="text-sm text-yellow-300">{msg}</p>}

      <div className="rounded-2xl bg-black p-4">
        <h2 className="mb-2">Player of the week</h2>
        <input value={potw.name} onChange={(e) => setPotw({ ...potw, name: e.target.value })} placeholder="Name" className="mb-2 w-full rounded bg-white p-2 text-black" />
        <select value={potw.team} onChange={(e) => setPotw({ ...potw, team: e.target.value })} className="mb-2 w-full rounded bg-white p-2 text-black">{teams.map((t) => <option key={t}>{t}</option>)}</select>
        <input value={potw.photo} onChange={(e) => setPotw({ ...potw, photo: e.target.value })} placeholder="Photo URL (optional)" className="mb-2 w-full rounded bg-white p-2 text-black" />
        <button onClick={() => save({ kind: "POTW", playerName: potw.name, teamName: potw.team, label: potw.photo })} className="rounded bg-blue-600 px-4 py-2 text-black">Save player of the week</button>
      </div>

      <div className="rounded-2xl bg-black p-4">
        <h2 className="mb-2">Player of the season</h2>
        <input value={pots.name} onChange={(e) => setPots({ ...pots, name: e.target.value })} placeholder="Name" className="mb-2 w-full rounded bg-white p-2 text-black" />
        <select value={pots.team} onChange={(e) => setPots({ ...pots, team: e.target.value })} className="mb-2 w-full rounded bg-white p-2 text-black">{teams.map((t) => <option key={t}>{t}</option>)}</select>
        <input value={pots.photo} onChange={(e) => setPots({ ...pots, photo: e.target.value })} placeholder="Photo URL (optional)" className="mb-2 w-full rounded bg-white p-2 text-black" />
        <button onClick={() => save({ kind: "POTS", playerName: pots.name, teamName: pots.team, label: pots.photo })} className="rounded bg-blue-600 px-4 py-2 text-black">Save player of the season</button>
      </div>

      <div className="rounded-2xl bg-black p-4">
        <h2 className="mb-2">Player of the match</h2>
        <select value={potm.fixture} onChange={(e) => setPotm({ ...potm, fixture: e.target.value })} className="mb-2 w-full rounded bg-white p-2 text-black">
          <option value="">Choose fixture</option>
          {fixtures.map((f: any, i: number) => {
            const label = f.home && f.away ? f.home + " vs " + f.away : String(f.title || f.name || i);
            return <option key={i} value={label}>{label}</option>;
          })}
        </select>
        <input value={potm.name} onChange={(e) => setPotm({ ...potm, name: e.target.value })} placeholder="Name" className="mb-2 w-full rounded bg-white p-2 text-black" />
        <input value={potm.photo} onChange={(e) => setPotm({ ...potm, photo: e.target.value })} placeholder="Photo URL (optional)" className="mb-2 w-full rounded bg-white p-2 text-black" />
        <button onClick={() => save({ kind: "POTM", playerName: potm.name, fixtureKey: potm.fixture, label: potm.photo })} className="rounded bg-blue-600 px-4 py-2 text-black">Save player of the match</button>
      </div>

      <div className="rounded-2xl bg-black p-4">
        <h2 className="mb-2">Team of the week pitch (9 names, one per line: GK then DEFs, MIDs, FWDs)</h2>
        <textarea value={totw} onChange={(e) => setTotw(e.target.value)} className="mb-2 h-40 w-full rounded bg-white p-2 text-black" />
        <button onClick={() => save({ kind: "TOTW", players: totw })} className="rounded bg-yellow-300 px-4 py-2 text-black">Save TOTW</button>
      </div>

      <div className="rounded-2xl bg-black p-4">
        <h2 className="mb-2">Team of the season pitch (9 names, one per line)</h2>
        <textarea value={tots} onChange={(e) => setTots(e.target.value)} className="mb-2 h-40 w-full rounded bg-white p-2 text-black" />
        <button onClick={() => save({ kind: "TOTS", players: tots })} className="rounded bg-yellow-300 px-4 py-2 text-black">Save TOTS</button>
      </div>
    </section>
  );
}
