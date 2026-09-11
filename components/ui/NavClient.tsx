"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

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
      <a href="/fixtures" onClick={() => setOpen(false)}>Fixtures</a>`n      <a href="/live" onClick={() => setOpen(false)}>Live score</a>
      <a href="/rankings" onClick={() => setOpen(false)}>Rankings</a>
      <a href="/awards" onClick={() => setOpen(false)}>Awards</a>
      <a href="/leagues" onClick={() => setOpen(false)}>Leagues</a>
      <a href="/news" onClick={() => setOpen(false)}>News</a>
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
      <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-3">
        <a href="/" className="font-semibold text-blue-400">Dority Fantasy League</a>
        <button type="button" className="rounded-lg px-3 py-2 text-sm text-white md:hidden" onClick={() => setOpen(!open)}>
          {open ? "Close" : "Menu"}
        </button>
        <nav className="hidden flex-wrap items-center gap-3 text-sm text-blue-100 md:flex">{links}</nav>
      </div>
      {open && <nav className="flex flex-col gap-4 px-4 pb-4 text-base text-blue-100 md:hidden">{links}</nav>}
    </header>
  );
}
