"use client";
import { useEffect, useState } from "react";

export default function LeaderboardPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/leaderboard").then((r) => r.json()).then((d) => setRows(d.teams || []));
  }, []);
  return (
    <section className="rounded-2xl border border-blue-500/20 bg-black p-4">
      <h1 className="mb-3 text-2xl font-bold text-blue-300">Dority Fantasy League table</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-blue-400">
            <tr><th className="p-2">#</th><th className="p-2">Team</th><th className="p-2">Manager</th><th className="p-2">Pts</th></tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id} className="border-t border-blue-900">
                <td className="p-2 text-blue-400">{i + 1}</td>
                <td className="p-2"><a className="text-white underline" href={"/team/" + row.id}>{row.teamName}</a></td>
                <td className="p-2 text-blue-200">{row.manager}</td>
                <td className="p-2 font-bold text-yellow-300">{row.overallPoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
