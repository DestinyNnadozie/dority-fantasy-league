"use client";
import { useState } from "react";

export function RenameTeam({ current, onSaved }: { current: string; onSaved: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(current);
  const [msg, setMsg] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/team/name", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: value })
    });
    const data = await res.json();
    if (!res.ok) { setMsg(data.error || "Could not save"); return; }
    onSaved(data.name);
    setOpen(false);
    setMsg("Saved");
  }

  if (!open) {
    return (
      <button type="button" onClick={() => { setValue(current); setOpen(true); }} className="text-xs text-blue-300">
        Rename team
      </button>
    );
  }

  return (
    <form onSubmit={save} className="mt-2 flex flex-wrap items-center gap-2">
      <input value={value} onChange={(e) => setValue(e.target.value)} className="rounded bg-white px-2 py-1 text-sm text-black" />
      <button className="rounded bg-blue-600 px-3 py-1 text-xs text-black">Save</button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-blue-300">Cancel</button>
      {msg && <span className="text-xs text-blue-200">{msg}</span>}
    </form>
  );
}
