"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, teamName, email, password })
    });
    const data = await res.json();
    if (!res.ok) { setMsg(data.error || "Register failed"); return; }
    router.push("/squad");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-10 max-w-md rounded-2xl border border-blue-500/20 bg-black p-6">
      <h1 className="mb-4 text-xl font-bold text-blue-300">Create your team</h1>
      <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="mb-2 w-full rounded bg-white p-3 text-black" />
      <input required value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Fantasy team name" className="mb-2 w-full rounded bg-white p-3 text-black" />
      <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="mb-2 w-full rounded bg-white p-3 text-black" />
      <div className="relative mb-3">
        <input required minLength={6} type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (6+ characters)" className="w-full rounded bg-white p-3 text-black" />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-3 text-sm">eye</button>
      </div>
      {msg && <p className="mb-3 text-sm text-red-400">{msg}</p>}
      <button className="w-full rounded-full bg-blue-600 py-3 font-semibold text-black">Register</button>
    </form>
  );
}
