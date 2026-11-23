"use client";

import { AuditReport } from "@/lib/api";
import AuditReportCard from "@/components/audit/AuditReportCard";

export default function AuditReportView({
  report,
}: {
  report: AuditReport;
}) {
  const pillars = report.pillars || [];
  const overall = report.overall_score ?? 0;

  const bookCall = () => {
    const subject = encodeURIComponent(`Marketing audit follow-up — ${report.business_name}`);
    const body = encodeURIComponent(
      `Hi Mugogo,\n\nI just ran your free marketing audit for ${report.url}.\nOverall score: ${overall}/100\nPillars:\n${pillars
        .map((p) => `- ${p.name}: ${p.score}`)
        .join("\n")}\n\nBook a strategy call: https://engine.mugogoinc.com/organizations`
    );
    window.location.href = `mailto:hello@mugogoinc.com?subject=${subject}&body=${body}`;
  };

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

      {/* Pillars */}
      <div className="space-y-4">
        {pillars.map((pillar) => (
          <div key={pillar.name} className="rounded-2xl p-6 shadow-md-1" style={{ background: "var(--bg-card)" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>{pillar.name}</h3>
              <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                {Math.round(pillar.score)}/100
              </span>
            </div>
            <div className="h-2 rounded-full mb-4" style={{ background: "var(--bg-elevated)" }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${pillar.score}%`, background: "var(--gradient-accent)" }}
              />
            </div>
            <div className="space-y-2">
              {(pillar.checks || []).map((check) => (
                <div key={check.name} className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {check.name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </div>
                    {check.detail && (
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{check.detail}</div>
                    )}
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: check.passed ? "rgba(20,108,46,0.12)" : "rgba(179,38,30,0.12)",
                      color: check.passed ? "var(--accent-emerald)" : "var(--accent-amber)",
                    }}
                  >
                    {check.passed ? "PASS" : "FAIL"}
                  </span>
                </div>
              ))}
              {(!pillar.checks || pillar.checks.length === 0) && (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>No detailed checks recorded.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
