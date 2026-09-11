"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
export default function ViewTeamPage() {
  const params = useParams();
  const [team, setTeam] = useState<any>(null);
  useEffect(() => { fetch("/api/team/" + params.id).then((r) => r.json()).then((d) => setTeam(d.team)); }, [params.id]);
  if (!team) return <p>Loading…</p>;
  return (
    <section className="rounded-2xl bg-black p-4">
      <p className="text-xs text-blue-400">View only</p>
      <h1 className="text-3xl font-black">{team.name}</h1>
      <p className="text-blue-300">{team.owner} · {team.overallPoints || 0} pts</p>
      <ul className="mt-4 space-y-1">{(team.picks || []).map((p: any) => <li key={p.id}>{p.slot} {p.player.position} {p.player.lastName} {p.isCaptain ? "(C)" : ""}</li>)}</ul>
    </section>
  );
}
