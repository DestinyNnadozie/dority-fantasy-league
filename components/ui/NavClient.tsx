"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NewsBadge } from "@/components/NewsBadge";

export function NavClient() {
  const [name, setName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      setName(d.user?.name || null);
      setIsAdmin(Boolean(d.user && (d.user.role === "ADMIN" || d.user.role === "TEACHER")));
    });
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/me", { method: "DELETE" });
    setName(null);
    setIsAdmin(false);
    setOpen(false);
    router.push("/login");
    router.refresh();
  }

  const links = (
    <>
      <a href="/squad" onClick={() => setOpen(false)}>Squad</a>
      <a href="/leaderboard" onClick={() => setOpen(false)}>FPL table</a>
      <a href="/table" onClick={() => setOpen(false)}>Club table</a>
      <a href="/fixtures" onClick={() => setOpen(false)}>Fixtures</a>
      <a href="/live" onClick={() => setOpen(false)}>Live score</a>
      <a href="/rankings" onClick={() => setOpen(false)}>Rankings</a>
      <a href="/awards" onClick={() => setOpen(false)}>Awards</a>
      <a href="/leagues" onClick={() => setOpen(false)}>Leagues</a>
      <a href="/news" onClick={() => setOpen(false)} className="inline-flex items-center">News<NewsBadge /></a>
      <a href="/predictions" onClick={() => setOpen(false)}>Predictions</a>
      {name && isAdmin && <a href="/admin" onClick={() => setOpen(false)} className="font-semibold text-yellow-300">Admin</a>}
      {name && isAdmin && <a href="/admin/users" onClick={() => setOpen(false)} className="font-semibold text-yellow-300">Users</a>}
      {name && isAdmin && <a href="/admin/players" onClick={() => setOpen(false)} className="font-semibold text-yellow-300">Players</a>}
      {name ? (
        <>
          <span className="text-blue-300">{name}</span>
          <button type="button" onClick={logout}>Logout</button>
        </>
      ) : (
        <>
          <a href="/login" onClick={() => setOpen(false)}>Login</a>
          <a href="/register" onClick={() => setOpen(false)}>Register</a>
        </>
      )}
    </>
  );

  return (
    <header className="border-b border-blue-500/20 bg-black">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-3">
        <a href="/" className="font-semibold text-blue-400">D-Ligue 1 Fantasy</a>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          className="inline-flex min-h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-yellow-200 bg-yellow-300 px-4 py-3 text-base font-bold text-slate-950 shadow-md shadow-yellow-300/20 transition-colors hover:bg-yellow-200 active:bg-yellow-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-yellow-200 md:hidden"
          onClick={() => setOpen((current) => !current)}
        >
          <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d={open ? "M6 6l12 12M18 6L6 18" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
          <span>{open ? "Close" : "Menu"}</span>
        </button>
        <nav className="hidden flex-wrap items-center gap-3 text-sm text-blue-100 md:flex">{links}</nav>
      </div>
      <nav
        id="mobile-navigation"
        aria-label="Mobile navigation"
        hidden={!open}
        className={open ? "mx-3 mb-3 flex flex-col gap-2 rounded-2xl border border-blue-400/30 bg-blue-950/50 p-3 text-base text-blue-100 md:hidden [&>a]:flex [&>a]:min-h-12 [&>a]:items-center [&>a]:rounded-xl [&>a]:px-3 [&>a]:font-medium [&>a:hover]:bg-blue-900 [&>a:focus-visible]:outline-2 [&>a:focus-visible]:outline-yellow-300 [&>button]:min-h-12 [&>button]:rounded-xl [&>button]:bg-blue-900 [&>button]:px-3 [&>button]:text-left [&>span]:px-3" : "hidden"}
      >
        {links}
      </nav>
    </header>
  );
}
