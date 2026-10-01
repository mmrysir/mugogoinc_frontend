"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, Organization, OrgStatus, AuthUser } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import { StatusBadge } from "@/components/Badges";
import Icon from "@/components/Icon";

function OrgModal({
  org,
  onClose,
  onSaved,
}: {
  org?: Organization | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(org?.name ?? "");
  const [status, setStatus] = useState<OrgStatus>(org?.status ?? "ONBOARDING");
  const [agentId, setAgentId] = useState(org?.assigned_agent_id ?? "");
  const [agents, setAgents] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.users
      .list("AGENT", true)  // approved_only = true
      .then((data) => {
        if (active) setAgents(data);
      })
      .catch(() => {
        if (active) setError("Failed to load agents for assignment.");
      });
    return () => {
      active = false;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const body = { name, status, assigned_agent_id: agentId || undefined };
      if (org) {
        await api.organizations.update(org.id, body);
      } else {
        await api.organizations.create(body);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save organization");
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {org ? "Edit Organization" : "New Organization"}
          </h2>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: "0.35rem 0.75rem" }}>
            <Icon name="close" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="form-label">Client / Organization Name *</label>
            <input
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Westlands Legal Group"
              required
            />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value as OrgStatus)}>
              <option value="ONBOARDING">Onboarding</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
          <div>
            <label className="form-label">Assigned Agent</label>
            <select
              className="form-select"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
            >
              <option value="">— Select an agent (optional) —</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.email})
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm" style={{ color: "#fb7185" }}>{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? (org ? "Saving…" : "Creating…") : org ? "Save Changes" : "Create Organization"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OrganizationsPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [agentMap, setAgentMap] = useState<Record<string, string>>({});  // id -> name

  const fetchSession = useCallback(async () => {
    try {
      setUser(await api.auth.me());
    } catch {
      setUser(null);
    } finally {
      setSessionLoading(false);
    }
  }, []);

  const canCreate =
    user?.role === "SUPER_ADMIN" || user?.role === "MANAGER";

  const fetchOrgs = useCallback(async () => {
    try {
      const data = await api.organizations.list();
      setOrgs(data.items);
      setTotal(data.total);
      setError(null);
    } catch {
      setError("Cannot reach API. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = async (org: Organization) => {
    if (!window.confirm(`Delete "${org.name}"?`)) return;
    try {
      await api.organizations.delete(org.id);
      await fetchOrgs();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete organization");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrgs();
      fetchSession();
      // Build agent name map for display in table
      api.users.list("AGENT", true).then((agents) => {
        const map: Record<string, string> = {};
        agents.forEach((a) => { map[a.id] = a.name; });
        setAgentMap(map);
      }).catch(() => {});
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchSession, fetchOrgs]);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
              Organizations
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
              {total} client account{total !== 1 ? "s" : ""}
            </p>
          </div>
          {sessionLoading ? null : canCreate ? (
            <button
              id="create-org-btn"
              className="btn btn-primary"
              onClick={() => { setEditingOrg(null); setShowModal(true); }}
            >
              + New Organization
            </button>
          ) : (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg text-sm text-amber-700 max-w-xs">
              You do not have permission to create organizations. Request an
              organization invite from your manager.
            </div>
          )}
        </div>
        <div className="accent-line mb-8" />

        {error && (
          <div className="card mb-6" style={{ borderColor: "rgba(244,63,94,0.3)", background: "rgba(244,63,94,0.06)" }}>
            <p className="text-sm" style={{ color: "#fb7185" }}><Icon name="warning" className="mr-2" /> {error}</p>
          </div>
        )}

        {loading && <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>Loading…</div>}

        {!loading && orgs.length === 0 && !error && (
          <div className="card text-center py-16">
            <div className="text-4xl mb-4"><Icon name="apartment" size="lg" /></div>
            <p className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>No organizations yet</p>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>Create your first client account</p>
            {canCreate ? (
              <button
                className="btn btn-primary"
                onClick={() => { setEditingOrg(null); setShowModal(true); }}
              >
                + New Organization
              </button>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Contact a manager to request an organization invite.
              </p>
            )}
          </div>
        )}

        {orgs.length > 0 && (
          <div className="card animate-slide-up" style={{ padding: 0, overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Assigned Agent</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((org) => (
                  <tr
                    key={org.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => router.push(`/organizations/${org.id}`)}
                  >
                    <td>
                      <Link
                        href={`/organizations/${org.id}`}
                        className="font-semibold hover:underline"
                        style={{ color: "var(--text-primary)" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {org.name}
                      </Link>
                    </td>
                    <td><StatusBadge value={org.status} /></td>
                    <td>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {org.assigned_agent_id
                          ? (agentMap[org.assigned_agent_id] ?? org.assigned_agent_id.slice(0, 8) + "…")
                          : <span style={{ color: "var(--text-muted)" }}>Unassigned</span>}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                        {new Date(org.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <Link
                          href={`/organizations/${org.id}`}
                          className="btn btn-ghost"
                          style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          View →
                        </Link>
                        {canCreate && (
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingOrg(org);
                              setShowModal(true);
                            }}
                          >
                            Edit
                          </button>
                        )}
                        {user?.role === "SUPER_ADMIN" && (
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem", color: "#ef4444" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(org);
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <OrgModal
            org={editingOrg}
            onClose={() => { setShowModal(false); setEditingOrg(null); }}
            onSaved={fetchOrgs}
          />
        )}
      </main>
    </div>
  );
}
