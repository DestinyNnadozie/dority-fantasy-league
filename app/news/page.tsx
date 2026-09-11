"use client";
import { useEffect, useState } from "react";

export default function NewsPage() {
  const [news, setNews] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  async function load() {
    const [n, me] = await Promise.all([fetch("/api/news"), fetch("/api/auth/me")]);
    setNews((await n.json()).news || []);
    const user = (await me.json()).user;
    setIsAdmin(user?.role === "ADMIN" || user?.role === "TEACHER");
  }
  useEffect(() => { load(); }, []);

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/news", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, body }) });
    setTitle(""); setBody("");
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this news item?")) return;
    await fetch("/api/news", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  }

  return (
    <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold text-blue-300">News</h1>
        {news.map((n) => (
          <article key={n.id} className="rounded-2xl border border-blue-500/20 bg-black p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-blue-400">{n.date}</p>
                <h2 className="mt-1 text-lg font-medium text-white">{n.title}</h2>
              </div>
              {isAdmin && (
                <button type="button" onClick={() => remove(n.id)} className="text-xs text-red-300">Delete</button>
              )}
            </div>
            <p className="mt-2 text-sm text-blue-100">{n.body}</p>
          </article>
        ))}
      </section>
      {isAdmin && (
        <form onSubmit={publish} className="h-fit rounded-2xl border border-blue-500/20 bg-black p-5">
          <h2 className="mb-3 text-blue-300">Publish update</h2>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Headline" className="mb-3 w-full rounded bg-white p-2 text-black" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Details" className="mb-3 h-32 w-full rounded bg-white p-2 text-black" />
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-black">Post</button>
        </form>
      )}
    </div>
  );
}
