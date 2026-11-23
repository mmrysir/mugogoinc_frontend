"use client";

import { useState, useEffect } from "react";
import { api, AuditRunResponse, BusinessUnit } from "@/lib/api";
import Icon from "@/components/Icon";

interface AuditCardProps {
  orgId: string;
  bu: BusinessUnit;
  onEditProfile?: () => void;
  userRole?: string;
  leadsTotal?: number;
}

export default function AuditCard({ orgId, bu, onEditProfile, userRole, leadsTotal }: AuditCardProps) {
  const buId = bu.id;
  const [history, setHistory] = useState<Array<{ id: number; created_at: string; overall_score: number; grade: string; score_delta: number | null }>>([]);
  const [latestAudit, setLatestAudit] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAgentView, setShowAgentView] = useState(userRole === "SUPER_ADMIN" || userRole === "MANAGER" || userRole === "AGENT");

  const isAgent = userRole === "SUPER_ADMIN" || userRole === "MANAGER" || userRole === "AGENT";

  useEffect(() => {
    let active = true;
    api.businessUnitAudit
      .list(orgId, buId)
      .then((h) => {
        if (active) {
          setHistory(h);
          if (h.length > 0) {
            api.businessUnitAudit
              .get(orgId, buId, h[0].id)
              .then((a) => { if (active) setLatestAudit(a); })
              .catch(() => {});
          }
        }
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [orgId, buId]);

  const runAudit = async () => {
    setRunning(true);
    setError(null);
    try {
      const result = await api.businessUnitAudit.run(orgId, buId, { save_to_profile: true });
      const h = await api.businessUnitAudit.list(orgId, buId);
      setHistory(h);
      const detail = await api.businessUnitAudit.get(orgId, buId, result.id);
      setLatestAudit(detail);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Audit failed. Please try again.");
    } finally {
      setRunning(false);
    }
  };

  const hasProfile = !!(bu.website_url || bu.primary_url) && !!bu.city;

  const scoreColor = (score: number) =>
    score >= 70 ? "var(--accent-emerald)" : score >= 40 ? "var(--accent-amber)" : "var(--accent-amber)";

  return (
    <div className="card animate-slide-up" style={{ padding: "1.5rem" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="fact_check" size="lg" />
          <h3 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
            Marketing Health Audit
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {isAgent && latestAudit && (
            <button
              onClick={() => setShowAgentView(!showAgentView)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
            >
              {showAgentView ? "Client View" : "Agent View"}
            </button>
          )}
          <button
            onClick={onEditProfile}
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
          >
            Edit Details
          </button>
        </div>
      </div>

      {/* Profile banner if missing */}
      {!hasProfile && (
        <div
          className="mb-4 rounded-xl p-4"
          style={{ background: "rgba(179,38,30,0.08)", border: "1px solid var(--accent-amber)" }}
        >
          <p className="text-sm font-medium" style={{ color: "var(--accent-amber)" }}>
            ⚠️ Complete your audit profile to run a diagnostic.
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Add a website URL and primary city to enable the 6-pillar marketing health audit.
          </p>
          <button
            onClick={onEditProfile}
            className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-full text-white"
            style={{ background: "var(--accent-blue)" }}
          >
            Complete Profile
          </button>
        </div>
      )}

      {/* 4-KPI strip */}
      {latestAudit && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="p-3 rounded-lg border flex items-center gap-2" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
            <div className="text-lg">🛡️</div>
            <div>
              <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Health Score</p>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                {Math.round(latestAudit.overall_score)}/100 ({latestAudit.grade})
              </p>
            </div>
          </div>
          <div className="p-3 rounded-lg border flex items-center gap-2" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
            <div className="text-lg">⭐</div>
            <div>
              <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Google Rating</p>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                {latestAudit.agent_diagnostic?.metrics?.google_rating
                  ? `${latestAudit.agent_diagnostic.metrics.google_rating}★ (${latestAudit.agent_diagnostic.metrics.google_reviews ?? 0} reviews)`
                  : "Not Linked"}
              </p>
            </div>
          </div>
          <div className="p-3 rounded-lg border flex items-center gap-2" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
            <div className="text-lg">📈</div>
            <div>
              <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Total Leads</p>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{leadsTotal ?? 0} Leads</p>
            </div>
          </div>
          <div className="p-3 rounded-lg border flex items-center gap-2" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
            <div className="text-lg">🔗</div>
            <div>
              <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Integrations</p>
              <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                {latestAudit.agent_diagnostic?.gbp_profile?.name ? "GBP Connected" : "GBP Pending"} · {bu.gsc_connected ? "GSC Connected" : "GSC Pending"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Score progression header */}
      {latestAudit && (
        <div className="mb-4 rounded-xl p-4" style={{ background: "var(--bg-elevated)" }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold" style={{ color: scoreColor(latestAudit.overall_score) }}>
                {Math.round(latestAudit.overall_score)}
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>/100</span>
              </div>
              <div className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                Grade {latestAudit.grade}
              </div>
            </div>
            <div className="text-right">
              {latestAudit.client_summary?.score_delta != null && (
                <div
                  className="text-sm font-bold"
                  style={{
                    color: latestAudit.client_summary.score_delta >= 0 ? "var(--accent-emerald)" : "var(--accent-amber)",
                  }}
                >
                  {latestAudit.client_summary.score_delta >= 0 ? "+" : ""}
                  {latestAudit.client_summary.score_delta} pts since last audit
                </div>
              )}
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                {history.length} audit{history.length !== 1 ? "s" : ""} run
              </div>
            </div>
          </div>
          {/* History timeline */}
          {history.length > 1 && (
            <div className="mt-3 flex items-end gap-1 h-8">
              {history.slice().reverse().map((h) => {
                const max = Math.max(...history.map((x) => x.overall_score), 1);
                const hPct = Math.max((h.overall_score / max) * 100, 8);
                return (
                  <div
                    key={h.id}
                    className="flex-1 rounded-t"
                    style={{ height: `${hPct}%`, background: "var(--gradient-accent)", opacity: 0.8 }}
                    title={`#${h.id}: ${h.overall_score}`}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Run / Re-run Audit button */}
      <button
        onClick={runAudit}
        disabled={running || !hasProfile}
        className="w-full rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50 mb-4"
        style={{ background: "var(--accent-blue)" }}
      >
        {running ? "Scanning..." : latestAudit ? "Re-run Audit" : "Run Audit"}
      </button>
      {running && (
        <div className="mb-4 flex flex-col items-center py-2">
          <span className="material-symbols-outlined text-2xl mb-1 animate-spin text-[var(--accent-blue)]">refresh</span>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Reading live pages, scanning mobile speed, inspecting ad tags...
          </p>
        </div>
      )}
      {error && <p className="mb-4 text-sm" style={{ color: "var(--accent-amber)" }}>{error}</p>}

      {/* Client View (default for clients) */}
      {latestAudit && !showAgentView && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Online Visibility", value: latestAudit.client_summary?.online_visibility ?? 0 },
              { label: "Reputation & Trust", value: latestAudit.client_summary?.reputation_and_trust ?? 0 },
              { label: "Lead Capture", value: latestAudit.client_summary?.lead_capture ?? 0 },
            ].map((m) => (
              <div key={m.label} className="rounded-xl p-3 text-center" style={{ background: "var(--bg-elevated)" }}>
                <div className="text-lg font-bold" style={{ color: scoreColor(m.value) }}>{Math.round(m.value)}</div>
                <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>{m.label}</div>
              </div>
            ))}
          </div>
          {latestAudit.client_summary?.top_priorities?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                Top Priorities
              </h4>
              <div className="space-y-2">
                {latestAudit.client_summary.top_priorities.map((p: any, i: number) => (
                  <div key={i} className="rounded-xl p-3" style={{ background: "var(--bg-elevated)", borderLeft: "3px solid var(--accent-amber)" }}>
                    <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{p.title}</div>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{p.evidence}</p>
                    {p.impact && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{p.impact}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={() => (window.location.href = "mailto:hello@mugogoinc.com?subject=" + encodeURIComponent("Marketing audit follow-up — " + bu.name))}
            className="w-full rounded-xl py-2.5 text-sm font-semibold text-white"
            style={{ background: "var(--accent-blue)" }}
          >
            Request Mugogo Team Implementation
          </button>
        </div>
      )}

      {/* Agent Diagnostic View */}
      {latestAudit && showAgentView && latestAudit.agent_diagnostic && (
        <div className="space-y-4">
          <div className="space-y-3">
            {(latestAudit.agent_diagnostic.pillars || []).map((p: any) => (
              <div key={p.name} className="rounded-xl p-4" style={{ background: "var(--bg-elevated)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{p.name}</span>
                  <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                    {p.score}/100 ({p.grade})
                  </span>
                </div>
                <div className="h-1.5 rounded-full mb-2" style={{ background: "var(--bg-base)" }}>
                  <div className="h-full rounded-full" style={{ width: `${p.score}%`, background: "var(--gradient-accent)" }} />
                </div>
                <div className="space-y-1">
                  {(p.checks || []).map((c: any, i: number) => (
                    <div key={i} className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{c.title}</div>
                        {c.evidence && <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>{c.evidence}</div>}
                      </div>
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{
                          background: c.status === "strong" ? "rgba(20,108,46,0.12)" : "rgba(179,38,30,0.12)",
                          color: c.status === "strong" ? "var(--accent-emerald)" : "var(--accent-amber)",
                        }}
                      >
                        {c.status === "strong" ? "STRONG" : c.status === "needs_work" ? "NEEDS WORK" : "PRIORITY"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* Competitor table */}
          {latestAudit.agent_diagnostic.competitors?.length > 0 && (
            <div className="rounded-xl p-4" style={{ background: "var(--bg-elevated)" }}>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                Competitor Map Pack
              </h4>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ color: "var(--text-muted)" }}>
                    <th className="text-left py-1">Name</th>
                    <th className="text-left py-1">Rating</th>
                    <th className="text-left py-1">Reviews</th>
                  </tr>
                </thead>
                <tbody>
                  {latestAudit.agent_diagnostic.competitors.map((c: any, i: number) => (
                    <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                      <td className="py-1" style={{ color: "var(--text-primary)" }}>{c.name}</td>
                      <td className="py-1" style={{ color: "var(--text-secondary)" }}>{c.rating}★</td>
                      <td className="py-1" style={{ color: "var(--text-secondary)" }}>{c.reviews}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Action plan */}
          {latestAudit.agent_diagnostic.action_plan?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                90-Day Action Plan
              </h4>
              <div className="space-y-2">
                {latestAudit.agent_diagnostic.action_plan.slice(0, 8).map((a: any, i: number) => (
                  <div key={i} className="rounded-xl p-3" style={{ background: "var(--bg-elevated)", borderLeft: a.priority === "High Priority" ? "3px solid var(--accent-amber)" : "3px solid var(--accent-blue)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{a.title}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: a.priority === "High Priority" ? "rgba(179,38,30,0.12)" : "rgba(6,182,212,0.12)", color: a.priority === "High Priority" ? "var(--accent-amber)" : "var(--accent-blue)" }}>
                        {a.priority}
                      </span>
                    </div>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{a.evidence}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!latestAudit && !loading && (
        <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
          No audits run yet. Click &quot;Run Audit&quot; to get your first marketing health score.
        </p>
      )}
    </div>
  );
}
