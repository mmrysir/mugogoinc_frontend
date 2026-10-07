"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  api,
  Organization,
  BusinessUnit,
  RouteType,
  OrganizationStats,
  AuthUser,
} from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import { StatusBadge, RouteTypeBadge } from "@/components/Badges";
import Icon from "@/components/Icon";

function AssignAgentCard({
  org,
  currentUser,
  onAssigned,
}: {
  org: Organization;
  currentUser: AuthUser;
  onAssigned: () => void;
}) {
  const [agents, setAgents] = useState<AuthUser[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState(org.assigned_agent_id ?? "");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.users.list("AGENT", true).then(setAgents).catch(() => {});
    setSelectedAgentId(org.assigned_agent_id ?? "");
  }, [org.assigned_agent_id]);

  const canEdit = currentUser.role === "SUPER_ADMIN" || currentUser.role === "MANAGER";
  if (!canEdit) return null;

  const currentAgentName = agents.find((a) => a.id === org.assigned_agent_id)?.name;

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      await api.organizations.assignAgent(org.id, selectedAgentId || null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
      onAssigned();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to assign agent");
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = async () => {
    if (!confirm("Remove agent assignment from this organization?")) return;
    setSaving(true);
    try {
      await api.organizations.assignAgent(org.id, null);
      setSelectedAgentId("");
      onAssigned();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to unassign agent");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card mb-6 animate-fade-in" style={{ borderColor: "rgba(99,102,241,0.2)" }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-base" style={{ color: "var(--accent-blue)" }}>person_pin</span>
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
          Assigned Agent
        </h3>
        {org.assigned_agent_id && (
          <span
            style={{
              background: "rgba(16,185,129,0.12)",
              color: "#34d399",
              borderRadius: "9999px",
              padding: "0.1rem 0.6rem",
              fontSize: "0.72rem",
              fontWeight: 600,
            }}
          >
            ● Active
          </span>
        )}
      </div>

      {org.assigned_agent_id && currentAgentName && (
        <div className="mb-4 p-3 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm" style={{ color: "#34d399" }}>account_circle</span>
            <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{currentAgentName}</span>
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {agents.find((a) => a.id === org.assigned_agent_id)?.email}
          </div>
        </div>
      )}

      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="form-label text-xs">Reassign to Agent</label>
          <select
            className="form-select"
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            disabled={saving}
          >
            <option value="">— Select an approved agent —</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name} · {agent.email}
              </option>
            ))}
          </select>
        </div>
        <button
          className="btn btn-primary"
          style={{ whiteSpace: "nowrap" }}
          disabled={saving || !selectedAgentId || selectedAgentId === org.assigned_agent_id}
          onClick={handleSave}
        >
          {saving ? "Saving…" : success ? "✓ Saved" : "Assign"}
        </button>
        {org.assigned_agent_id && (
          <button
            className="btn btn-ghost"
            style={{ whiteSpace: "nowrap", color: "#fb7185" }}
            disabled={saving}
            onClick={handleUnassign}
          >
            Unassign
          </button>
        )}
      </div>
      {agents.length === 0 && (
        <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
          No approved agents available. Approve agents from Team Management first.
        </p>
      )}
    </div>
  );
}

function BuModal({
  orgId,
  bu,
  onClose,
  onSaved,
}: {
  orgId: string;
  bu?: BusinessUnit | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(bu?.name ?? "");
  const [routeType, setRouteType] = useState<RouteType>(bu?.route_type ?? "EXPRESS");
  const [webhookUrl, setWebhookUrl] = useState(bu?.webhook_url ?? "");
  const [waNumber, setWaNumber] = useState(bu?.owner_whatsapp_number ?? "");
  const [email, setEmail] = useState(bu?.owner_email ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const body = {
        organization_id: orgId,
        name,
        route_type: routeType,
        webhook_url: routeType === "ENTERPRISE" ? webhookUrl : null,
        owner_whatsapp_number: waNumber,
        owner_email: email,
      };
      if (bu) {
        await api.businessUnits.update(bu.id, body);
      } else {
        await api.businessUnits.create(body);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save business unit");
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {bu ? "Edit Business Unit" : "New Business Unit"}
          </h2>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: "0.35rem 0.75rem" }}>
            <Icon name="close" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="form-label">Name *</label>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Downtown Clinic, Westlands Brand" required />
          </div>
          <div>
            <label className="form-label">Route Type</label>
            <select className="form-select" value={routeType}
              onChange={(e) => setRouteType(e.target.value as RouteType)}>
              <option value="EXPRESS">EXPRESS — WhatsApp Push</option>
              <option value="ENTERPRISE">ENTERPRISE — CRM Webhook</option>
            </select>
          </div>
          {routeType === "ENTERPRISE" && (
            <div>
              <label className="form-label">CRM Webhook URL *</label>
              <input className="form-input" value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://crm.example.com/webhook" required />
            </div>
          )}
          <div>
            <label className="form-label">Owner WhatsApp Number (E.164) *</label>
            <input className="form-input" value={waNumber}
              onChange={(e) => setWaNumber(e.target.value)}
              placeholder="+254712345678" required />
          </div>
          <div>
            <label className="form-label">Owner Email *</label>
            <input className="form-input" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@business.com" required />
          </div>
          {error && <p className="text-sm" style={{ color: "#fb7185" }}>{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? (bu ? "Saving…" : "Creating…") : bu ? "Save Changes" : "Create Business Unit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OrgDetailPage() {
  const params = useParams();
  const orgId = params.id as string;

  const [org, setOrg] = useState<Organization | null>(null);
  const [bus, setBus] = useState<BusinessUnit[]>([]);
  const [stats, setStats] = useState<OrganizationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBu, setEditingBu] = useState<BusinessUnit | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canEdit = user?.role === "SUPER_ADMIN" || user?.role === "MANAGER";

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [orgData, buData, statsData, userData] = await Promise.all([
        api.organizations.get(orgId),
        api.businessUnits.list(orgId),
        api.stats.organization(orgId),
        api.auth.me().catch(() => null),
      ]);
      setOrg(orgData);
      setBus(buData.items);
      setStats(statsData);
      setUser(userData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load organization details.");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  const handleDeleteBu = async (bu: BusinessUnit) => {
    if (!window.confirm(`Delete business unit "${bu.name}"?`)) return;
    try {
      await api.businessUnits.delete(bu.id);
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete business unit");
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchData, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="mb-2 animate-fade-in">
          <Link href="/organizations" style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
            ← Organizations
          </Link>
        </div>

        {loading && <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>Loading…</div>}

        {error && (
          <div className="card mb-6" style={{ borderColor: "rgba(244,63,94,0.3)", background: "rgba(244,63,94,0.06)" }}>
            <p className="text-sm" style={{ color: "#fb7185" }}><Icon name="warning" className="mr-2" /> {error}</p>
          </div>
        )}

        {org && (
          <>
            <div className="flex items-center justify-between mb-8 animate-fade-in">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                    {org.name}
                  </h1>
                  <StatusBadge value={org.status} />
                </div>
                <p className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                  {org.id} · {bus.length} business unit{bus.length !== 1 ? "s" : ""}
                </p>
              </div>
              {canEdit && (
                <button
                  id="create-bu-btn"
                  className="btn btn-primary"
                  onClick={() => { setEditingBu(null); setShowModal(true); }}
                >
                  + Business Unit
                </button>
              )}
            </div>
            <div className="accent-line mb-8" />

            {/* Assign Agent Card — visible to admins/managers */}
            {user && (user.role === "SUPER_ADMIN" || user.role === "MANAGER") && (
              <AssignAgentCard org={org} currentUser={user} onAssigned={fetchData} />
            )}

            {stats && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in">
                <div className="kpi-card">
                  <div className="kpi-value">{stats.leads.total}</div>
                  <div className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Total Leads</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-value">{stats.leads.delivered}</div>
                  <div className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Delivered</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-value">{stats.leads.pending}</div>
                  <div className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Pending</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-value" style={{ background: "linear-gradient(135deg,#10b981,#06b6d4)", WebkitBackgroundClip: "text", backgroundClip: "text" }}>
                    {stats.leads.delivery_rate_pct}%
                  </div>
                  <div className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Delivery Rate</div>
                </div>
              </div>
            )}

            {bus.length === 0 ? (
              <div className="card text-center py-16">
                <div className="text-4xl mb-4"><Icon name="place" size="lg" /></div>
                <p className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>No business units</p>
                <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                  Add a branch, brand, or campaign asset to start receiving leads
                </p>
                {canEdit && (
                  <button
                    className="btn btn-primary"
                    onClick={() => { setEditingBu(null); setShowModal(true); }}
                  >
                    + New Business Unit
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-slide-up">
                {bus.map((bu) => (
                  <div key={bu.id} className="card">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold mb-1" style={{ color: "var(--text-primary)" }}>{bu.name}</h3>
                          <RouteTypeBadge type={bu.route_type} />
                        </div>
                        <div className="flex gap-2 flex-wrap justify-end">
                          <Link
                            href={`/organizations/${orgId}/business-units/${bu.id}`}
                            className="btn btn-primary"
                            style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}
                          >
                            Command Center →
                          </Link>
                          <Link
                            href={`/leads?business_unit_id=${bu.id}`}
                            className="btn btn-ghost"
                            style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}
                          >
                            Leads →
                          </Link>
                          {canEdit && (
                            <button
                              type="button"
                              className="btn btn-ghost"
                              style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}
                              onClick={() => { setEditingBu(bu); setShowModal(true); }}
                            >
                              Edit
                            </button>
                          )}
                          {user?.role === "SUPER_ADMIN" && (
                            <button
                              type="button"
                              className="btn btn-ghost"
                              style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem", color: "#ef4444" }}
                              onClick={() => handleDeleteBu(bu)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    <div className="space-y-1.5 mt-3">
                      <div className="flex gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                        <Icon name="smartphone" className="mr-1" />
                        <span className="font-mono">{bu.owner_whatsapp_number}</span>
                      </div>
                      <div className="flex gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                        <Icon name="email" className="mr-1" />
                        <span>{bu.owner_email}</span>
                      </div>
                      {bu.webhook_url && (
                        <div className="flex gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                          <Icon name="link" className="mr-1" />
                          <span className="truncate font-mono">{bu.webhook_url}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t" style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}>
                        <div className="flex gap-2 text-xs">
                          <span className="font-mono" title={bu.id}>{bu.id.slice(0, 16)}…</span>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(bu.id);
                            alert("Business Unit ID copied to clipboard!");
                          }}
                          className="flex items-center gap-1 text-xs transition-colors"
                          style={{ color: "var(--text-primary)" }}
                        >
                          <Icon name="content_copy" size="sm" />
                          <span>Copy ID</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {showModal && (
          <BuModal
            orgId={orgId}
            bu={editingBu}
            onClose={() => { setShowModal(false); setEditingBu(null); }}
            onSaved={fetchData}
          />
        )}
      </main>
    </div>
  );
}
