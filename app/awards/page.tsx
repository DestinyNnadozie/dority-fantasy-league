"use client";
import { useEffect, useState } from "react";

type A = { id: string; kind: string; playerName: string; teamName: string; fixtureKey: string; label: string };
const FORMATION = [["GK"],["DEF","DEF","DEF"],["MID","MID","MID"],["FWD","FWD"]];

function Face({ name, src }: { name: string; src?: string }) {
  return (
    <div className="flex items-center gap-3">
      {src ? <img src={src} alt={name} className="h-16 w-16 rounded-full object-cover ring-2 ring-blue-400" /> : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-800 text-xl font-black text-white">{(name || "?").slice(0, 1)}</div>
      )}
      <div>
        <p className="text-lg font-bold text-white">{name}</p>
      </div>
    </div>
  );
}

function Pitch({ names }: { names: string[] }) {
  let i = 0;
  return (
    <div className="relative min-h-[420px] overflow-hidden rounded-2xl border-4 border-white/70 bg-[#15803d] p-4">
      <div className="relative z-10 flex min-h-[380px] flex-col justify-between">
        {FORMATION.map((row, r) => (
          <div key={r} className="flex justify-center gap-3">
            {row.map((pos, c) => {
              const n = names[i++] || "";
              return (
                <div key={pos + c} className="flex h-16 w-16 flex-col items-center justify-center rounded-xl bg-black/40 text-[10px] text-white">
                  <span className="text-yellow-200">{pos}</span>
                  <span className="text-center">{n || "-"}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AwardsPage() {
  const [awards, setAwards] = useState<A[]>([]);
  useEffect(() => { fetch("/api/awards").then((r) => r.json()).then((d) => setAwards(d.awards || [])); }, []);
  const one = (kind: string) => awards.find((a) => a.kind === kind);
  const list = (kind: string) => awards.filter((a) => a.kind === kind).map((a) => a.playerName);
  const potw = one("POTW");
  const pots = one("POTS");
  const potm = awards.filter((a) => a.kind === "POTM");
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-blue-300">Awards</h1>
      <div className="rounded-2xl border border-blue-500/20 bg-black p-4">
        <h2 className="mb-3 text-yellow-300">Player of the week</h2>
        {potw ? <Face name={potw.playerName + (potw.teamName ? " · " + potw.teamName : "")} src={potw.label} /> : <p className="text-sm text-blue-400">Not chosen</p>}
      </div>
      <div className="rounded-2xl border border-blue-500/20 bg-black p-4">
        <h2 className="mb-3 text-yellow-300">Player of the season</h2>
        {pots ? <Face name={pots.playerName + (pots.teamName ? " · " + pots.teamName : "")} src={pots.label} /> : <p className="text-sm text-blue-400">Not chosen</p>}
      </div>
      <div className="rounded-2xl border border-blue-500/20 bg-black p-4">
        <h2 className="mb-3 text-yellow-300">Player of the match</h2>
        {potm.map((a) => (
          <div key={a.id} className="mb-3">
            <p className="text-xs text-blue-400">{a.fixtureKey}</p>
            <Face name={a.playerName} src={a.label} />
          </div>
        ))}
        {!potm.length && <p className="text-sm text-blue-400">Not chosen</p>}
      </div>
      <div className="rounded-2xl border border-blue-500/20 bg-black p-4">
        <h2 className="mb-3 text-yellow-300">Team of the week</h2>
        <Pitch names={list("TOTW")} />
      </div>
      <div className="rounded-2xl border border-blue-500/20 bg-black p-4">
        <h2 className="mb-3 text-yellow-300">Team of the season</h2>
        <Pitch names={list("TOTS")} />
      </div>
    </section>
  );
}
