"use client";
import { useEffect, useState } from "react";

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const res = await fetch("/api/admin/players");
    const data = await res.json();
    setPlayers(data.players || []);
    if (!res.ok) setMsg(data.error || "Forbidden");
  }
  useEffect(() => { load(); }, []);

  async function save(id: string, teamName: string, position: string) {
    const res = await fetch("/api/admin/players", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, teamName, position })
    });
    setMsg(res.ok ? "Player updated" : "Update failed");
    load();
  }

  return (
    <section className="rounded-2xl border border-blue-500/20 bg-black p-4">
      <h1 className="mb-3 text-xl font-semibold text-blue-300">Edit players</h1>
      <p className="mb-3 text-xs text-blue-400">Change club or position after a real transfer. Current list stays until you save.</p>
      {msg && <p className="mb-3 text-sm text-yellow-300">{msg}</p>}
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name" className="mb-3 w-full rounded bg-white p-2 text-black" />
      <div className="space-y-2">
        {players.filter((p) => (p.firstName + " " + p.lastName).toLowerCase().includes(q.toLowerCase())).map((p) => (
          <form key={p.id} onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            save(p.id, String(f.get("teamName")), String(f.get("position")));
          }} className="grid grid-cols-1 gap-2 rounded-xl bg-zinc-950 p-3 text-sm sm:grid-cols-5">
            <p className="sm:col-span-2">{p.firstName} {p.lastName}<span className="block text-xs text-blue-400">{(p.price/10).toFixed(1)}m</span></p>
            <select name="teamName" defaultValue={p.teamName} className="rounded bg-white p-2 text-black">
              {["Marseille","PSG","Lyon","Monaco"].map((t) => <option key={t}>{t}</option>)}
            </select>
            <select name="position" defaultValue={p.position} className="rounded bg-white p-2 text-black">
              {["GK","DEF","MID","FWD"].map((t) => <option key={t}>{t}</option>)}
            </select>
            <button className="rounded bg-blue-600 p-2 text-black">Save</button>
          </form>
        ))}
      </div>
    </section>
  );
}
