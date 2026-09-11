"use client";
import { useEffect, useState } from "react";

type P = { id: string; firstName: string; lastName: string; position: string; teamName: string | null };
type A = { id: string; kind: string; playerName: string; teamName: string; fixtureKey: string; label: string };
type Pos = "GK"|"DEF"|"MID"|"FWD";
const FORMATION: Pos[][] = [["GK"],["DEF","DEF","DEF"],["MID","MID","MID"],["FWD","FWD"]];

function Markings() {
  return (
    <svg viewBox="0 0 100 140" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
      <rect x="3" y="3" width="94" height="134" fill="none" stroke="white" strokeOpacity="0.9" strokeWidth="0.7" />
      <line x1="3" y1="70" x2="97" y2="70" stroke="white" strokeOpacity="0.9" strokeWidth="0.5" />
      <circle cx="50" cy="70" r="10" fill="none" stroke="white" strokeOpacity="0.9" strokeWidth="0.5" />
      <circle cx="50" cy="70" r="0.8" fill="white" />
      <rect x="22" y="3" width="56" height="18" fill="none" stroke="white" strokeOpacity="0.9" strokeWidth="0.5" />
      <rect x="36" y="3" width="28" height="8" fill="none" stroke="white" strokeOpacity="0.9" strokeWidth="0.5" />
      <rect x="22" y="119" width="56" height="18" fill="none" stroke="white" strokeOpacity="0.9" strokeWidth="0.5" />
      <rect x="36" y="129" width="28" height="8" fill="none" stroke="white" strokeOpacity="0.9" strokeWidth="0.5" />
    </svg>
  );
}

export default function AwardsPage() {
  const [admin, setAdmin] = useState(false);
  const [awards, setAwards] = useState<A[]>([]);
  const [players, setPlayers] = useState<P[]>([]);
  const [q, setQ] = useState("");
  const [slot, setSlot] = useState<{ board: "TOTW"|"TOTS"; key: string; pos: Pos } | null>(null);
  const [totw, setTotw] = useState<Record<string, P>>({});
  const [tots, setTots] = useState<Record<string, P>>({});
  const [potw, setPotw] = useState<P | null>(null);
  const [pots, setPots] = useState<P | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setAdmin(Boolean(d.user && (d.user.role === "ADMIN" || d.user.role === "TEACHER" || d.user.email === "coordinator@school.local"))));
    fetch("/api/awards").then((r) => r.json()).then((d) => setAwards(d.awards || []));
    fetch("/api/players").then((r) => r.json()).then((d) => setPlayers(d.players || []));
  }, []);

  const listed = players.filter((p) => (p.firstName + " " + p.lastName).toLowerCase().includes(q.toLowerCase()));

  async function save(body: any) {
    const res = await fetch("/api/awards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setMsg(res.ok ? "Saved" : (data.error || "Failed"));
    const a = await fetch("/api/awards").then((r) => r.json());
    setAwards(a.awards || []);
  }

  function boardMap(board: "TOTW"|"TOTS") { return board === "TOTW" ? totw : tots; }
  function setBoard(board: "TOTW"|"TOTS", next: Record<string, P>) { board === "TOTW" ? setTotw(next) : setTots(next); }

  function Pitch({ board, names }: { board: "TOTW"|"TOTS"; names?: string[] }) {
    let n = 0;
    return (
      <div className="relative min-h-[620px] overflow-hidden rounded-2xl border-4 border-white/80 bg-[#15803d] p-6">
        <Markings />
        <div className="relative z-10 flex min-h-[572px] flex-col justify-between py-2">
          {FORMATION.map((row, i) => (
            <div key={i} className="flex justify-center gap-4">
              {row.map((pos, j) => {
                const key = pos + "-" + i + "-" + j;
                const picked = boardMap(board)[key];
                const fallback = names?.[n++] || "";
                return (
                  <button key={key} type="button" onClick={() => admin && setSlot({ board, key, pos })} className={"relative flex h-24 w-20 flex-col items-center justify-center rounded-xl bg-black/35 text-[11px] ring-1 " + (slot?.key === key && slot.board === board ? "ring-2 ring-yellow-300" : "ring-white/40")}>
                    <span className="text-yellow-200">{pos}</span>
                    <span className="text-center font-medium text-white">{picked ? picked.lastName : (fallback || "-")}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const potwA = awards.find((a) => a.kind === "POTW");
  const potsA = awards.find((a) => a.kind === "POTS");
  const potm = awards.filter((a) => a.kind === "POTM");

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-blue-300">Awards</h1>
      {admin && <p className="text-sm text-yellow-300">Coordinator mode: tap a pitch slot or award, then tap a player, then Save that section.</p>}
      {msg && <p className="text-sm text-yellow-300">{msg}</p>}

      <div className="rounded-2xl border border-blue-500/20 bg-black p-4">
        <h2 className="mb-2 text-yellow-300">Player of the week</h2>
        <p className="text-white">{potw ? potw.firstName + " " + potw.lastName : (potwA?.playerName || "Not chosen")}</p>
        {admin && (
          <>
            <div className="mt-2 flex flex-wrap gap-2">{listed.slice(0, 15).map((p) => <button key={p.id} onClick={() => setPotw(p)} className="rounded bg-blue-900 px-2 py-1 text-xs">{p.lastName}</button>)}</div>
            <button onClick={() => potw && save({ kind: "POTW", playerName: potw.firstName + " " + potw.lastName, teamName: potw.teamName, label: "" })} className="mt-2 rounded bg-blue-600 px-4 py-2 text-black">Save player of the week</button>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-blue-500/20 bg-black p-4">
        <h2 className="mb-2 text-yellow-300">Player of the season</h2>
        <p className="text-white">{pots ? pots.firstName + " " + pots.lastName : (potsA?.playerName || "Not chosen")}</p>
        {admin && (
          <>
            <div className="mt-2 flex flex-wrap gap-2">{listed.slice(0, 15).map((p) => <button key={"ps"+p.id} onClick={() => setPots(p)} className="rounded bg-blue-900 px-2 py-1 text-xs">{p.lastName}</button>)}</div>
            <button onClick={() => pots && save({ kind: "POTS", playerName: pots.firstName + " " + pots.lastName, teamName: pots.teamName, label: "" })} className="mt-2 rounded bg-blue-600 px-4 py-2 text-black">Save player of the season</button>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-blue-500/20 bg-black p-4">
        <h2 className="mb-2 text-yellow-300">Player of the match</h2>
        {potm.map((a) => <p key={a.id}>{a.fixtureKey}: {a.playerName}</p>)}
        {!potm.length && <p className="text-sm text-blue-400">Not chosen</p>}
      </div>

      {admin && (
        <div className="rounded-2xl bg-black p-4">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search player to put on the selected slot" className="mb-2 w-full rounded bg-white p-3 text-black" />
          <ul className="max-h-40 overflow-auto">
            {listed.slice(0, 25).map((p) => (
              <li key={p.id}>
                <button className="w-full py-2 text-left text-sm" onClick={() => {
                  if (!slot) { setMsg("Tap a TOTW or TOTS slot first"); return; }
                  if (p.position !== slot.pos) { setMsg("Need a " + slot.pos); return; }
                  setBoard(slot.board, { ...boardMap(slot.board), [slot.key]: p });
                  setSlot(null);
                }}>{p.position} {p.lastName} · {p.teamName}</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-blue-500/20 bg-black p-4">
        <h2 className="mb-3 text-yellow-300">Team of the week</h2>
        <Pitch board="TOTW" names={awards.filter((a) => a.kind === "TOTW").map((a) => a.playerName)} />
        {admin && <button onClick={() => save({ kind: "TOTW", players: Object.values(totw).map((p) => p.position + " " + p.lastName).join("\n") })} className="mt-3 rounded bg-yellow-300 px-4 py-2 text-black">Save TOTW</button>}
      </div>

      <div className="rounded-2xl border border-blue-500/20 bg-black p-4">
        <h2 className="mb-3 text-yellow-300">Team of the season</h2>
        <Pitch board="TOTS" names={awards.filter((a) => a.kind === "TOTS").map((a) => a.playerName)} />
        {admin && <button onClick={() => save({ kind: "TOTS", players: Object.values(tots).map((p) => p.position + " " + p.lastName).join("\n") })} className="mt-3 rounded bg-yellow-300 px-4 py-2 text-black">Save TOTS</button>}
      </div>
    </section>
  );
}
