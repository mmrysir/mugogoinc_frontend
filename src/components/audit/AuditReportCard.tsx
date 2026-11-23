"use client";

import { AuditReport } from "@/lib/api";

function grade(score: number): { label: string; color: string } {
  if (score >= 90) return { label: "Excellent", color: "var(--accent-emerald)" };
  if (score >= 70) return { label: "Good", color: "var(--accent-emerald)" };
  if (score >= 50) return { label: "Fair", color: "var(--accent-amber)" };
  if (score >= 30) return { label: "Needs Work", color: "var(--accent-amber)" };
  return { label: "Critical", color: "var(--accent-amber)" };
}

export default function AuditReportCard({ report }: { report: AuditReport }) {
  const overall = report.overall_score ?? 0;
  const g = grade(overall);
  const pillars = report.pillars || [];
  const passed = report.scores?.passed_count ?? pillars.reduce((a, p) => a + (p.checks || []).filter((c) => c.passed).length, 0);
  const total = report.scores?.total_count ?? pillars.reduce((a, p) => a + (p.checks || []).length, 0);
  const failing = pillars.filter((p) => (p.score ?? 0) < 50).map((p) => p.name);

  return (
    <div
      className="rounded-2xl p-6 shadow-md-2 mb-6"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
      }}
    >
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
            {g.label}
          </div>
        </div>

        {/* Details */}
        <div className="flex-1">
          <h2 className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            {report.business_name} — Marketing Health Report Card
          </h2>
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
            {report.url} · {report.industry || "General"}
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
