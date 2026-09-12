"use client";
import { useEffect, useState } from "react";

const TEAMS = ["Marseille", "PSG", "Lyon", "Monaco", "Icons"];
const POS = ["GK", "DEF", "MID", "FWD"];

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  const [values, setValues] = useState<Record<string, { price: string; teamName: string; position: string }>>({});

  useEffect(() => {
    fetch("/api/admin/players").then((r) => r.json()).then((d) => {
      const list = d.players || [];
      setPlayers(list);
      const v: Record<string, { price: string; teamName: string; position: string }> = {};
      for (const p of list) {
        v[p.id] = {
          price: String(p.price / 10),
          teamName: p.teamName || "Icons",
          position: p.position
        };
      }
      setValues(v);
    });
  }, []);

  async function saveRow(id: string) {
    const row = values[id];
    if (!row) return;
    const price = Math.round(Number(row.price) * 10);
    if (Number.isNaN(price)) return;
    const res = await fetch("/api/admin/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, price, teamName: row.teamName, position: row.position })
    });
    setMsg(res.ok ? "Saved" : "Failed");
  }

  const groups: Record<string, any[]> = {};
  for (const p of players) {
    const g = p.teamName || "Icons";
    if (!groups[g]) groups[g] = [];
    groups[g].push(p);
  }

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold text-yellow-300">Players</h1>
      <p className="text-sm text-blue-300">Edit price (millions), team and position, then Save on that row. Icons default to team Icons.</p>
      {msg && <p className="text-sm text-yellow-300">{msg}</p>}
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search team or name" className="w-full rounded bg-white p-3 text-black" />
      {Object.entries(groups).map(([g, list]) => {
        const rows = list.filter((p) =>
          !q ||
          g.toLowerCase().includes(q.toLowerCase()) ||
          (p.firstName + " " + p.lastName).toLowerCase().includes(q.toLowerCase())
        );
        if (!rows.length) return null;
        return (
          <div key={g} className="rounded-2xl bg-black p-4">
            <h2 className="mb-2 font-semibold text-blue-300">{g}</h2>
            <ul className="space-y-2">
              {rows.map((p) => {
                const v = values[p.id] || { price: "", teamName: "Icons", position: p.position };
                return (
                  <li key={p.id} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="min-w-[10rem] flex-1 text-white">{p.firstName} {p.lastName}</span>
                    <input
                      value={v.price}
                      onChange={(e) => setValues({ ...values, [p.id]: { ...v, price: e.target.value } })}
                      className="w-20 rounded bg-white p-1 text-black"
                    />
                    <select
                      value={v.teamName}
                      onChange={(e) => setValues({ ...values, [p.id]: { ...v, teamName: e.target.value } })}
                      className="rounded bg-white p-1 text-black"
                    >
                      {TEAMS.map((t) => <option key={t}>{t}</option>)}
                    </select>
                    <select
                      value={v.position}
                      onChange={(e) => setValues({ ...values, [p.id]: { ...v, position: e.target.value } })}
                      className="rounded bg-white p-1 text-black"
                    >
                      {POS.map((t) => <option key={t}>{t}</option>)}
                    </select>
                    <button className="rounded bg-blue-600 px-3 py-1 text-black" onClick={() => saveRow(p.id)}>Save</button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
