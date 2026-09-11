"use client";
import { useEffect, useState } from "react";

type Row = { team: string; played: number; won: number; drawn: number; lost: number; gf: number; ga: number; pts: number };

export default function TablePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    const [t, me] = await Promise.all([fetch("/api/table"), fetch("/api/auth/me")]);
    setRows((await t.json()).table || []);
    const user = (await me.json()).user;
    setIsAdmin(user?.role === "ADMIN" || user?.role === "TEACHER");
  }
  useEffect(() => { load(); }, []);

  function update(i: number, key: keyof Row, value: string) {
    setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, [key]: Number(value) } : r));
  }

  async function save() {
    const res = await fetch("/api/table", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: rows })
    });
    setMsg(res.ok ? "Table saved" : "Only coordinator can edit");
    if (res.ok) load();
  }

  return (
    <section className="rounded-2xl border border-blue-500/20 bg-black p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-blue-300">Club table</h1>
        {isAdmin && <button onClick={save} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-black">Save table</button>}
      </div>
      {msg && <p className="mb-3 text-sm text-blue-200">{msg}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="text-blue-400">
              <th className="py-2">#</th>
              <th>Team</th>
              <th>P</th>
              <th>W</th>
              <th>D</th>
              <th>L</th>
              <th>GF</th>
              <th>GA</th>
              <th>GD</th>
              <th>Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.team} className="border-t border-blue-900/40">
                <td className="py-2">{i + 1}</td>
                <td className="font-medium">{r.team}</td>
                {isAdmin ? (
                  <>
                    <td><input type="number" value={r.played} onChange={(e) => update(i, "played", e.target.value)} className="w-14 rounded bg-zinc-950 p-1" /></td>
                    <td><input type="number" value={r.won} onChange={(e) => update(i, "won", e.target.value)} className="w-14 rounded bg-zinc-950 p-1" /></td>
                    <td><input type="number" value={r.drawn} onChange={(e) => update(i, "drawn", e.target.value)} className="w-14 rounded bg-zinc-950 p-1" /></td>
                    <td><input type="number" value={r.lost} onChange={(e) => update(i, "lost", e.target.value)} className="w-14 rounded bg-zinc-950 p-1" /></td>
                    <td><input type="number" value={r.gf} onChange={(e) => update(i, "gf", e.target.value)} className="w-14 rounded bg-zinc-950 p-1" /></td>
                    <td><input type="number" value={r.ga} onChange={(e) => update(i, "ga", e.target.value)} className="w-14 rounded bg-zinc-950 p-1" /></td>
                    <td className="font-mono">{r.gf - r.ga}</td>
                    <td><input type="number" value={r.pts} onChange={(e) => update(i, "pts", e.target.value)} className="w-14 rounded bg-zinc-950 p-1" /></td>
                  </>
                ) : (
                  <>
                    <td>{r.played}</td>
                    <td>{r.won}</td>
                    <td>{r.drawn}</td>
                    <td>{r.lost}</td>
                    <td>{r.gf}</td>
                    <td>{r.ga}</td>
                    <td className="font-mono">{r.gf - r.ga}</td>
                    <td className="font-mono">{r.pts}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
