"use client";
import { useEffect, useState } from "react";

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/admin/players").then((r) => r.json()).then((d) => {
      const list = d.players || [];
      setPlayers(list);
      const v: Record<string, string> = {};
      for (const p of list) v[p.id] = String(p.price / 10);
      setValues(v);
    });
  }, []);

  async function savePrice(id: string) {
    const price = Math.round(Number(values[id]) * 10);
    if (Number.isNaN(price)) return;
    const res = await fetch("/api/admin/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, price })
    });
    setMsg(res.ok ? "Saved " + id : "Failed");
  }

  const groups: Record<string, any[]> = {};
  for (const p of players) {
    const g = p.teamName || "Unknown";
    if (!groups[g]) groups[g] = [];
    groups[g].push(p);
  }

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold text-yellow-300">Players — market values</h1>
      <p className="text-sm text-blue-300">Type the millions (100, 150, 200) then tap Save on that row.</p>
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
              {rows.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="w-10 text-blue-400">{p.position}</span>
                  <span className="min-w-[10rem] flex-1 text-white">{p.firstName} {p.lastName}</span>
                  <input
                    value={values[p.id] ?? ""}
                    onChange={(e) => setValues({ ...values, [p.id]: e.target.value })}
                    className="w-20 rounded bg-white p-1 text-black"
                  />
                  <button className="rounded bg-blue-600 px-3 py-1 text-black" onClick={() => savePrice(p.id)}>Save</button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
