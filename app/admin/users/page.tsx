"use client";
import { useEffect, useState } from "react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  async function load() {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data.users || []);
    if (!res.ok) setMsg(data.error || "Forbidden");
  }
  useEffect(() => { load(); }, []);

  async function resetPassword(userId: string, name: string) {
    const password = prompt("New password for " + name);
    if (!password) return;
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, password })
    });
    const data = await res.json();
    setMsg(res.ok ? "Password reset for " + name : data.error || "Failed");
  }

  return (
    <section className="rounded-2xl border border-blue-500/20 bg-black p-4">
      <h1 className="mb-3 text-xl font-semibold text-blue-300">Users</h1>
      {msg && <p className="mb-3 text-sm text-yellow-300">{msg}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="text-blue-400">
              <th className="py-2">Name</th>
              <th>Email</th>
              <th>Team</th>
              <th>Pts</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-blue-900/40">
                <td className="py-2">{u.name}<div className="text-xs text-blue-400">{u.role}</div></td>
                <td>{u.email}</td>
                <td>{u.teamName}</td>
                <td>{u.points}</td>
                <td>
                  <button type="button" onClick={() => resetPassword(u.id, u.name)} className="text-xs text-blue-300">Reset password</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
