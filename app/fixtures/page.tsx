"use client";
import { useEffect, useState } from "react";

const TEAMS = ["PSG", "Marseille", "Lyon", "Monaco"];

async function readJson(res: Response) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return {}; }
}

export default function FixturesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [home, setHome] = useState("PSG");
  const [away, setAway] = useState("Marseille");
  const [kickoff, setKickoff] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const [f, me] = await Promise.all([fetch("/api/fixtures"), fetch("/api/auth/me")]);
    const fix = await readJson(f);
    const auth = await readJson(me);
    setRows(fix.fixtures || []);
    setIsAdmin(auth.user?.role === "ADMIN" || auth.user?.role === "TEACHER" || auth.user?.email === "coordinator@school.local");
  }
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (home === away) { setMsg("Home and away must be different"); return; }
    if (!kickoff) { setMsg("Pick a date and time"); return; }
    const res = await fetch("/api/fixtures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ home, away, kickoff: new Date(kickoff).toISOString() })
    });
    const data = await readJson(res);
    setMsg(res.ok ? "Fixture added" : (data.error || "Could not add fixture"));
    if (res.ok) { setKickoff(""); load(); }
  }

  async function saveScore(id: string, homeGoals: string, awayGoals: string) {
    const res = await fetch("/api/fixtures", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, homeGoals, awayGoals })
    });
    const data = await readJson(res);
    setMsg(res.ok ? "Score saved" : (data.error || "Could not save score"));
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete fixture?")) return;
    await fetch("/api/fixtures", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-blue-300">Fixtures</h1>
      {msg && <p className="text-sm text-yellow-300">{msg}</p>}
      <div className="space-y-3">
        {rows.map((f) => (
          <article key={f.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-500/20 bg-black p-4">
            <div>
              <p className="text-xs text-blue-400">{f.kickoff ? new Date(f.kickoff).toLocaleString() : "Date TBC"}</p>
              <p className="text-lg text-white">{f.home} vs {f.away}</p>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <>
                  <input defaultValue={f.homeGoals} className="w-12 rounded bg-white p-1 text-center text-black" id={"h"+f.id} />
                  <span>-</span>
                  <input defaultValue={f.awayGoals} className="w-12 rounded bg-white p-1 text-center text-black" id={"a"+f.id} />
                  <button type="button" className="text-xs text-blue-300" onClick={() => {
                    const hg = (document.getElementById("h"+f.id) as HTMLInputElement).value;
                    const ag = (document.getElementById("a"+f.id) as HTMLInputElement).value;
                    saveScore(f.id, hg, ag);
                  }}>Save score</button>
                  <button type="button" className="text-xs text-red-300" onClick={() => remove(f.id)}>Delete</button>
                </>
              ) : (
                <p className="font-mono text-white">{f.homeGoals === "" || f.homeGoals == null ? "vs" : f.homeGoals + " - " + f.awayGoals}</p>
              )}
            </div>
          </article>
        ))}
      </div>
      {isAdmin && (
        <form onSubmit={add} className="space-y-3 rounded-2xl border border-blue-500/20 bg-black p-5">
          <h2 className="text-blue-300">Add fixture</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <select value={home} onChange={(e) => setHome(e.target.value)} className="rounded bg-white p-2 text-black">
              {TEAMS.map((t) => <option key={t}>{t}</option>)}
            </select>
            <select value={away} onChange={(e) => setAway(e.target.value)} className="rounded bg-white p-2 text-black">
              {TEAMS.map((t) => <option key={t}>{t}</option>)}
            </select>
            <input type="datetime-local" value={kickoff} onChange={(e) => setKickoff(e.target.value)} className="rounded bg-white p-2 text-black" />
          </div>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-black">Add fixture</button>
        </form>
      )}
    </div>
  );
}