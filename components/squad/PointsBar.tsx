"use client";
import { useEffect, useState } from "react";
export function PointsBar() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch("/api/team/score").then((r) => r.json()).then(setData); }, []);
  if (!data || data.error) return null;
  return (
    <div className="mb-4 flex gap-6 rounded-xl border border-blue-500/20 bg-black px-4 py-3 text-sm">
      <span className="text-blue-300">{data.teamName}</span>
      <span>GW{data.gameweek}: <b className="text-white">{data.gameweekPoints} pts</b></span>
      <span>Overall: <b className="text-white">{data.overall} pts</b></span>
    </div>
  );
}
