"use client";

import { AuditRunResponse } from "@/lib/api";
import AuditReportCard from "@/components/audit/AuditReportCard";

const STATUS_COLORS: Record<string, string> = {
  strong: "var(--accent-emerald)",
  needs_work: "var(--accent-amber)",
  priority: "var(--accent-amber)",
};

const STATUS_LABELS: Record<string, string> = {
  strong: "STRONG",
  needs_work: "NEEDS WORK",
  priority: "PRIORITY",
};

export default function AuditReportView({
  report,
}: {
  report: AuditRunResponse;
}) {
  const rd = report.report_data || {};
  const pillars = rd.pillars || [];
  const scores = rd.scores || {};
  const metrics = rd.metrics || {};
  const competitors = rd.competitors || [];
  const actionPlan = rd.action_plan || [];
  const gbp = rd.gbp_profile || {};
  const overall = rd.scores?.overall ?? report.overall_score ?? 0;
  const grade = rd.grade || "F";

  const bookCall = () => {
    const subject = encodeURIComponent(`Marketing audit follow-up — ${report.business_name}`);
    const body = encodeURIComponent(
      `Hi Mugogo,\n\nI just ran your free marketing audit for ${report.target_url}.\nOverall score: ${overall}/100 (Grade ${grade})\n\nPillars:\n${pillars
        .map((p: any) => `- ${p.name}: ${p.score}/100 (${p.grade})`)
        .join("\n")}\n\nBook a strategy call: https://engine.mugogoinc.com/organizations`
    );
    window.location.href = `mailto:hello@mugogoinc.com?subject=${subject}&body=${body}`;
  };

  const priorityGaps = actionPlan.filter((a: any) => a.priority === "High Priority").slice(0, 4);
  const quickWins = actionPlan.filter((a: any) => a.priority === "Quick Win").slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Report card (score + summary) */}
      <AuditReportCard report={report} />

      {/* CTA */}
      <button
        onClick={bookCall}
        className="w-full rounded-xl py-3 text-sm font-semibold text-white"
        style={{ background: "var(--accent-blue)" }}
      >
        Let Mugogo Inc fix these gaps — Book a Strategy Call
      </button>

      {/* Score by Area */}
      <div className="rounded-2xl p-6 shadow-md-1" style={{ background: "var(--bg-card)" }}>
        <h3 className="font-bold mb-4" style={{ color: "var(--text-primary)" }}>Score by Area</h3>
        <div className="space-y-3">
          {pillars.map((p: any) => (
            <div key={p.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{p.name}</span>
                <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                  {p.score}/100 ({p.grade})
                </span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "var(--bg-elevated)" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${p.score}%`, background: "var(--gradient-accent)" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What It Is Costing You — Priority Gaps */}
      {priorityGaps.length > 0 && (
        <div className="rounded-2xl p-6 shadow-md-1" style={{ background: "var(--bg-card)" }}>
          <h3 className="font-bold mb-4" style={{ color: "var(--text-primary)" }}>
            What It Is Costing You — Priority Gaps
          </h3>
          <div className="space-y-3">
            {priorityGaps.map((a: any, i: number) => (
              <div
                key={i}
                className="rounded-xl p-4"
                style={{ background: "var(--bg-elevated)", borderLeft: "4px solid var(--accent-amber)" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{a.title}</span>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(179,38,30,0.12)", color: "var(--accent-amber)" }}
                  >
                    {a.priority}
                  </span>
                </div>
                <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{a.evidence}</p>
                {a.impact && (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{a.impact}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Google Maps & Competitor Benchmark */}
      {(gbp?.name || competitors.length > 0) && (
        <div className="rounded-2xl p-6 shadow-md-1" style={{ background: "var(--bg-card)" }}>
          <h3 className="font-bold mb-4" style={{ color: "var(--text-primary)" }}>
            Google Maps &amp; Competitor Benchmark
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="rounded-xl p-3 text-center" style={{ background: "var(--bg-elevated)" }}>
              <div className="text-lg font-bold" style={{ color: "var(--accent-blue)" }}>
                {metrics.google_rating ?? "—"}★
              </div>
              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>Your Rating</div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: "var(--bg-elevated)" }}>
              <div className="text-lg font-bold" style={{ color: "var(--accent-blue)" }}>
                {metrics.google_reviews ?? "—"}
              </div>
              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>Your Reviews</div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: "var(--bg-elevated)" }}>
              <div className="text-lg font-bold" style={{ color: "var(--accent-blue)" }}>
                {metrics.maps_rank ? `#${metrics.maps_rank}` : "—"}
              </div>
              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>Maps Rank</div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: "var(--bg-elevated)" }}>
              <div className="text-lg font-bold" style={{ color: "var(--accent-blue)" }}>
                {metrics.competitor_median_reviews ?? "—"}
              </div>
              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>Competitor Median</div>
            </div>
          </div>
          {competitors.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ color: "var(--text-muted)" }}>
                    <th className="text-left py-2">Competitor</th>
                    <th className="text-left py-2">Rating</th>
                    <th className="text-left py-2">Reviews</th>
                    <th className="text-left py-2">Address</th>
                  </tr>
                </thead>
                <tbody>
                  {competitors.map((c: any, i: number) => (
                    <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                      <td className="py-2" style={{ color: "var(--text-primary)" }}>{c.name}</td>
                      <td className="py-2" style={{ color: "var(--text-secondary)" }}>{c.rating}★</td>
                      <td className="py-2" style={{ color: "var(--text-secondary)" }}>{c.reviews}</td>
                      <td className="py-2" style={{ color: "var(--text-muted)" }}>{c.address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 6-Pillar Detailed Breakdown */}
      <div className="space-y-4">
        {pillars.map((p: any) => (
          <div key={p.name} className="rounded-2xl p-6 shadow-md-1" style={{ background: "var(--bg-card)" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>{p.name}</h3>
              <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                {p.score}/100 ({p.grade})
              </span>
            </div>
            <div className="h-2 rounded-full mb-4" style={{ background: "var(--bg-elevated)" }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${p.score}%`, background: "var(--gradient-accent)" }}
              />
            </div>
            <div className="space-y-2">
              {(p.checks || []).map((check: any, idx: number) => (
                <div key={idx} className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {check.title}
                    </div>
                    {check.evidence && (
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{check.evidence}</div>
                    )}
                  </div>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      background:
                        check.status === "strong"
                          ? "rgba(20,108,46,0.12)"
                          : check.status === "needs_work"
                          ? "rgba(179,38,30,0.12)"
                          : "rgba(179,38,30,0.18)",
                      color:
                        check.status === "strong"
                          ? "var(--accent-emerald)"
                          : "var(--accent-amber)",
                    }}
                  >
                    {STATUS_LABELS[check.status] || check.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 90-Day Action Plan */}
      {actionPlan.length > 0 && (
        <div className="rounded-2xl p-6 shadow-md-1" style={{ background: "var(--bg-card)" }}>
          <h3 className="font-bold mb-4" style={{ color: "var(--text-primary)" }}>
            90-Day Prioritized Action Plan
          </h3>
          <div className="space-y-3">
            {actionPlan.slice(0, 12).map((a: any, i: number) => (
              <div
                key={i}
                className="rounded-xl p-4"
                style={{
                  background: "var(--bg-elevated)",
                  borderLeft: a.priority === "High Priority" ? "4px solid var(--accent-amber)" : "4px solid var(--accent-blue)",
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{a.title}</span>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: a.priority === "High Priority" ? "rgba(179,38,30,0.12)" : "rgba(6,182,212,0.12)",
                      color: a.priority === "High Priority" ? "var(--accent-amber)" : "var(--accent-blue)",
                    }}
                  >
                    {a.priority}
                  </span>
                </div>
                <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{a.evidence}</p>
                {a.impact && (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{a.impact}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
