"use client";

import { useState } from "react";
import { api, AuditRunResponse } from "@/lib/api";

const INDUSTRIES = [
  "Hospitality",
  "Hotels & Safari Lodges",
  "Wellness, Spas & Medspas",
  "Restaurants & Cafes",
  "Real Estate & Construction",
  "E-Commerce & Retail",
  "B2B & SaaS",
  "Healthcare & Clinics",
  "Professional Services",
  "Other",
];

const STEPS = ["Website", "Industry", "Contact"] as const;

export default function AuditWizard({
  onComplete,
}: {
  onComplete: (report: AuditRunResponse) => void;
}) {
  const [step, setStep] = useState(0);
  const [url, setUrl] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [primaryCity, setPrimaryCity] = useState("");
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [auditing, setAuditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canNextStep0 = url.trim().length > 0 && businessName.trim().length > 0;

  // Audit history from localStorage
  const [history, setHistory] = useState<number[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("mugogo_audit_history") || "[]");
    } catch {
      return [];
    }
  });

  const runAudit = async () => {
    setAuditing(true);
    setError(null);
    try {
      const result = await api.audit.run({
        url: url.trim(),
        business_name: businessName.trim(),
        primary_city: primaryCity.trim(),
        industry,
        email: email.trim(),
        phone: phone.trim() || undefined,
      });
      if (typeof window !== "undefined") {
        const next = [result.id, ...history.filter((x) => x !== result.id)].slice(0, 10);
        localStorage.setItem("mugogo_audit_history", JSON.stringify(next));
        setHistory(next);
      }
      onComplete(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Audit failed. Please try again.");
    } finally {
      setAuditing(false);
    }
  };

  const loadHistory = async (id: number) => {
    try {
      const r = await api.audit.get(id);
      onComplete(r);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not load audit.");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header quick actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <div className="relative group">
              <button
                className="text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
              >
                Audit History ({history.length})
              </button>
              <div
                className="absolute left-0 top-full mt-1 hidden group-hover:block rounded-xl shadow-md-2 p-2 z-10 min-w-[160px]"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                {history.map((id) => (
                  <button
                    key={id}
                    onClick={() => loadHistory(id)}
                    className="block w-full text-left text-xs py-1.5 px-2 rounded-lg hover:bg-[var(--bg-elevated)]"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Audit #{id}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <a
          href="https://wa.me/254700000000?text=Hi%20Mugogo%2C%20I%20want%20to%20book%20a%20strategy%20call."
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold px-3 py-1.5 rounded-full text-white"
          style={{ background: "#25D366" }}
        >
          WhatsApp Strategy Desk
        </a>
      </div>

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

      {/* Step 1 — URL + Business Name + City */}
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
            className="w-full rounded-xl px-3 py-2 mb-4 text-sm outline-none"
            style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          />
          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
            Market / Primary City
          </label>
          <input
            value={primaryCity}
            onChange={(e) => setPrimaryCity(e.target.value)}
            placeholder="e.g. Zanzibar, Nairobi, Mombasa"
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
            Used to tailor tracking &amp; funnel recommendations and benchmark competitors.
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
            WhatsApp / Phone Number
          </label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl px-3 py-2 mb-2 text-sm outline-none" style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
          <p className="text-xs mb-6" style={{ color: "var(--text-muted)" }}>
            Usually takes 30–60 seconds. We scan your live pages, test mobile speed, and benchmark local Google rankings.
          </p>
          {auditing && (
            <div className="mb-6 flex flex-col items-center py-4" data-testid="audit-loading">
              <span className="material-symbols-outlined text-4xl mb-3 animate-spin text-[var(--accent-blue)]">refresh</span>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Reading live pages, scanning mobile speed, inspecting ad tags...
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 rounded-xl py-2.5 text-sm font-semibold" style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}>
              Back
            </button>
            <button
              disabled={!fullName.trim() || !email.trim()}
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
