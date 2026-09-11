"use client";
import { useEffect, useState } from "react";

function List({ title, rows }: { title: string; rows: any[] }) {
  return (
    <section className="rounded-2xl border border-blue-500/20 bg-black p-4">
      <h2 className="mb-1 text-xl font-bold text-blue-300">{title}</h2>
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
        {!rows.length && <p className="text-sm text-blue-400">No data yet</p>}
      </ol>
    </section>
  );
}

export function MostSelected() {
  const [selected, setSelected] = useState<any[]>([]);
  const [captains, setCaptains] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/popular").then((r) => r.json()).then((d) => {
      setSelected(d.selected || d.players || []);
      setCaptains(d.captains || []);
    });
  }, []);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <List title="Most selected" rows={selected} />
      <List title="Most captained" rows={captains} />
    </div>
  );
}
