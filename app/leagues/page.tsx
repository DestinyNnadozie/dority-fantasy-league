"use client";
import { useEffect, useState } from "react";

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const res = await fetch("/api/leagues");
    if (res.ok) setLeagues((await res.json()).leagues || []);
  }
  useEffect(() => { load(); }, []);

  async function createLeague(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/leagues", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    setMsg(res.ok ? "League created" : "Login first");
    setName("");
    load();
  }

  async function joinLeague(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/leagues/join", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
    const data = await res.json();
    setMsg(res.ok ? "Joined " + data.league.name : data.error || "Join failed");
    setCode("");
    load();
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-2xl border border-blue-500/20 bg-black p-6">
        <h1 className="mb-4 text-xl font-semibold text-blue-300">Your leagues</h1>
        {msg && <p className="mb-3 text-sm text-blue-200">{msg}</p>}
        <ul className="space-y-2 text-sm">
          {leagues.map((l) => (
            <li key={l.id} className="flex justify-between rounded-lg bg-blue-950/40 px-3 py-2">
              <span>{l.name}</span>
              <span className="font-mono text-blue-300">{l.code}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="space-y-4">
        <form onSubmit={createLeague} className="rounded-2xl border border-blue-500/20 bg-black p-6">
          <h2 className="mb-3 text-blue-300">Create league</h2>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Class 10A" className="mb-3 w-full rounded bg-zinc-950 p-2" />
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-black">Create</button>
        </form>
        <form onSubmit={joinLeague} className="rounded-2xl border border-blue-500/20 bg-black p-6">
          <h2 className="mb-3 text-blue-300">Join with code</h2>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABC123" className="mb-3 w-full rounded bg-zinc-950 p-2 uppercase" />
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-black">Join</button>
        </form>
      </section>
    </div>
  );
}
