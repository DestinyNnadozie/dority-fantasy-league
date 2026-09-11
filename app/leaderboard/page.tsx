"use client";
import { useEffect, useState } from "react";
export default function LeaderboardPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { fetch("/api/leaderboard").then((r) => r.json()).then((d) => setRows(d.standings || [])); }, []);
  return (
    <section className="rounded-2xl border border-blue-500/20 bg-black p-6">
      <h1 className="mb-4 text-xl font-semibold text-blue-300">Dority Fantasy League table</h1>
      <table className="w-full text-left text-sm">
        <thead><tr className="text-blue-400"><th className="py-2">#</th><th>Team</th><th>Manager</th><th className="text-right">Pts</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.rank} className="border-t border-blue-900/40">
              <td className="py-2">{r.rank}</td><td>{r.teamName}</td><td>{r.manager}</td><td className="text-right font-mono">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
