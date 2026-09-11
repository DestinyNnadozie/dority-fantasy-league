"use client";
import { useEffect, useState } from "react";
export default function AwardsPage() {
  const [awards, setAwards] = useState<any[]>([]);
  useEffect(() => { fetch("/api/awards").then((r) => r.json()).then((d) => setAwards(d.awards || [])); }, []);
  const box = (title: string, kind: string) => (
    <div className="rounded-2xl border border-blue-500/20 bg-black p-4">
      <h2 className="mb-2 font-semibold text-yellow-300">{title}</h2>
      {awards.filter((a) => a.kind === kind).map((a) => <p key={a.id}>{a.playerName} {a.teamName} {a.fixtureKey}</p>)}
    </div>
  );
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-blue-300">Awards</h1>
      {box("Player of the week", "POTW")}
      {box("Player of the match", "POTM")}
      {box("Team of the week", "TOTW")}
      {box("Team of the season", "TOTS")}
    </section>
  );
}
