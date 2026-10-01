"use client";

import { useCallback, useEffect, useState } from "react";
import { api, AuthUser, UserRole } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import Icon from "@/components/Icon";

function UserModal({
  user,
  onClose,
  onSaved,
}: {
  user?: AuthUser | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(user?.role ?? "AGENT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (user) {
        await api.users.updateRole(user.id, role);
      } else {
        if (!password) throw new Error("Password is required for new users");
        await api.users.create({ name, email, password, role });
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save user");
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {user ? "Edit User Role" : "New User"}
          </h2>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: "0.35rem 0.75rem" }}>
            <Icon name="close" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="form-label">Full Name *</label>
            <input
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Doe"
              required
              disabled={!!user}
            />
          </div>
          <div>
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. jane@example.com"
              required
              disabled={!!user}
            />
          </div>
          {!user && (
            <div>
              <label className="form-label">Temporary Password *</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Must be at least 8 characters"
                required={!user}
              />
            </div>
          )}
          <div>
            <label className="form-label">User Role</label>
            <select className="form-select" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              <option value="AGENT">Agent</option>
              <option value="MANAGER">Manager</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
            {user && user.role === "SUPER_ADMIN" && role !== "SUPER_ADMIN" && (
              <p className="text-xs mt-1" style={{ color: "#fb7185" }}>
                Warning: You are demoting a Super Admin.
              </p>
            )}
          </div>

          {error && <p className="text-sm" style={{ color: "#fb7185" }}>{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? (user ? "Saving…" : "Creating…") : user ? "Update Role" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const colors: Record<string, string> = {
    SUPER_ADMIN: "rgba(239,68,68,0.15)",
    MANAGER: "rgba(59,130,246,0.15)",
    AGENT: "rgba(16,185,129,0.15)",
  };
  const textColors: Record<string, string> = {
    SUPER_ADMIN: "#f87171",
    MANAGER: "#60a5fa",
    AGENT: "#34d399",
  };
  return (
    <span
      style={{
        background: colors[role] ?? "rgba(100,100,100,0.1)",
        color: textColors[role] ?? "#ccc",
        borderRadius: "9999px",
        padding: "0.2rem 0.7rem",
        fontSize: "0.75rem",
        fontWeight: 600,
      }}
    >
      {role.replace(/_/g, " ")}
    </span>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const me = await api.auth.me();
      setCurrentUser(me);
      // Both SUPER_ADMIN and MANAGER can view users
      if (me.role === "SUPER_ADMIN" || me.role === "MANAGER") {
        const data = await api.users.list();
        setUsers(data);
      }
      setError(null);
    } catch {
      setError("Failed to fetch users. Ensure you have Manager or Super Admin access.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchData, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleApprove = async (user: AuthUser) => {
    setActionLoading(user.id + "_approve");
    try {
      await api.users.approve(user.id);
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (user: AuthUser) => {
    if (!confirm(`Reject and delete account for ${user.name} (${user.email})?`)) return;
    setActionLoading(user.id + "_reject");
    try {
      await api.users.reject(user.id);
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleFreeze = async (user: AuthUser) => {
    if (!confirm(`Freeze / Pause account for ${user.name}? They will be unable to log in until unfrozen.`)) return;
    setActionLoading(user.id + "_freeze");
    try {
      await api.users.freeze(user.id);
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to freeze account");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnfreeze = async (user: AuthUser) => {
    setActionLoading(user.id + "_unfreeze");
    try {
      await api.users.unfreeze(user.id);
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to unfreeze account");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (user: AuthUser) => {
    if (!confirm(`Are you sure you want to permanently delete ${user.name} (${user.email})? This action cannot be undone.`)) return;
    setActionLoading(user.id + "_delete");
    try {
      await api.users.delete(user.id);
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="app-shell">
        <Sidebar />
        <main className="main-content flex items-center justify-center">
          <div style={{ color: "var(--text-muted)" }}>Loading…</div>
        </main>
      </div>
    );
  }

  if (currentUser?.role !== "SUPER_ADMIN" && currentUser?.role !== "MANAGER") {
    return (
      <div className="app-shell">
        <Sidebar />
        <main className="main-content">
          <div className="card text-center py-16 mt-8">
            <div className="text-4xl mb-4 text-red-500"><Icon name="lock" size="lg" /></div>
            <p className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Access Denied</p>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>You must be a Manager or Super Admin to access Team Management.</p>
          </div>
        </main>
      </div>
    );
  }

  const pendingUsers = users.filter((u) => !u.is_approved);
  const approvedUsers = users.filter((u) => u.is_approved);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
              Team Management
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
              {approvedUsers.length} active member{approvedUsers.length !== 1 ? "s" : ""}
              {pendingUsers.length > 0 && (
                <span style={{ color: "#fbbf24", fontWeight: 600 }}>
                  {" "}· {pendingUsers.length} pending approval
                </span>
              )}
            </p>
          </div>
          {currentUser.role === "SUPER_ADMIN" && (
            <button
              className="btn btn-primary"
              onClick={() => { setEditingUser(null); setShowModal(true); }}
            >
              + New User
            </button>
          )}
        </div>
        <div className="accent-line mb-8" />

        {error && (
          <div className="card mb-6" style={{ borderColor: "rgba(244,63,94,0.3)", background: "rgba(244,63,94,0.06)" }}>
            <p className="text-sm" style={{ color: "#fb7185" }}><Icon name="warning" className="mr-2" /> {error}</p>
          </div>
        )}

        {/* ── Pending Approval Section ── */}
        {pendingUsers.length > 0 && (
          <div className="card animate-slide-up mb-8" style={{ borderColor: "rgba(251,191,36,0.3)", background: "rgba(251,191,36,0.04)" }}>
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined" style={{ color: "#fbbf24" }}>pending</span>
              <h2 className="text-base font-bold" style={{ color: "#fbbf24" }}>
                Pending Account Requests
              </h2>
              <span
                style={{
                  background: "#fbbf24",
                  color: "#0f172a",
                  borderRadius: "9999px",
                  padding: "0.1rem 0.55rem",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                }}
              >
                {pendingUsers.length}
              </span>
            </div>
            <div style={{ padding: 0, overflow: "hidden", borderRadius: "0.5rem", border: "1px solid rgba(251,191,36,0.15)" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                          {user.name}
                        </span>
                      </td>
                      <td><span style={{ color: "var(--text-muted)" }}>{user.email}</span></td>
                      <td><span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>—</span></td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ padding: "0.3rem 0.9rem", fontSize: "0.8rem", background: "linear-gradient(135deg,#10b981,#059669)" }}
                            disabled={actionLoading === user.id + "_approve"}
                            onClick={() => handleApprove(user)}
                          >
                            {actionLoading === user.id + "_approve" ? "…" : "✓ Approve"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem", color: "#fb7185" }}
                            disabled={actionLoading === user.id + "_reject"}
                            onClick={() => handleReject(user)}
                          >
                            {actionLoading === user.id + "_reject" ? "…" : "✗ Reject"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Active Team Members ── */}
        <div className="card animate-slide-up" style={{ padding: 0, overflow: "hidden" }}>
          <div className="flex items-center gap-2 p-5 pb-0">
            <span className="material-symbols-outlined text-sm" style={{ color: "var(--text-secondary)" }}>group</span>
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              Active Team
            </h2>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {approvedUsers.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
                    No approved team members yet.
                  </td>
                </tr>
              )}
              {approvedUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                      {user.name}
                    </span>
                    {user.id === currentUser?.id && (
                      <span className="ml-2 text-xs opacity-60">(You)</span>
                    )}
                  </td>
                  <td><span style={{ color: "var(--text-muted)" }}>{user.email}</span></td>
                  <td><RoleBadge role={user.role} /></td>
                  <td>
                    {user.is_frozen ? (
                      <span
                        style={{
                          background: "rgba(239, 68, 68, 0.15)",
                          color: "#f87171",
                          borderRadius: "9999px",
                          padding: "0.2rem 0.65rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        ❄️ Frozen / Paused
                      </span>
                    ) : (
                      <span
                        style={{
                          background: "rgba(16, 185, 129, 0.15)",
                          color: "#34d399",
                          borderRadius: "9999px",
                          padding: "0.2rem 0.65rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        🟢 Active
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      {currentUser.role === "SUPER_ADMIN" && (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: "0.3rem 0.65rem", fontSize: "0.8rem" }}
                          onClick={() => { setEditingUser(user); setShowModal(true); }}
                        >
                          Edit Role
                        </button>
                      )}
                      {user.id !== currentUser?.id && (
                        <>
                          {user.is_frozen ? (
                            <button
                              type="button"
                              className="btn btn-ghost"
                              style={{ padding: "0.3rem 0.65rem", fontSize: "0.8rem", color: "#34d399" }}
                              disabled={actionLoading === user.id + "_unfreeze"}
                              onClick={() => handleUnfreeze(user)}
                            >
                              {actionLoading === user.id + "_unfreeze" ? "…" : "▶ Resume"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-ghost"
                              style={{ padding: "0.3rem 0.65rem", fontSize: "0.8rem", color: "#fbbf24" }}
                              disabled={actionLoading === user.id + "_freeze"}
                              onClick={() => handleFreeze(user)}
                            >
                              {actionLoading === user.id + "_freeze" ? "…" : "⏸ Freeze"}
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ padding: "0.3rem 0.65rem", fontSize: "0.8rem", color: "#fb7185" }}
                            disabled={actionLoading === user.id + "_delete"}
                            onClick={() => handleDelete(user)}
                          >
                            {actionLoading === user.id + "_delete" ? "…" : "🗑 Delete"}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <UserModal
            user={editingUser}
            onClose={() => { setShowModal(false); setEditingUser(null); }}
            onSaved={fetchData}
          />
        )}
      </main>
    </div>
  );
}
