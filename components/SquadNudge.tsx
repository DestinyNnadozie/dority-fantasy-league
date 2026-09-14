"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function SquadNudge() {
  const path = usePathname();
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (path === "/squad" || path === "/login" || path === "/register") {
      setShow(false);
      return;
    }
    fetch("/api/auth/me").then((r) => r.json()).then(async (d) => {
      if (!d.user) { setShow(false); return; }
      const t = await fetch("/api/team/picks").then((r) => r.json());
      const n = t.team?.picks?.length || 0;
      setShow(n < 15);
    });
  }, [path]);
  if (!show) return null;
  return (
    <div className="border-b border-yellow-500/40 bg-yellow-300 px-3 py-2 text-center text-sm text-black">
      You have not saved a full squad.{" "}
      <a href="/squad" className="font-bold underline">Pick your team</a>
    </div>
  );
}