"use client";

import { useState } from "react";
import AuditWizard from "@/components/audit/AuditWizard";
import AuditReportView from "@/components/audit/AuditReportView";
import { AuditReport } from "@/lib/api";

export default function AuditLandingPage() {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [showReport, setShowReport] = useState(false);

  const handleComplete = (r: AuditReport) => {
    setReport(r);
    setShowReport(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (showReport && report) {
    return (
      <div className="min-h-screen py-12 px-4" style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => setShowReport(false)}
            className="text-sm font-medium mb-6 underline"
            style={{ color: "var(--accent-blue)" }}
          >
            ← Run another audit
          </button>
          <h1 className="text-3xl font-bold mb-2">Your Marketing Health Report</h1>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            {report.business_name} · {report.url}
          </p>
          <AuditReportView report={report} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>
      <div className="max-w-3xl mx-auto text-center mb-10">
        <span className="badge badge-active text-xs px-3 py-1 shadow-md-1 inline-block mb-6">
          Free Marketing Audit
        </span>
        <h1 className="text-4xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
          Is your website leaving money on the table?
        </h1>
        <p className="text-base mb-8" style={{ color: "var(--text-secondary)" }}>
          Get a free, instant multi-pillar digital marketing health score — Technical SEO, tracking
          pixels, conversion funnels and local presence — plus a personalized fix plan.
        </p>
        <div
          className="rounded-2xl p-8 shadow-md-1 text-left animate-fade-in"
          style={{ background: "var(--bg-card)" }}
        >
          <AuditWizard onComplete={handleComplete} />
        </div>
      </div>
    </div>
  );
}
