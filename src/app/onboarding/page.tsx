"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

interface OnboardingResultData {
  org_id: string;
  website_analysis: WebsiteAnalysis;
  seed_keywords_used: string[];
  keyword_opportunities_count: number;
  top_keywords: KeywordOpportunity[];
  social_insights: SocialInsights;
}

interface SetupSuccessState {
  org_id: string;
  org_slug: string;
  bu_id: string;
  data: OnboardingResultData;
}

// ── Social platform metadata ───────────────────────────────────────────────────

const PLATFORM_META: Record<string, { icon: string; color: string; label: string }> = {
  instagram: { icon: "photo_camera", color: "#E1306C", label: "Instagram" },
  tiktok: { icon: "music_video", color: "#69C9D0", label: "TikTok" },
  x: { icon: "tag", color: "#1DA1F2", label: "X / Twitter" },
  facebook: { icon: "groups", color: "#1877F2", label: "Facebook" },
  youtube: { icon: "play_circle", color: "#FF0000", label: "YouTube" },
  linkedin: { icon: "work", color: "#0A66C2", label: "LinkedIn" },
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function deriveGscProperty(url: string): string {
  if (!url) return "";
  try {
    const clean = url
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split("/")[0];
    return clean ? `sc-domain:${clean}` : "";
  } catch {
    return "";
  }
}

export default function OnboardingPage() {
  const router = useRouter();

  // Core Form State
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [buName, setBuName] = useState("");
  const [buNameTouched, setBuNameTouched] = useState(false);
  const [ownerWhatsapp, setOwnerWhatsapp] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");

  // Advanced SEO & Channels State (Accordion)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [gscSite, setGscSite] = useState("");
  const [socialLinks, setSocialLinks] = useState("");
  const [targetCountry, setTargetCountry] = useState("2404"); // Kenya
  const [targetLanguage, setTargetLanguage] = useState("1000"); // English

  // Execution State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SetupSuccessState | null>(null);

  // Auto-slugify when org name changes unless user customized slug
  const handleOrgNameChange = (val: string) => {
    setOrgName(val);
    if (!slugTouched) {
      setOrgSlug(slugify(val));
    }
    if (!buNameTouched) {
      setBuName(val ? `${val} - Main` : "");
    }
  };

  const handleWebsiteChange = (val: string) => {
    setWebsiteUrl(val);
    if (!gscSite || gscSite.startsWith("sc-domain:")) {
      setGscSite(deriveGscProperty(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !websiteUrl.trim() || !ownerWhatsapp.trim() || !ownerEmail.trim()) {
      setError("Please fill in all required fields (Name, Website, WhatsApp, and Email).");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const computedSlug = (orgSlug.trim() || slugify(orgName)).trim();

      const res = await api.onboarding.setup({
        org_name: orgName.trim(),
        org_slug: computedSlug,
        website_url: websiteUrl.trim(),
        bu_name: buName.trim() || `${orgName.trim()} - Main`,
        owner_whatsapp_number: ownerWhatsapp.trim(),
        owner_email: ownerEmail.trim(),
        google_ads_customer_id: customerId.trim() || undefined,
        google_search_console_site: gscSite.trim() || undefined,
        social_media_links: socialLinks.trim() || undefined,
        target_country: targetCountry,
        target_language: targetLanguage,
      });

      setSuccess({
        org_id: res.org_id,
        org_slug: res.org_slug,
        bu_id: res.bu_id,
        data: res.data as OnboardingResultData,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const competitionBadge = (level: string) => {
    const map: Record<string, string> = {
      HIGH: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      MEDIUM: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      LOW: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    };
    return `px-2 py-0.5 rounded text-2xs font-mono font-bold border ${map[level] ?? map.LOW}`;
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        {/* ── Page Header ── */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-2 text-xs mb-2" style={{ color: "var(--text-muted)" }}>
            <Link href="/organizations" className="hover:underline">Organizations</Link>
            <span>›</span>
            <span style={{ color: "var(--text-primary)" }}>New Client Onboarding</span>
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            Client Onboarding &amp; Intelligence Wizard
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Register a new client organization, provision their initial lead-delivery business unit, and automatically scan website SEO and Google Ads demand.
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

        {/* ── SUCCESS VIEW: Client Ready & Intelligence Summary ── */}
        {success ? (
          <div className="space-y-6 animate-slide-up">
            <div className="card border-emerald-500/30 bg-emerald-950/20 p-6 rounded-2xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Icon name="verified" size="lg" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold text-slate-100">{orgName}</h2>
                      <span className="px-2 py-0.5 rounded text-2xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        ACTIVE TENANT
                      </span>
                      <span className="px-2 py-0.5 rounded text-2xs font-mono text-slate-400 bg-slate-800 border border-slate-700">
                        slug: {success.org_slug}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Organization and default business unit provisioned atomically. Leads will route to {ownerWhatsapp}.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <Link
                    href={`/organizations/${success.org_id}/business-units/${success.bu_id}`}
                    className="btn btn-primary text-xs font-semibold px-4 py-2.5 flex items-center gap-2"
                  >
                    <Icon name="bolt" size="sm" />
                    Open Command Center →
                  </Link>
                  <Link
                    href={`/organizations/${success.org_id}`}
                    className="btn btn-ghost text-xs font-semibold px-3 py-2.5 flex items-center gap-1"
                  >
                    <Icon name="apartment" size="sm" />
                    View Organization
                  </Link>
                  <button
                    onClick={() => {
                      setSuccess(null);
                      setOrgName("");
                      setOrgSlug("");
                      setWebsiteUrl("");
                      setBuName("");
                      setOwnerWhatsapp("");
                      setOwnerEmail("");
                      setCustomerId("");
                    }}
                    className="btn btn-ghost text-xs font-semibold px-3 py-2.5"
                  >
                    + Onboard Another
                  </button>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Scraped Website Analysis */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                    <Icon name="language" /> WEBSITE ANALYSIS
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-mono border ${success.data?.website_analysis?.success ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                    {success.data?.website_analysis?.success ? "✓ Scraped" : "Notice"}
                  </span>
                </div>
                {success.data?.website_analysis?.success ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-500 font-mono uppercase mb-1">Page Title</p>
                      <p className="text-sm font-semibold text-slate-100">{success.data.website_analysis.title || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-mono uppercase mb-1">Meta Description</p>
                      <p className="text-sm text-slate-300">{success.data.website_analysis.meta_description || "—"}</p>
                    </div>
                    {success.data.website_analysis.headings && success.data.website_analysis.headings.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 font-mono uppercase mb-2">Headings Sample</p>
                        <div className="flex flex-wrap gap-2">
                          {success.data.website_analysis.headings.slice(0, 5).map((h, i) => (
                            <span key={i} className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    Website metadata will be fetched during next automated crawl cycle.
                  </p>
                )}
              </div>

              {/* Social Footprint Discovery */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                    <Icon name="share" /> SOCIAL FOOTPRINT DISCOVERY
                  </h3>
                  <span className="text-xs px-2 py-1 rounded-full font-mono border bg-slate-800 text-slate-400 border-slate-700">
                    {Object.keys(success.data?.social_insights?.discovered_socials || {}).length} found
                  </span>
                </div>
                {Object.keys(success.data?.social_insights?.discovered_socials || {}).length === 0 ? (
                  <p className="text-sm text-slate-500 py-4 text-center">
                    No outbound social links found on homepage. You can configure them in the Command Center.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(success.data.social_insights.discovered_socials).map(([platform, url]) => {
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
                            <p className="text-xs text-slate-500 truncate group-hover:text-slate-300">{url}</p>
                          </div>
                          <span className="material-symbols-outlined text-xs text-slate-600 ml-auto group-hover:text-slate-400">open_in_new</span>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Keyword Opportunities */}
            {success.data?.top_keywords && success.data.top_keywords.length > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                    <Icon name="analytics" /> LIVE GOOGLE ADS KEYWORD OPPORTUNITIES
                  </h3>
                  <span className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-full font-mono border border-emerald-500/20">
                    {success.data.keyword_opportunities_count} ideas found
                  </span>
                </div>
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
                      {success.data.top_keywords.map((kw, i) => (
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
              </div>
            )}
          </div>
        ) : (
          /* ── REGISTRATION FORM VIEW ── */
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Form Column */}
            <div className="xl:col-span-2">
              <div className="card animate-slide-up">
                <div className="flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-emerald-400 text-xl">add_business</span>
                  <h2 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                    Tenant Registration &amp; Provisioning Form
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Step 1: Organization Identity */}
                  <div className="space-y-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 border-b border-slate-800 pb-2">
                      1. Client Organization Details
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs mb-1 font-medium" style={{ color: "var(--text-muted)" }}>
                          Organization / Brand Name <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={orgName}
                          onChange={(e) => handleOrgNameChange(e.target.value)}
                          placeholder="e.g. Beach Holiday Tours"
                          required
                          className="w-full px-3 py-2.5 text-sm rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs mb-1 font-medium" style={{ color: "var(--text-muted)" }}>
                          Organization Slug <span className="text-rose-400">*</span>
                          <span className="text-slate-500 font-normal ml-1">(auto-generated)</span>
                        </label>
                        <input
                          type="text"
                          value={orgSlug}
                          onChange={(e) => {
                            setOrgSlug(e.target.value);
                            setSlugTouched(true);
                          }}
                          placeholder="e.g. beach-holiday-tours"
                          required
                          className="w-full px-3 py-2.5 text-sm rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs mb-1 font-medium" style={{ color: "var(--text-muted)" }}>
                        Client Primary Website URL <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => handleWebsiteChange(e.target.value)}
                        placeholder="https://www.beachholidaytours.com"
                        required
                        className="w-full px-3 py-2.5 text-sm rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        We will scrape meta tags, discover social profiles, and generate live keyword demand from this URL.
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Primary Business Unit & Lead Routing */}
                  <div className="space-y-4 pt-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 border-b border-slate-800 pb-2">
                      2. Default Business Unit &amp; Lead Routing
                    </div>

                    <div>
                      <label className="block text-xs mb-1 font-medium" style={{ color: "var(--text-muted)" }}>
                        Business Unit Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={buName}
                        onChange={(e) => {
                          setBuName(e.target.value);
                          setBuNameTouched(true);
                        }}
                        placeholder="e.g. Beach Holiday Tours - Main"
                        required
                        className="w-full px-3 py-2.5 text-sm rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs mb-1 font-medium" style={{ color: "var(--text-muted)" }}>
                          Owner WhatsApp Number (E.164) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="tel"
                          value={ownerWhatsapp}
                          onChange={(e) => setOwnerWhatsapp(e.target.value)}
                          placeholder="+254712345678"
                          required
                          className="w-full px-3 py-2.5 text-sm rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                        />
                        <p className="text-2xs text-slate-500 mt-1">Instant lead alerts are pushed here.</p>
                      </div>

                      <div>
                        <label className="block text-xs mb-1 font-medium" style={{ color: "var(--text-muted)" }}>
                          Owner Notification Email <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="email"
                          value={ownerEmail}
                          onChange={(e) => setOwnerEmail(e.target.value)}
                          placeholder="director@client.com"
                          required
                          className="w-full px-3 py-2.5 text-sm rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <p className="text-2xs text-slate-500 mt-1">Lead summaries and alerts recipient.</p>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Expandable Advanced SEO / Channels */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center justify-between w-full p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Icon name="tune" size="sm" />
                        Advanced SEO, Google Search Console &amp; Marketing Settings
                      </span>
                      <Icon name={showAdvanced ? "expand_less" : "expand_more"} size="sm" />
                    </button>

                    {showAdvanced && (
                      <div className="p-4 mt-2 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-4 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs mb-1 font-medium text-slate-400">
                              Google Search Console Property
                            </label>
                            <input
                              type="text"
                              value={gscSite}
                              onChange={(e) => setGscSite(e.target.value)}
                              placeholder="sc-domain:example.com or https://example.com"
                              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                            />
                            <p className="text-2xs text-slate-500 mt-1">Auto-derived from website domain.</p>
                          </div>

                          <div>
                            <label className="block text-xs mb-1 font-medium text-slate-400">
                              Google Ads Customer ID (Optional)
                            </label>
                            <input
                              type="text"
                              value={customerId}
                              onChange={(e) => setCustomerId(e.target.value)}
                              placeholder="123-456-7890"
                              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                            />
                            <p className="text-2xs text-slate-500 mt-1">For per-tenant keyword bids &amp; offline CAPI.</p>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs mb-1 font-medium text-slate-400">
                            Manual Social Media Links Override (Optional)
                          </label>
                          <textarea
                            rows={2}
                            value={socialLinks}
                            onChange={(e) => setSocialLinks(e.target.value)}
                            placeholder="instagram: https://instagram.com/handle&#10;facebook: https://facebook.com/handle"
                            className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                          />
                          <p className="text-2xs text-slate-500 mt-0.5">
                            If left empty, social profiles will be automatically extracted from the website footer.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs mb-1 font-medium text-slate-400">Target Country Code</label>
                            <input
                              type="text"
                              value={targetCountry}
                              onChange={(e) => setTargetCountry(e.target.value)}
                              placeholder="2404 (Kenya)"
                              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-xs mb-1 font-medium text-slate-400">Target Language Code</label>
                            <input
                              type="text"
                              value={targetLanguage}
                              onChange={(e) => setTargetLanguage(e.target.value)}
                              placeholder="1000 (English)"
                              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submission Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary w-full text-sm font-semibold px-4 py-3.5 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <span className="animate-spin material-symbols-outlined text-base">refresh</span>
                          Provisioning Tenant &amp; Launching Engine…
                        </>
                      ) : (
                        <>
                          <Icon name="rocket_launch" />
                          Complete Onboarding &amp; Run Analysis
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Explainer Sidebar */}
            <div className="xl:col-span-1 space-y-6">
              <div className="card">
                <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Icon name="info" size="sm" /> WHAT THIS ENGINE DOES
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      icon: "domain",
                      title: "Atomic Tenant Creation",
                      text: "Generates Organization record and default Business Unit in a single transaction with unique slug.",
                    },
                    {
                      icon: "chat",
                      title: "Direct WhatsApp Lead Routing",
                      text: "Configures owner E.164 phone number so captured leads instantly notify the business owner.",
                    },
                    {
                      icon: "language",
                      title: "Live SEO & DOM Extraction",
                      text: "Extracts title, meta description, and official social handles directly from the website homepage.",
                    },
                    {
                      icon: "search",
                      title: "Google Ads Keyword Demand",
                      text: "Feeds scraped titles into Google Ads Keyword Planner to discover real search volume and top bids.",
                    },
                    {
                      icon: "travel_explore",
                      title: "Search Console Alignment",
                      text: "Pre-configures domain property for tracking organic search queries and platform performance.",
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 text-xs text-slate-400">
                      <span className="material-symbols-outlined text-emerald-400 text-base leading-none mt-0.5">
                        {item.icon}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-200">{item.title}</p>
                        <p className="text-2xs text-slate-400 leading-relaxed mt-0.5">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-4 bg-slate-900/40 border border-slate-800">
                <p className="text-xs font-semibold text-slate-300 mb-1">Need to manage existing tenants?</p>
                <p className="text-2xs text-slate-500 mb-3">
                  View, edit, or configure agent assignments for existing clients from the Organizations dashboard.
                </p>
                <Link
                  href="/organizations"
                  className="btn btn-ghost w-full text-xs font-medium py-2 flex items-center justify-center gap-2"
                >
                  <Icon name="apartment" size="sm" /> Go to Organizations
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
