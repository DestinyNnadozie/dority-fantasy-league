"use client";
import { useEffect, useState } from "react";

function List({ title, rows, kind }: { title: string; rows: any[]; kind: "pct" | "pts" }) {
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
            <span className="shrink-0 font-black text-yellow-300">
              {kind === "pct" ? (p.percent ?? p.pct ?? 0) + "%" : (p.n ?? p.points ?? 0) + " pts"}
            </span>
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
  const [seasonPts, setSeasonPts] = useState<any[]>([]);
  const [gwPts, setGwPts] = useState<any[]>([]);
  const [gwName, setGwName] = useState("this GW");

  useEffect(() => {
    fetch("/api/popular").then((r) => r.json()).then((d) => {
      setSelected((d.selected || d.players || []).slice(0, 10));
      setCaptains((d.captains || d.captained || []).slice(0, 10));
      setSeasonPts(d.seasonPts || []);
      setGwPts(d.gwPts || []);
      if (d.gwName) setGwName(d.gwName);
    });
  }, []);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <List title="Most selected" rows={selected} kind="pct" />
      <List title="Most captained" rows={captains} kind="pct" />
      <List title="Most points (no Icons)" rows={seasonPts} kind="pts" />
      <List title={"Most points " + gwName + " (no Icons)"} rows={gwPts} kind="pts" />
    </div>
  );
}