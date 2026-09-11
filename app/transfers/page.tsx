"use client";
import { useEffect, useState } from "react";

export default function TransfersPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/team/transfers").then((r) => r.json()).then((d) => setRows(d.transfers || []));
  }, []);
  return (
    <section className="rounded-2xl border border-blue-500/20 bg-black p-6">
      <h1 className="mb-4 text-xl font-semibold text-blue-300">Transfer history</h1>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-blue-400">
            <th className="py-2">When</th>
            <th>GW</th>
            <th>Out</th>
            <th>In</th>
            <th>Hit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id} className="border-t border-blue-900/40">
              <td className="py-2">{new Date(t.createdAt).toLocaleString()}</td>
              <td>{t.gameweekId}</td>
              <td>{t.playerOut}</td>
              <td>{t.playerIn}</td>
              <td>{t.cost ? "-" + t.cost : "Free"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="text-sm text-blue-400">No transfers yet. Change your squad and save.</p>}
    </section>
  );
}
