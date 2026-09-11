"use client";
import { useEffect, useState } from "react";

function formatLeft(ms: number) {
  if (ms <= 0) return "now";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h >= 48) return Math.floor(h / 24) + " days";
  if (h >= 1) return h + "h " + m + "m";
  return m + " minutes";
}

export function DeadlineBanner() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch("/api/deadline").then((r) => r.json()).then(setData);
    const t = setInterval(() => {
      fetch("/api/deadline").then((r) => r.json()).then(setData);
    }, 60000);
    return () => clearInterval(t);
  }, []);
  if (!data?.ok) return null;

  const locked = data.locked;
  const urgent = !locked && data.msLeft < 24 * 3600000;

  return (
    <div className={`px-4 py-2 text-center text-sm ${
      locked ? "bg-red-950 text-red-200" : urgent ? "bg-yellow-400 text-black" : "bg-blue-950 text-blue-100"
    }`}>
      {locked
        ? data.name + " is locked. Transfers and squad changes are closed."
        : "Transfer deadline for " + data.name + " in " + formatLeft(data.msLeft) + " — " + new Date(data.deadline).toLocaleString()}
    </div>
  );
}
