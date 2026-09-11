"use client";
import { useEffect, useState } from "react";

type P = { id: string; firstName: string; lastName: string; position: string; teamName: string | null };

export default function AdminAwardsPage() {
  const [players, setPlayers] = useState<P[]>([]);
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [potw, setPotw] = useState<P | null>(null);
  const [pots, setPots] = useState<P | null>(null);
  const [totw, setTotw] = useState<P[]>([]);
  const [tots, setTots] = useState<P[]>([]);
  const [potm, setPotm] = useState<Record<string, P | null>>({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/players").then((r) => r.json()).then((d) => setPlayers(d.players || []));
    fetch("/api/fixtures").then((r) => r.json()).then((d) => setFixtures(d.fixtures || d || []));
  }, []);

  const listed = players.filter((p) => (p.firstName + " " + p.lastName).toLowerCase().includes(q.toLowerCase()));

  async function save(body: any) {
    const res = await fetch("/api/awards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setMsg(res.ok ? "Saved" : (data.error || "Failed"));
  }

  function fixtureLabel(f: any, i: number) {
    return f.home && f.away ? f.home + " vs " + f.away : String(f.title || f.name || "Fixture " + (i + 1));
  }

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold text-yellow-300">Awards admin</h1>
      <p className="text-sm text-blue-300">Search, tap a player, then tap the save button for that award only.</p>
      {msg && <p className="text-sm text-yellow-300">{msg}</p>}
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search player" className="w-full rounded bg-white p-3 text-black" />
      <ul className="max-h-40 overflow-y-auto rounded-xl bg-blue-950 p-2 text-sm">
        {listed.slice(0, 20).map((p) => (
          <li key={p.id}>
            <button className="w-full py-2 text-left" onClick={() => {
              if (totw.length < 9) setTotw([...totw, p]);
            }}>{p.position} {p.lastName} · {p.teamName}</button>
          </li>
        ))}
      </ul>

      <div className="rounded-2xl bg-black p-4">
        <h2 className="mb-2 text-yellow-300">Player of the week</h2>
        <p className="mb-2">{potw ? potw.firstName + " " + potw.lastName : "Tap a player below"}</p>
        <div className="mb-2 flex flex-wrap gap-2">{listed.slice(0, 12).map((p) => <button key={p.id} onClick={() => setPotw(p)} className="rounded bg-blue-900 px-2 py-1 text-xs">{p.lastName}</button>)}</div>
        <button onClick={() => potw && save({ kind: "POTW", playerName: potw.firstName + " " + potw.lastName, teamName: potw.teamName, label: "" })} className="rounded bg-blue-600 px-4 py-2 text-black">Save player of the week</button>
      </div>

      <div className="rounded-2xl bg-black p-4">
        <h2 className="mb-2 text-yellow-300">Player of the season</h2>
        <p className="mb-2">{pots ? pots.firstName + " " + pots.lastName : "Tap a player below"}</p>
        <div className="mb-2 flex flex-wrap gap-2">{listed.slice(0, 12).map((p) => <button key={"s"+p.id} onClick={() => setPots(p)} className="rounded bg-blue-900 px-2 py-1 text-xs">{p.lastName}</button>)}</div>
        <button onClick={() => pots && save({ kind: "POTS", playerName: pots.firstName + " " + pots.lastName, teamName: pots.teamName, label: "" })} className="rounded bg-blue-600 px-4 py-2 text-black">Save player of the season</button>
      </div>

      <div className="rounded-2xl bg-black p-4">
        <h2 className="mb-2 text-yellow-300">Player of the match (every fixture)</h2>
        {fixtures.map((f, i) => {
          const key = fixtureLabel(f, i);
          const chosen = potm[key];
          return (
            <div key={key} className="mb-3 border-t border-blue-900 pt-3">
              <p className="text-sm text-blue-200">{key}</p>
              <p className="text-xs">{chosen ? chosen.firstName + " " + chosen.lastName : "Choose player"}</p>
              <div className="mb-2 flex flex-wrap gap-2">{listed.slice(0, 8).map((p) => <button key={key+p.id} onClick={() => setPotm({ ...potm, [key]: p })} className="rounded bg-blue-900 px-2 py-1 text-xs">{p.lastName}</button>)}</div>
              <button onClick={() => chosen && save({ kind: "POTM", playerName: chosen.firstName + " " + chosen.lastName, teamName: chosen.teamName, fixtureKey: key, label: "" })} className="rounded bg-blue-600 px-3 py-1 text-sm text-black">Save this match award</button>
            </div>
          );
        })}
        {!fixtures.length && <p className="text-sm text-blue-400">Add fixtures first in Fixtures / Admin.</p>}
      </div>

      <div className="rounded-2xl bg-black p-4">
        <h2 className="mb-2 text-yellow-300">Team of the week</h2>
        <ol className="mb-2 list-decimal pl-5 text-sm">{totw.map((p, i) => <li key={i}>{p.position} {p.lastName}</li>)}</ol>
        <div className="mb-2 flex gap-2">
          <button onClick={() => setTotw([])} className="rounded bg-blue-950 px-3 py-1 text-sm">Clear TOTW</button>
          <button onClick={() => save({ kind: "TOTW", players: totw.map((p) => p.position + " " + p.lastName).join("\n") })} className="rounded bg-yellow-300 px-4 py-2 text-black">Save TOTW</button>
        </div>
        <p className="text-xs text-blue-400">Tap names in the search list at the top to fill TOTW (max 9). TOTS is separate.</p>
      </div>

      <div className="rounded-2xl bg-black p-4">
        <h2 className="mb-2 text-yellow-300">Team of the season</h2>
        <ol className="mb-2 list-decimal pl-5 text-sm">{tots.map((p, i) => <li key={i}>{p.position} {p.lastName}</li>)}</ol>
        <div className="flex flex-wrap gap-2">{listed.slice(0, 15).map((p) => <button key={"tots"+p.id} onClick={() => tots.length < 9 && setTots([...tots, p])} className="rounded bg-blue-900 px-2 py-1 text-xs">{p.lastName}</button>)}</div>
        <div className="mt-2 flex gap-2">
          <button onClick={() => setTots([])} className="rounded bg-blue-950 px-3 py-1 text-sm">Clear TOTS</button>
          <button onClick={() => save({ kind: "TOTS", players: tots.map((p) => p.position + " " + p.lastName).join("\n") })} className="rounded bg-yellow-300 px-4 py-2 text-black">Save TOTS</button>
        </div>
      </div>
    </section>
  );
}
