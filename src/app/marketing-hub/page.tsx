"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Icon from "@/components/Icon";
import { api, KeywordIdea, CampaignMetric } from "@/lib/api";

export default function MarketingHubPage() {
  // Keyword Planner states
  const [seedInput, setSeedInput] = useState("3 day masai mara safari, tax compliance kenya, digital marketing agency");
  const [keywords, setKeywords] = useState<KeywordIdea[]>([]);
  const [searchingKw, setSearchingKw] = useState(false);

  // Campaign Monitor states
  const [campaigns, setCampaigns] = useState<CampaignMetric[]>([
    {
      campaign_name: "Kenya Safari Search Ads (Google)",
      daily_spend_usd: 150.0,
      daily_budget_usd: 150.0,
      leads_count: 2,
      owner_phone: "+254712345678",
    },
    {
      campaign_name: "Meta Retargeting Lead Gen",
      daily_spend_usd: 45.0,
      daily_budget_usd: 100.0,
      leads_count: 6,
      owner_phone: "+254712345678",
    },
  ]);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [auditing, setAuditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleKeywordSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const seeds = seedInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (seeds.length === 0) return;

    try {
      setSearchingKw(true);
      setError(null);
      const res = await api.marketing.searchKeywords(seeds);
      setKeywords(res.keywords);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Keyword search failed: ${msg}`);
    } finally {
      setSearchingKw(false);
    }
  };

  const handleCheckHealth = async () => {
    try {
      setAuditing(true);
      setError(null);
      const res = await api.marketing.checkCampaignHealth(campaigns);
      setAuditResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Campaign audit failed: ${msg}`);
    } finally {
      setAuditing(false);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            Keyword Research & Ad Campaign Health Monitor
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Google Ads Keyword Planner insights, CPL threshold watcher, and automated WhatsApp alert dispatch.
          </p>
          <div className="accent-line mt-4" />
        </div>

        {error && (
          <div className="card mb-6 animate-fade-in border-rose-500/30 bg-rose-500/10 text-rose-300">
            <p className="text-sm flex items-center gap-2">
              <Icon name="warning" /> {error}
            </p>
          </div>
        )}

        {/* Module 3.1: Google Keyword Planner */}
        <div className="card mb-8 animate-slide-up">
          <h2 className="font-semibold mb-4 text-sm flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
            <Icon name="search" /> GOOGLE KEYWORD PLANNER CONNECTOR
          </h2>
          <form onSubmit={handleKeywordSearch} className="mb-6">
            <label className="block text-xs mb-1 font-medium" style={{ color: "var(--text-muted)" }}>
              Seed Keywords (comma-separated)
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={seedInput}
                onChange={(e) => setSeedInput(e.target.value)}
                className="flex-1 px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              />
              <button
                type="submit"
                disabled={searchingKw}
                className="btn btn-primary text-xs font-semibold px-4 py-2 flex items-center gap-2"
              >
                <Icon name="analytics" /> {searchingKw ? "Fetching..." : "Fetch Search Volume"}
              </button>
            </div>
          </form>

          {keywords.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 text-slate-400 uppercase font-mono">
                  <tr>
                    <th className="pb-3 font-medium">Keyword Phrase</th>
                    <th className="pb-3 font-medium">Monthly Searches</th>
                    <th className="pb-3 font-medium">Competition</th>
                    <th className="pb-3 font-medium">Low Bid (USD)</th>
                    <th className="pb-3 font-medium">High Bid (USD)</th>
                    <th className="pb-3 font-medium text-right">Opportunity Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {keywords.map((kw, i) => (
                    <tr key={i} className="hover:bg-slate-900/50">
                      <td className="py-3 font-semibold text-slate-100">{kw.keyword}</td>
                      <td className="py-3 font-mono text-emerald-400">{kw.monthly_search_volume.toLocaleString()}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-2xs font-mono font-bold ${
                            kw.competition === "HIGH"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : kw.competition === "MEDIUM"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {kw.competition}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-slate-300">${kw.low_top_of_page_bid_usd}</td>
                      <td className="py-3 font-mono text-slate-300">${kw.high_top_of_page_bid_usd}</td>
                      <td className="py-3 text-right font-mono font-bold text-teal-400">
                        {kw.opportunity_score} / 100
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Module 3.2: Campaign Health & Budget Burn Monitor */}
        <div className="card animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
              <Icon name="campaign" /> CAMPAIGN BUDGET BURN & CPL MONITOR
            </h2>
            <button
              onClick={handleCheckHealth}
              disabled={auditing}
              className="btn btn-primary text-xs font-semibold px-4 py-2 flex items-center gap-2"
            >
              <Icon name="notifications_active" /> {auditing ? "Auditing..." : "Audit Campaigns & Send Alerts"}
            </button>
          </div>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 text-slate-400 uppercase font-mono">
                <tr>
                  <th className="pb-3 font-medium">Campaign Name</th>
                  <th className="pb-3 font-medium">Daily Spend</th>
                  <th className="pb-3 font-medium">Daily Budget</th>
                  <th className="pb-3 font-medium">Leads Captured</th>
                  <th className="pb-3 font-medium">Calculated CPL</th>
                  <th className="pb-3 font-medium">Burn Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {campaigns.map((c, i) => {
                  const cpl = c.leads_count > 0 ? (c.daily_spend_usd / c.leads_count).toFixed(2) : "N/A";
                  const isExhausted = c.daily_spend_usd >= c.daily_budget_usd * 0.95;
                  const isHighCpl = c.leads_count > 0 && parseFloat(cpl as string) > 15.0;

                  return (
                    <tr key={i} className="hover:bg-slate-900/50">
                      <td className="py-3 font-semibold text-slate-100">{c.campaign_name}</td>
                      <td className="py-3 font-mono text-slate-300">${c.daily_spend_usd.toFixed(2)}</td>
                      <td className="py-3 font-mono text-slate-400">${c.daily_budget_usd.toFixed(2)}</td>
                      <td className="py-3 font-mono text-emerald-400">{c.leads_count}</td>
                      <td className="py-3 font-mono">
                        <span className={isHighCpl ? "text-rose-400 font-bold" : "text-emerald-400"}>
                          ${cpl}
                        </span>
                      </td>
                      <td className="py-3">
                        {isExhausted ? (
                          <span className="px-2 py-0.5 rounded text-2xs font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            BUDGET EXHAUSTED EARLY
                          </span>
                        ) : isHighCpl ? (
                          <span className="px-2 py-0.5 rounded text-2xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            HIGH CPL ALERT
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-2xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            HEALTHY
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Audit Results Log */}
          {auditResult && (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-xs text-slate-300">
              <div className="flex items-center justify-between mb-2 text-emerald-400 font-bold">
                <span>AUDIT LOG SUMMARY ({auditResult.checked_at})</span>
                <span>{auditResult.alerts_count} ALERT(S) TRIGGERED</span>
              </div>
              {auditResult.alerts.map((alt: string, idx: number) => (
                <pre key={idx} className="whitespace-pre-wrap text-slate-300 mb-2 p-3 bg-slate-950/60 rounded border border-slate-800">
                  {alt}
                </pre>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
