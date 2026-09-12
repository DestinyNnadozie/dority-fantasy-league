"use client";
import { useEffect, useState } from "react";
export default function NewsPage() {
  const [news, setNews] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/news").then((r) => r.json()).then((d) => setNews(d.news || []));
  }, []);
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-bold text-blue-300">News</h1>
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
