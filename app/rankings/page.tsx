"use client";
import { useEffect, useState } from "react";

function Board({ title, rows, field }: { title: string; rows: any[]; field: string }) {
  return (
    <section className="rounded-2xl border border-blue-500/20 bg-black p-4">
      <h2 className="mb-3 text-blue-300">{title}</h2>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-blue-400"><th className="py-1">#</th><th>Player</th><th>Team</th><th className="text-right">Tot</th></tr>
        </thead>
        <tbody>
          {rows.filter((r) => r[field] > 0).map((r, i) => (
            <tr key={r.id} className="border-t border-blue-900/40">
              <td className="py-1">{i + 1}</td>
              <td>{r.name}</td>
              <td className="text-blue-300">{r.team}</td>
              <td className="text-right font-mono">{r[field]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.filter((r) => r[field] > 0).length === 0 && (
        <p className="mt-2 text-xs text-blue-400">No {title.toLowerCase()} recorded yet. Coordinator adds them in Admin.</p>
      )}
    </section>
  );
}

export default function RankingsPage() {
  const [data, setData] = useState<any>({ goals: [], assists: [], yellow: [], red: [], cleanSheets: [] });
  useEffect(() => { fetch("/api/rankings").then((r) => r.json()).then(setData); }, []);
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-blue-300">Player rankings</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Board title="Goals" rows={data.goals} field="goals" />
        <Board title="Assists" rows={data.assists} field="assists" />
        <Board title="Yellow cards" rows={data.yellow} field="yellow" />
        <Board title="Red cards" rows={data.red} field="red" />
        <Board title="Clean sheets" rows={data.cleanSheets} field="cleanSheets" />
      </div>
    </div>
  );
}
