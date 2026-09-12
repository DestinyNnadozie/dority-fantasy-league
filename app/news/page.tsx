"use client";
import { useEffect, useState } from "react";

export default function NewsPage() {
  const [news, setNews] = useState<any[]>([]);
  const [admin, setAdmin] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState("");

  function load() {
    fetch("/api/news").then((r) => r.json()).then((d) => setNews(d.news || []));
  }

  useEffect(() => {
    load();
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      const u = d.user;
      setAdmin(!!u && (u.role === "ADMIN" || u.email === "coordinator@school.local"));
    });
  }, []);

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
    <section className="space-y-3">
      <h1 className="text-2xl font-bold text-blue-300">News</h1>
      {admin && (
        <div className="space-y-2 rounded-2xl bg-black p-4">
          <p className="text-sm text-yellow-300">Coordinator — post news</p>
          {msg && <p className="text-sm text-yellow-300">{msg}</p>}
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full rounded bg-white p-3 text-black" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body" className="min-h-28 w-full rounded bg-white p-3 text-black" />
          <button onClick={post} className="rounded-full bg-blue-600 px-4 py-2 text-black">Post</button>
        </div>
      )}
      {news.map((n) => (
        <article key={n.id} className="rounded-2xl bg-black p-4">
          <h2 className="text-lg font-semibold text-white">{n.title}</h2>
          <p className="mt-1 whitespace-pre-wrap text-sm text-blue-200">{n.body}</p>
        </article>
      ))}
      {!news.length && <p className="text-blue-400">No news yet.</p>}
    </section>
  );
}
