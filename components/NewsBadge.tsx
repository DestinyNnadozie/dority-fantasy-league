"use client";
import { useEffect, useState } from "react";

export function NewsBadge() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const seen = Number(localStorage.getItem("newsReadAt") || 0);
    fetch("/api/news").then((r) => r.json()).then((d) => {
      const list = d.news || [];
      setN(list.filter((x: any) => new Date(x.createdAt).getTime() > seen).length);
    });
  }, []);
  if (!n) return null;
  return <span className="ml-1 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{n}</span>;
}
