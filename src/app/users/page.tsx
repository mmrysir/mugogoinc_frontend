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
        // Upgrade/Update Role
        await api.users.updateRole(user.id, role);
      } else {
        // Create new user
        if (!password) {
          throw new Error("Password is required for new users");
        }
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
              disabled={!!user} // Only editable on create
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
              disabled={!!user} // Only editable on create
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

export default function UsersPage() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const me = await api.auth.me();
      setCurrentUser(me);
      if (me.role === "SUPER_ADMIN") {
        const data = await api.users.list();
        setUsers(data);
      }
      setError(null);
    } catch {
      setError("Failed to fetch users. Ensure you are logged in as a Super Admin.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchData, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

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

  if (currentUser?.role !== "SUPER_ADMIN") {
    return (
      <div className="app-shell">
        <Sidebar />
        <main className="main-content">
          <div className="card text-center py-16 mt-8">
            <div className="text-4xl mb-4 text-red-500"><Icon name="lock" size="lg" /></div>
            <p className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Access Denied</p>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>You must be a Super Admin to view the Control Center.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
              Team Management
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
              {users.length} registered user{users.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => { setEditingUser(null); setShowModal(true); }}
          >
            + New User
          </button>
        </div>
        <div className="accent-line mb-8" />

        {error && (
          <div className="card mb-6" style={{ borderColor: "rgba(244,63,94,0.3)", background: "rgba(244,63,94,0.06)" }}>
            <p className="text-sm" style={{ color: "#fb7185" }}><Icon name="warning" className="mr-2" /> {error}</p>
          </div>
        )}

        <div className="card animate-slide-up" style={{ padding: 0, overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                      {user.name}
                    </span>
                    {user.id === currentUser?.id && (
                      <span className="ml-2 text-xs opacity-60">(You)</span>
                    )}
                  </td>
                  <td>
                    <span style={{ color: "var(--text-muted)" }}>{user.email}</span>
                  </td>
                  <td>
                    <span className="badge badge-express">{user.role.replace(/_/g, " ")}</span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}
                        onClick={() => { setEditingUser(user); setShowModal(true); }}
                      >
                        Edit Role
                      </button>
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
