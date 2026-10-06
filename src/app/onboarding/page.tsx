"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Icon from "@/components/Icon";
import { api } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SocialInsights {
  brand_name: string;
  niche: string;
  discovered_socials: Record<string, string>;
}

interface WebsiteAnalysis {
  success: boolean;
  url: string;
  title?: string;
  meta_description?: string;
  headings?: string[];
  error?: string;
}

interface KeywordOpportunity {
  keyword: string;
  monthly_search_volume: number;
  competition: "LOW" | "MEDIUM" | "HIGH";
  low_top_of_page_bid_usd: number;
  high_top_of_page_bid_usd: number;
  opportunity_score?: number;
}

interface OnboardingResult {
  org_id: string;
  website_analysis: WebsiteAnalysis;
  seed_keywords_used: string[];
  keyword_opportunities_count: number;
  top_keywords: KeywordOpportunity[];
  social_insights: SocialInsights;
}

interface OnboardingResponse {
  status: string;
  message: string;
  data: OnboardingResult;
}

// ── Social platform metadata ───────────────────────────────────────────────────

const PLATFORM_META: Record<string, { icon: string; color: string; label: string }> = {
  "instagram.com":  { icon: "photo_camera",    color: "#E1306C", label: "Instagram"  },
  "tiktok.com":     { icon: "music_video",      color: "#69C9D0", label: "TikTok"    },
  "twitter.com":    { icon: "tag",              color: "#1DA1F2", label: "X / Twitter" },
  "facebook.com":   { icon: "groups",           color: "#1877F2", label: "Facebook"  },
  "youtube.com":    { icon: "play_circle",      color: "#FF0000", label: "YouTube"   },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [orgId, setOrgId]           = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState<OnboardingResult | null>(null);
  const [error, setError]           = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId.trim() || !websiteUrl.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"}/onboarding/analyze-entity`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("mugogo_access_token") || ""}`,
          },
          body: JSON.stringify({
            org_id: orgId.trim(),
            website_url: websiteUrl.trim(),
            customer_id: customerId.trim() || undefined,
          }),
        }
      );

      if (!res.ok) {
        const raw = await res.text();
        let detail = raw;
        try { detail = JSON.parse(raw).detail; } catch { /* non-JSON */ }
        throw new Error(`API ${res.status}: ${detail}`);
      }

      const json: OnboardingResponse = await res.json();
      setResult(json.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const competitionBadge = (level: string) => {
    const map: Record<string, string> = {
      HIGH:   "bg-rose-500/10 text-rose-400 border-rose-500/20",
      MEDIUM: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      LOW:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    };
    return `px-2 py-0.5 rounded text-2xs font-mono font-bold border ${map[level] ?? map.LOW}`;
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">

        {/* ── Header ── */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            Client Onboarding &amp; Intelligence Engine
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Paste a client's website URL to instantly scrape SEO context, discover their social footprint, and generate live Google Ads keyword demand — in seconds.
          </p>
          <div className="accent-line mt-4" />
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="card mb-6 animate-fade-in border-rose-500/30 bg-rose-500/10 text-rose-300 py-3">
            <p className="text-sm flex items-center gap-2">
              <Icon name="warning" /> {error}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ── Left: Input Form ── */}
          <div className="xl:col-span-1">
            <div className="card animate-slide-up">
              <h2 className="font-semibold mb-4 text-sm flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                <Icon name="add_business" /> NEW CLIENT ONBOARDING
              </h2>
              <form onSubmit={handleAnalyze} className="space-y-4">
                <div>
                  <label className="block text-xs mb-1 font-medium" style={{ color: "var(--text-muted)" }}>
                    Organization ID <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={orgId}
                    onChange={(e) => setOrgId(e.target.value)}
                    placeholder="e.g. org_abc123"
                    required
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1 font-medium" style={{ color: "var(--text-muted)" }}>
                    Client Website URL <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://clientwebsite.co.ke"
                    required
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1 font-medium" style={{ color: "var(--text-muted)" }}>
                    Google Ads Customer ID <span className="text-slate-500">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    placeholder="123-456-7890"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full text-xs font-semibold px-4 py-3 flex items-center justify-center gap-2 mt-2"
                >
                  <Icon name={loading ? "hourglass_top" : "travel_explore"} />
                  {loading ? "Analyzing Client…" : "Run Full Analysis"}
                </button>
              </form>

              {/* ── What this does ── */}
              <div className="mt-6 p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">What This Does</p>
                {[
                  { icon: "language",    text: "Scrapes SEO title, meta description & headings" },
                  { icon: "search",      text: "Fetches live Google Ads keyword demand" },
                  { icon: "share",       text: "Discovers social profiles via Google index" },
                  { icon: "save",        text: "Saves profile to ClientMarketingChannel DB" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                    <span className="material-symbols-outlined text-emerald-500 text-sm leading-none mt-0.5">{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: Results Panel ── */}
          <div className="xl:col-span-2 space-y-6">

            {/* Loading shimmer */}
            {loading && (
              <div className="card animate-pulse space-y-4">
                <div className="h-4 w-1/3 bg-slate-800 rounded" />
                <div className="h-3 w-2/3 bg-slate-800 rounded" />
                <div className="h-3 w-1/2 bg-slate-800 rounded" />
                <div className="h-24 bg-slate-800 rounded-xl" />
              </div>
            )}

            {!loading && !result && (
              <div className="card flex flex-col items-center justify-center py-16 text-center animate-fade-in">
                <span className="material-symbols-outlined text-5xl text-slate-700 mb-4">add_business</span>
                <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  Enter a client's details on the left and run the analysis.
                </p>
                <p className="text-xs mt-1 text-slate-600">Results will appear here instantly.</p>
              </div>
            )}

            {result && (
              <>
                {/* ── Website Analysis Card ── */}
                <div className="card animate-fade-in">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-sm flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                      <Icon name="language" /> WEBSITE ANALYSIS
                    </h2>
                    <span className={`text-xs px-2 py-1 rounded-full font-mono border ${result.website_analysis.success ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"}`}>
                      {result.website_analysis.success ? "✓ Scraped" : "✗ Failed"}
                    </span>
                  </div>
                  {result.website_analysis.success ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-slate-500 font-mono uppercase mb-1">Page Title</p>
                        <p className="text-sm font-semibold text-slate-100">{result.website_analysis.title || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-mono uppercase mb-1">Meta Description</p>
                        <p className="text-sm text-slate-300">{result.website_analysis.meta_description || "—"}</p>
                      </div>
                      {result.website_analysis.headings && result.website_analysis.headings.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 font-mono uppercase mb-2">Top Headings</p>
                          <div className="flex flex-wrap gap-2">
                            {result.website_analysis.headings.map((h, i) => (
                              <span key={i} className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {h}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-slate-500 font-mono uppercase mb-2">Seed Keywords Used</p>
                        <div className="flex flex-wrap gap-2">
                          {result.seed_keywords_used.map((s, i) => (
                            <span key={i} className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-rose-400">{result.website_analysis.error}</p>
                  )}
                </div>

                {/* ── Social Discovery Card ── */}
                <div className="card animate-fade-in">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-sm flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                      <Icon name="share" /> SOCIAL FOOTPRINT DISCOVERY
                    </h2>
                    <span className="text-xs px-2 py-1 rounded-full font-mono border bg-slate-800 text-slate-400 border-slate-700">
                      {Object.keys(result.social_insights.discovered_socials).length} found
                    </span>
                  </div>
                  {Object.keys(result.social_insights.discovered_socials).length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No public social profiles discovered for this brand.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(result.social_insights.discovered_socials).map(([platform, url]) => {
                        const meta = PLATFORM_META[platform] ?? { icon: "link", color: "#94a3b8", label: platform };
                        return (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-600 transition-colors group"
                          >
                            <span
                              className="material-symbols-outlined text-xl leading-none flex-shrink-0"
                              style={{ color: meta.color }}
                            >
                              {meta.icon}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-200">{meta.label}</p>
                              <p className="text-xs text-slate-500 truncate group-hover:text-slate-300 transition-colors">{url}</p>
                            </div>
                            <span className="material-symbols-outlined text-xs text-slate-600 ml-auto group-hover:text-slate-400">open_in_new</span>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── Keyword Opportunities Card ── */}
                <div className="card animate-fade-in">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-sm flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                      <Icon name="analytics" /> KEYWORD OPPORTUNITIES
                    </h2>
                    <span className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-full font-mono border border-emerald-500/20">
                      {result.keyword_opportunities_count} total
                    </span>
                  </div>
                  {result.top_keywords.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No keyword data available. Check Google Ads credentials.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="border-b border-slate-800 text-slate-400 uppercase font-mono">
                          <tr>
                            <th className="pb-3 font-medium">Keyword Phrase</th>
                            <th className="pb-3 font-medium">Monthly Vol.</th>
                            <th className="pb-3 font-medium">Competition</th>
                            <th className="pb-3 font-medium">Low Bid</th>
                            <th className="pb-3 font-medium">High Bid</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {result.top_keywords.map((kw, i) => (
                            <tr key={i} className="hover:bg-slate-900/50">
                              <td className="py-3 font-semibold text-slate-100">{kw.keyword}</td>
                              <td className="py-3 font-mono text-emerald-400">{kw.monthly_search_volume.toLocaleString()}</td>
                              <td className="py-3">
                                <span className={competitionBadge(kw.competition)}>{kw.competition}</span>
                              </td>
                              <td className="py-3 font-mono text-slate-300">${kw.low_top_of_page_bid_usd}</td>
                              <td className="py-3 font-mono text-slate-300">${kw.high_top_of_page_bid_usd}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
