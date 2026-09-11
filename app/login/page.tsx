"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

function Eye({ off }: { off: boolean }) {
  return off ? (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3l18 18M10.6 10.6A3 3 0 0012 15a3 3 0 002.4-4.4M9.9 5.1A10.7 10.7 0 0112 5c6 0 10 7 10 7a16.7 16.7 0 01-4.2 4.8M6.1 6.1C3.8 7.8 2 12 2 12s4 7 10 7a10.8 10.8 0 004.1-.8" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: (form.elements.namedItem("email") as HTMLInputElement).value,
        password: (form.elements.namedItem("password") as HTMLInputElement).value
      })
    });
    if (!res.ok) { setError("Invalid email or password"); return; }
    router.push("/squad");
    router.refresh();
  }

  return (
    <form method="post" autoComplete="off" onSubmit={onSubmit} className="mx-auto max-w-sm space-y-3 rounded-2xl border border-blue-500/20 bg-black p-6">
      <h1 className="text-xl font-semibold text-blue-300">Login</h1>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <input name="email" type="email" required autoComplete="off" placeholder="Email" className="w-full rounded-lg bg-white p-2 text-black" />
      <div className="relative">
        <input name="password" type={show ? "text" : "password"} required autoComplete="new-password" placeholder="Password" className="w-full rounded-lg bg-white p-2 pr-10 text-black" />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-zinc-600">
          <Eye off={show} />
        </button>
      </div>
      <button type="submit" className="w-full origin-center cursor-pointer rounded-lg bg-blue-600 py-2 font-medium text-black transition duration-200 hover:scale-105 hover:bg-blue-500">
        Sign in
      </button>
    </form>
  );
}
