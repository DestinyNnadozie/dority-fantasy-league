"use client";
import { useEffect, useState } from "react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [err, setErr] = useState("");
  useEffect(() => {
    fetch("/api/admin/users").then(async (r) => {
      const d = await r.json();
      if (!r.ok) setErr(d.error || "Could not load users");
      setUsers(d.users || []);
    });
  }, []);
  return (
    <section className="rounded-2xl border border-blue-500/20 bg-black p-4">
      <h1 className="mb-1 text-xl font-semibold text-blue-300">Users</h1>
      <p className="mb-3 text-sm text-blue-400">{users.length} accounts</p>
      {err && <p className="text-red-400">{err}</p>}
      <table className="w-full text-left text-sm">
        <thead className="text-blue-400">
          <tr><th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Team</th><th className="p-2">Pts</th></tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-blue-900">
              <td className="p-2">{u.name}<div className="text-xs text-blue-400">{u.role}</div></td>
              <td className="p-2">{u.email}</td>
              <td className="p-2">{u.teamName}</td>
              <td className="p-2">{u.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
