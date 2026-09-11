"use client";
import { useEffect, useState } from "react";

type Ev = { minute: number; team: string; scorer: string };
type M = {
  fixtureKey: string; homeTeam: string; awayTeam: string; kickoff: string;
  status: string; homeXi: string[]; awayXi: string[]; events: Ev[];
};

export default function LivePage() {
  const [matches, setMatches] = useState<M[]>([]);
  const [admin, setAdmin] = useState(false);
  const [form, setForm] = useState({ homeTeam: "Marseille", awayTeam: "PSG", kickoff: "", homeXi: "", awayXi: "", scorer: "", minute: "", team: "Marseille" });
  const [msg, setMsg] = useState("");

  async function load() {
    const [l, me] = await Promise.all([fetch("/api/live"), fetch("/api/auth/me")]);
    const ld = await l.json();
    const md = await me.json();
    setMatches(ld.matches || []);
    setAdmin(Boolean(md.user && (md.user.role === "ADMIN" || md.user.role === "TEACHER")));
  }
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);

  async function saveMatch(extra: Partial<M> & { status?: string }) {
    const homeXi = (extra.homeXi || form.homeXi.split("\n").map((s) => s.trim()).filter(Boolean)).slice(0, 11);
    const awayXi = (extra.awayXi || form.awayXi.split("\n").map((s) => s.trim()).filter(Boolean)).slice(0, 11);
    const kickoff = extra.kickoff || form.kickoff;
    const homeTeam = extra.homeTeam || form.homeTeam;
    const awayTeam = extra.awayTeam || form.awayTeam;
    const fixtureKey = homeTeam + "-vs-" + awayTeam + "-" + kickoff;
    const current = matches.find((m) => m.fixtureKey === fixtureKey);
    const events = extra.events || current?.events || [];
    const res = await fetch("/api/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fixtureKey, homeTeam, awayTeam, kickoff, status: extra.status || current?.status || "UPCOMING", homeXi, awayXi, events })
    });
    setMsg(res.ok ? "Saved" : "Could not save");
    load();
  }

  async function addGoal(m: M) {
    if (!form.scorer || !form.minute) return;
    const events = [...(m.events || []), { minute: Number(form.minute), team: form.team, scorer: form.scorer }];
    await fetch("/api/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...m, events, status: "LIVE" })
    });
    setForm({ ...form, scorer: "", minute: "" });
    load();
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-blue-300">Live score</h1>
      {msg && <p className="text-sm text-yellow-300">{msg}</p>}

      {admin && (
        <div className="rounded-2xl border border-yellow-500/30 bg-black p-4">
          <p className="mb-2 text-sm font-semibold text-yellow-300">Coordinator: create / update a match</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <select value={form.homeTeam} onChange={(e) => setForm({ ...form, homeTeam: e.target.value })} className="rounded bg-white p-2 text-black">
              {["Marseille","PSG","Lyon","Monaco"].map((t) => <option key={t}>{t}</option>)}
            </select>
            <select value={form.awayTeam} onChange={(e) => setForm({ ...form, awayTeam: e.target.value })} className="rounded bg-white p-2 text-black">
              {["Marseille","PSG","Lyon","Monaco"].map((t) => <option key={t}>{t}</option>)}
            </select>
            <input type="datetime-local" value={form.kickoff} onChange={(e) => setForm({ ...form, kickoff: e.target.value })} className="rounded bg-white p-2 text-black sm:col-span-2" />
            <textarea placeholder={"Home XI - one name per line"} value={form.homeXi} onChange={(e) => setForm({ ...form, homeXi: e.target.value })} className="h-40 rounded bg-white p-2 text-black" />
            <textarea placeholder={"Away XI - one name per line"} value={form.awayXi} onChange={(e) => setForm({ ...form, awayXi: e.target.value })} className="h-40 rounded bg-white p-2 text-black" />
          </div>
          <button onClick={() => saveMatch({})} className="mt-3 rounded-full bg-blue-600 px-4 py-2 text-sm text-black">Save match</button>
        </div>
      )}

      <div className="space-y-4">
        {matches.map((m) => {
          const homeGoals = (m.events || []).filter((e) => e.team === m.homeTeam).length;
          const awayGoals = (m.events || []).filter((e) => e.team === m.awayTeam).length;
          const live = m.status === "LIVE";
          return (
            <article key={m.fixtureKey} className="rounded-2xl border border-blue-500/20 bg-black p-4">
              <div className="flex items-center justify-between">
                <span className={"rounded-full px-2 py-1 text-xs " + (live ? "bg-red-600 text-white" : m.status === "FT" ? "bg-blue-900 text-blue-200" : "bg-blue-950 text-blue-300")}>{m.status}</span>
                <span className="text-xs text-blue-400">{new Date(m.kickoff).toLocaleString()}</span>
              </div>
              <p className="mt-3 text-center text-2xl font-black text-white">{m.homeTeam} {homeGoals} - {awayGoals} {m.awayTeam}</p>
              <div className="mt-2 space-y-1 text-center text-sm text-yellow-200">
                {(m.events || []).map((e, i) => <p key={i}>{e.minute}' {e.scorer} ({e.team})</p>)}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-blue-950 p-3">
                  <p className="mb-2 text-xs uppercase text-blue-300">{m.homeTeam} XI</p>
                  <ol className="list-decimal pl-4 text-sm">{(m.homeXi || []).map((n, i) => <li key={i}>{n}</li>)}</ol>
                </div>
                <div className="rounded-xl bg-blue-950 p-3">
                  <p className="mb-2 text-xs uppercase text-blue-300">{m.awayTeam} XI</p>
                  <ol className="list-decimal pl-4 text-sm">{(m.awayXi || []).map((n, i) => <li key={i}>{n}</li>)}</ol>
                </div>
              </div>
              {admin && live && (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <input placeholder="Scorer" value={form.scorer} onChange={(e) => setForm({ ...form, scorer: e.target.value })} className="rounded bg-white p-2 text-black" />
                  <input placeholder="Minute" value={form.minute} onChange={(e) => setForm({ ...form, minute: e.target.value })} className="rounded bg-white p-2 text-black" />
                  <select value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })} className="rounded bg-white p-2 text-black">
                    <option>{m.homeTeam}</option>
                    <option>{m.awayTeam}</option>
                  </select>
                  <button onClick={() => addGoal(m)} className="rounded bg-yellow-300 px-3 py-2 text-black">Add goal</button>
                  <button onClick={() => saveMatch({ ...m, status: "FT" })} className="col-span-2 rounded bg-blue-800 px-3 py-2 text-white sm:col-span-4">Full time</button>
                </div>
              )}
            </article>
          );
        })}
        {!matches.length && <p className="text-sm text-blue-400">No live matches yet. Coordinator adds kickoff and XIs above.</p>}
      </div>
    </section>
  );
}