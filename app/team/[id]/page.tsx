"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Pos = "GK"|"DEF"|"MID"|"FWD";
const FORMATION: Pos[][] = [["GK"],["DEF","DEF","DEF"],["MID","MID","MID"],["FWD","FWD"]];

function isIcon(p?: { teamName?: string | null }) {
  return (p?.teamName || "").toLowerCase() === "icons";
}

function Markings() {
  return (
    <svg viewBox="0 0 100 140" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
      <rect x="3" y="3" width="94" height="134" fill="none" stroke="white" strokeOpacity="0.9" strokeWidth="0.7" />
      <line x1="3" y1="70" x2="97" y2="70" stroke="white" strokeOpacity="0.9" strokeWidth="0.5" />
      <circle cx="50" cy="70" r="10" fill="none" stroke="white" strokeOpacity="0.9" strokeWidth="0.5" />
      <rect x="22" y="3" width="56" height="18" fill="none" stroke="white" strokeOpacity="0.9" strokeWidth="0.5" />
      <rect x="22" y="119" width="56" height="18" fill="none" stroke="white" strokeOpacity="0.9" strokeWidth="0.5" />
    </svg>
  );
}

export default function ViewTeamPage() {
  const params = useParams();
  const [team, setTeam] = useState<any>(null);
  useEffect(() => {
    fetch("/api/team/" + params.id).then((r) => r.json()).then((d) => setTeam(d.team));
  }, [params.id]);
  if (!team) return <p className="text-blue-300">Loading pitch…</p>;
  const start = (team.picks || []).filter((p: any) => p.slot === "STARTING");
  const bench = (team.picks || []).filter((p: any) => p.slot === "BENCH");
  const used = new Set<string>();
  function take(pos: Pos) {
    const row = start.find((p: any) => p.player.position === pos && !used.has(p.id));
    if (row) used.add(row.id);
    return row;
  }
  return (
    <section>
      <p className="text-xs uppercase text-blue-400">Read only</p>
      <h1 className="text-3xl font-black text-white">{team.name}</h1>
      <p className="mb-4 text-sm text-blue-300">{team.owner} · {team.overallPoints || 0} pts</p>
      <div className="relative min-h-[620px] overflow-hidden rounded-2xl border-4 border-white/80 bg-[#15803d] p-6">
        <Markings />
        <div className="relative z-10 flex min-h-[572px] flex-col justify-between py-2">
          {FORMATION.map((row, i) => (
            <div key={i} className="flex justify-center gap-4">
              {row.map((pos, j) => {
                const pick = take(pos);
                const pl = pick?.player;
                return (
                  <div key={pos + j} className={"relative flex h-24 w-20 flex-col items-center justify-center rounded-xl text-[11px] ring-1 " + (isIcon(pl) ? "bg-gradient-to-b from-yellow-600 via-black to-black ring-yellow-500" : "bg-black/35 ring-white/40")}>
                    {pl ? (
                      <>
                        <span className="absolute right-1 top-1 rounded bg-black/70 px-1 text-[10px] font-bold text-yellow-300">{pick.isCaptain ? (pl.gwPoints || 0) * 2 : (pl.gwPoints || 0)}</span>
                        <span className="text-yellow-200">{pl.position}</span>
                        <span className="font-medium text-white">{pl.lastName}</span>
                        {isIcon(pl) && <span className="text-[9px] text-yellow-400">ICON</span>}
                        {pick.isCaptain && <span className="bg-yellow-300 px-1 text-black">C</span>}
                      </>
                    ) : pos}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-xs uppercase text-blue-300">Bench</p>
      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => {
          const pick = bench[i];
          const pl = pick?.player;
          return (
            <div key={i} className={"relative h-16 rounded-xl text-center text-[11px] leading-[4rem] ring-1 " + (isIcon(pl) ? "bg-gradient-to-b from-yellow-600 via-black to-black ring-yellow-500" : "bg-blue-950 ring-blue-500/30")}>
              {pick ? pick.player.position + " " + pick.player.lastName : "BENCH"}
            </div>
          );
        })}
      </div>
    </section>
  );
}