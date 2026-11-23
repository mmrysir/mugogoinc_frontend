"use client";

import { AuditReport } from "@/lib/api";

export default function AuditReportView({
  report,
}: {
  report: AuditReport;
}) {
  const pillars = report.pillars || [];
  const overall = report.overall_score ?? 0;
  const passedChecks = pillars.reduce(
    (acc, p) => acc + (p.checks || []).filter((c) => c.passed).length,
    0
  );
  const totalChecks = pillars.reduce((acc, p) => acc + (p.checks || []).length, 0);

  const scoreColor = overall >= 70 ? "var(--accent-emerald)" : overall >= 40 ? "var(--accent-amber)" : "var(--accent-amber)";

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
      {/* Overall score */}
      <div className="rounded-2xl p-6 shadow-md-1 text-center" style={{ background: "var(--bg-card)" }}>
        <div className="text-5xl font-bold" style={{ color: scoreColor }}>
          {Math.round(overall)}
          <span className="text-lg" style={{ color: "var(--text-muted)" }}>/100</span>
        </div>
        <div className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Overall Marketing Health Score
        </div>
        <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
          {passedChecks}/{totalChecks} diagnostic checks passed
        </p>
        <button
          onClick={bookCall}
          className="mt-5 w-full rounded-xl py-3 text-sm font-semibold text-white"
          style={{ background: "var(--accent-blue)" }}
        >
          Let Mugogo Inc fix these gaps — Book a Strategy Call
        </button>
      </div>

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
