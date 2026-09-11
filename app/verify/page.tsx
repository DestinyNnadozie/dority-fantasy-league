"use client";
import { useEffect, useState } from "react";
export default function VerifyPage() {
  const [msg, setMsg] = useState("Confirming…");
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token") || "";
    fetch("/api/auth/verify?token=" + token).then((r) => r.json()).then((d) => {
      setMsg(d.ok ? "Email confirmed. You can log in." : (d.error || "Link failed"));
    });
  }, []);
  return (
    <section className="rounded-2xl bg-black p-6 text-center">
      <h1 className="text-2xl text-blue-300">Email confirmation</h1>
      <p className="mt-3 text-white">{msg}</p>
      <a className="mt-4 inline-block rounded-full bg-blue-600 px-4 py-2 text-black" href="/login">Login</a>
    </section>
  );
}
