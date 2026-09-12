"use client";
import { useEffect, useState } from "react";
export default function AdminNewsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [news, setNews] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  function load() {
    fetch("/api/news").then((r) => r.json()).then((d) => setNews(d.news || []));
  }
  useEffect(() => { load(); }, []);
  async function post() {
    const res = await fetch("/api/news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body })
    });
    const d = await res.json();
    setMsg(res.ok ? "Posted" : d.error || "Failed");
    if (res.ok) { setTitle(""); setBody(""); load(); }
  }
  return (
    <section className="space-y-4">
      <h1 className="text-xl text-yellow-300">Post news</h1>
      {msg && <p className="text-sm text-yellow-300">{msg}</p>}
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full rounded bg-white p-3 text-black" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body" className="min-h-32 w-full rounded bg-white p-3 text-black" />
      <button onClick={post} className="rounded-full bg-blue-600 px-4 py-2 text-black">Post</button>
      <ul className="space-y-2">
        {news.map((n) => (
          <li key={n.id} className="rounded-xl bg-black p-3">
            <p className="font-semibold text-white">{n.title}</p>
            <p className="text-sm text-blue-200">{n.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
