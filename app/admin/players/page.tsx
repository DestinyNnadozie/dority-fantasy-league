"use client";
import { useEffect, useState } from "react";

const TEAMS = ["Marseille", "PSG", "Lyon", "Monaco", "Icons"];
const POS = ["GK", "DEF", "MID", "FWD"];

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
  async function deletePlayer(player: any) {
    const name = `${player.firstName} ${player.lastName}`;
    if (!window.confirm(`Delete ${name} from the active player list?\n\nTheir past squads and points will be preserved. They will be replaced automatically next gameweek by an eligible player of the same position, within budget and club limits.`)) return;
    setDeletingId(player.id);
    try {
      const res = await fetch("/api/admin/players", {
        method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: player.id })
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error || "Could not remove player"); return; }
      setPlayers((current) => current.filter((p) => p.id !== player.id));
      setMsg(`${name} removed. Past points preserved; automatic replacement starts next gameweek.`);
    } catch { setMsg("Could not remove player. Please try again."); }
    finally { setDeletingId(null); }
  }
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
      <form
        className="grid gap-2 rounded-2xl bg-black p-4 sm:grid-cols-5"
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const res = await fetch("/api/admin/players", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              firstName: fd.get("firstName"),
              lastName: fd.get("lastName"),
              position: fd.get("position"),
              teamName: fd.get("teamName"),
              priceDisplay: fd.get("price")
            })
          });
          setMsg(res.ok ? "Player added" : "Failed");
          if (res.ok) window.location.reload();
        }}
      >
        <input name="firstName" placeholder="First name" className="rounded bg-white p-2 text-black" required />
        <input name="lastName" placeholder="Last name" className="rounded bg-white p-2 text-black" required />
        <select name="position" className="rounded bg-white p-2 text-black">
          {POS.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select name="teamName" className="rounded bg-white p-2 text-black">
          {TEAMS.map((t) => <option key={t}>{t}</option>)}
        </select>
        <input name="price" type="number" step="0.1" defaultValue="5" className="rounded bg-white p-2 text-black" />
        <button className="rounded bg-yellow-300 px-3 py-2 text-black sm:col-span-5">Add player</button>
      </form>
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
                    <button disabled={deletingId === p.id} className="rounded bg-blue-600 px-3 py-1 text-black" onClick={() => saveRow(p.id)}>Save</button>
                    <button type="button" disabled={deletingId !== null} onClick={() => deletePlayer(p)} aria-label={`Delete player ${p.firstName} ${p.lastName}`} className="min-h-12 rounded-lg border border-red-400/50 bg-red-950 px-3 py-2 font-semibold text-red-200 hover:bg-red-900 disabled:opacity-50">
                      {deletingId === p.id ? "Removing…" : "Delete player"}
                    </button>
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
