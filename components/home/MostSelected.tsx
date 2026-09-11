"use client";
import { useEffect, useState } from "react";

export function MostSelected() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/popular").then((r) => r.json()).then((d) => setRows(d.players || []));
  }, []);
  return (
    <section className="rounded-2xl border border-blue-500/20 bg-black p-4">
      <h2 className="mb-1 text-xl font-bold text-blue-300">Most selected</h2>
      <p className="mb-3 text-xs text-blue-400">Players picked in the most Dority fantasy squads</p>
      <ol className="space-y-2">
        {rows.map((p, i) => (
          <li key={p.id} className="flex items-center justify-between rounded-xl bg-blue-950 px-3 py-2 text-sm">
            <span className="min-w-0">
              <span className="mr-2 font-mono text-blue-400">{i + 1}</span>
              <span className="font-semibold text-white">{p.name}</span>
              <span className="ml-2 text-xs text-blue-400">{p.position} · {p.teamName}</span>
            </span>
            <span className="shrink-0 font-black text-yellow-300">{p.percent}%</span>
          </li>
        ))}
        {!rows.length && <p className="text-sm text-blue-400">No squads saved yet.</p>}
      </ol>
    </section>
  );
}
