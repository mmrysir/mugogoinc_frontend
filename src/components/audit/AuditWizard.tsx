"use client";

import { useState } from "react";
import { api, AuditReport } from "@/lib/api";

const INDUSTRIES = [
  "Hospitality",
  "SaaS",
  "Retail",
  "Professional Services",
  "Healthcare",
  "Education",
  "E-commerce",
  "Other",
];

const STEPS = ["Website", "Industry", "Contact"] as const;

export default function AuditWizard({
  onComplete,
}: {
  onComplete: (report: AuditReport) => void;
}) {
  const [step, setStep] = useState(0);
  const [url, setUrl] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [auditing, setAuditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canNextStep0 = url.trim().length > 0 && businessName.trim().length > 0;

  const runAudit = async () => {
    setAuditing(true);
    setError(null);
    try {
      const report = await api.audit.run({
        url: url.trim(),
        business_name: businessName.trim(),
        email: email.trim(),
        industry,
      });
      onComplete(report);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Audit failed. Please try again.");
    } finally {
      setAuditing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-6">
        {STEPS.map((label, idx) => (
          <div key={label} className="flex-1 flex items-center">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
              style={{
                background: idx <= step ? "var(--accent-blue)" : "var(--bg-elevated)",
                color: idx <= step ? "#fff" : "var(--text-secondary)",
              }}
            >
              {idx + 1}
            </div>
            <span
              className="ml-2 text-xs font-medium"
              style={{ color: idx <= step ? "var(--text-primary)" : "var(--text-muted)" }}
            >
              {label}
            </span>
            {idx < STEPS.length - 1 && (
              <div
                className="h-0.5 flex-1 mx-3 rounded-full"
                style={{ background: idx < step ? "var(--accent-blue)" : "var(--bg-elevated)" }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 — URL + Business Name */}
      {step === 0 && (
        <div className="rounded-2xl p-6 shadow-md-1" style={{ background: "var(--bg-card)" }}>
          <h2 className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            Scan your website
          </h2>
          <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
            Tell us the URL of your business website and we&apos;ll run a free marketing health
            check.
          </p>
          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
            Website URL
          </label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://yourwebsite.com"
            className="w-full rounded-xl px-3 py-2 mb-4 text-sm outline-none"
            style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          />
          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
            Business Name
          </label>
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Safari Dreams Resort"
            className="w-full rounded-xl px-3 py-2 mb-6 text-sm outline-none"
            style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          />
          <button
            disabled={!canNextStep0}
            onClick={() => setStep(1)}
            className="w-full rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--accent-blue)" }}
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 2 — Industry */}
      {step === 1 && (
        <div className="rounded-2xl p-6 shadow-md-1" style={{ background: "var(--bg-card)" }}>
          <h2 className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            What industry is your business?
          </h2>
          <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
            Used to tailor the tracking &amp; funnel recommendations.
          </p>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full rounded-xl px-3 py-2 mb-6 text-sm outline-none"
            style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          >
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="flex-1 rounded-xl py-2.5 text-sm font-semibold" style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}>
              Back
            </button>
            <button onClick={() => setStep(2)} className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white" style={{ background: "var(--accent-blue)" }}>
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Contact (unlock results) */}
      {step === 2 && (
        <div className="rounded-2xl p-6 shadow-md-1" style={{ background: "var(--bg-card)" }}>
          <h2 className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            Unlock your free audit report
          </h2>
          <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
            Enter your details and we&apos;ll email the full multi-pillar report + booking CTA.
          </p>
          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
            Full Name
          </label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-xl px-3 py-2 mb-3 text-sm outline-none" style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
            Email
          </label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl px-3 py-2 mb-3 text-sm outline-none" style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
            WhatsApp Number (optional)
          </label>
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full rounded-xl px-3 py-2 mb-6 text-sm outline-none" style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 rounded-xl py-2.5 text-sm font-semibold" style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}>
              Back
            </button>
            <button
              disabled={!fullName.trim() || !email.trim() || !whatsapp.trim()}
              onClick={runAudit}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--accent-blue)" }}
            >
              {auditing ? "Scanning..." : "Run Free Audit"}
            </button>
          </div>
          {error && <p className="mt-3 text-sm" style={{ color: "var(--accent-amber)" }}>{error}</p>}
        </div>
      )}
    </div>
  );
}
