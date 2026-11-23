"use client";

import { AuditRunResponse } from "@/lib/api";

function grade(score: number): { label: string; color: string } {
  if (score >= 90) return { label: "A+", color: "var(--accent-emerald)" };
  if (score >= 80) return { label: "A", color: "var(--accent-emerald)" };
  if (score >= 70) return { label: "B", color: "var(--accent-emerald)" };
  if (score >= 60) return { label: "C", color: "var(--accent-amber)" };
  if (score >= 50) return { label: "D", color: "var(--accent-amber)" };
  return { label: "F", color: "var(--accent-amber)" };
}

export default function AuditReportCard({ report }: { report: AuditRunResponse }) {
  const rd = report.report_data || {};
  const overall = rd.scores?.overall ?? report.overall_score ?? 0;
  const g = grade(overall);
  const scores = rd.scores || {};
  const passed = scores.passed_count ?? 0;
  const total = scores.total_count ?? 0;
  const pillars = rd.pillars || [];
  const failing = pillars.filter((p: any) => (p.score ?? 0) < 50).map((p: any) => p.name);

  return (
    <div
      className="rounded-2xl p-6 shadow-md-2 mb-6"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
      }}
    >
      {/* 4-KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="p-3 rounded-lg border flex items-center gap-2" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
          <div className="text-lg">🛡️</div>
          <div>
            <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Health Score</p>
            <p className="text-sm font-bold" style={{ color: g.color }}>
              {Math.round(overall)}/100 ({g.label})
            </p>
          </div>
        </div>
        <div className="p-3 rounded-lg border flex items-center gap-2" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
          <div className="text-lg">⭐</div>
          <div>
            <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Google Rating</p>
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              {rd.metrics?.google_rating ? `${rd.metrics.google_rating}★ (${rd.metrics.google_reviews ?? 0} reviews)` : "Not Linked"}
            </p>
          </div>
        </div>
        <div className="p-3 rounded-lg border flex items-center gap-2" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
          <div className="text-lg">✅</div>
          <div>
            <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Checks Passed</p>
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              {passed}/{total}
            </p>
          </div>
        </div>
        <div className="p-3 rounded-lg border flex items-center gap-2" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
          <div className="text-lg">⚠️</div>
          <div>
            <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Priority Gaps</p>
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              {scores.priority_count ?? 0}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-6">
        {/* Score ring */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center"
            style={{
              background: `conic-gradient(${g.color} ${Math.round(overall * 3.6)}deg, var(--bg-elevated) 0deg)`,
            }}
          >
            <div
              className="w-24 h-24 rounded-full flex flex-col items-center justify-center"
              style={{ background: "var(--bg-card)" }}
            >
              <div className="text-3xl font-bold" style={{ color: g.color }}>
                {Math.round(overall)}
              </div>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                /100
              </div>
            </div>
          </div>
          <div className="mt-2 text-sm font-semibold" style={{ color: g.color }}>
            Grade {g.label}
          </div>
        </div>

        {/* Details */}
        <div className="flex-1">
          <h2 className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            {report.business_name} — Marketing Health Report Card
          </h2>
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
            {report.target_url} · {report.industry || rd.industry || "General"}
          </p>
          <div className="flex flex-wrap gap-3 mb-3">
            <span
              className="text-xs font-semibold px-2 py-1 rounded-full"
              style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
            >
              {passed}/{total} checks passed
            </span>
            <span
              className="text-xs font-semibold px-2 py-1 rounded-full"
              style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
            >
              {pillars.length} pillars
            </span>
            <span
              className="text-xs font-semibold px-2 py-1 rounded-full"
              style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
            >
              {scores.priority_count ?? 0} priority gaps
            </span>
          </div>
          {failing.length > 0 && (
            <p className="text-xs" style={{ color: "var(--accent-amber)" }}>
              Needs attention: {failing.join(", ")}
            </p>
          )}
          {failing.length === 0 && pillars.length > 0 && (
            <p className="text-xs" style={{ color: "var(--accent-emerald)" }}>
              All pillars are performing well. Keep optimizing!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
