"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  api,
  BusinessUnit,
  Organization,
  Lead,
  KeywordIdea,
  ScrapedMetadata,
  AuthUser,
} from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import { RouteTypeBadge, StatusBadge, ChannelBadge } from "@/components/Badges";
import Icon from "@/components/Icon";
import { SearchableMultiSelect } from "@/components/ui/SearchableMultiSelect";
import { REGION_PRESETS, AVAILABLE_LOCATIONS, AVAILABLE_LANGUAGES } from "@/constants/regions";

// ── Helpers ───────────────────────────────────────────────────────────────────

function ProfileRow({
  icon,
  label,
  value,
  mono = false,
  empty = "Not set",
  action,
}: {
  icon: string;
  label: string;
  value?: string | null;
  mono?: boolean;
  empty?: string;
  action?: React.ReactNode;
}) {
  let parsedJson: Record<string, string> | null = null;
  if (value && value.trim().startsWith("{")) {
    try {
      parsedJson = JSON.parse(value);
    } catch {
      parsedJson = null;
    }
  }

  return (
    <div className="flex items-start gap-3 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
      <span
        className="material-symbols-outlined text-base mt-0.5 flex-shrink-0"
        style={{ color: "var(--accent-blue)" }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between mb-0.5">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            {label}
          </div>
          {action}
        </div>
        {parsedJson && Object.keys(parsedJson).length > 0 ? (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {Object.entries(parsedJson).map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border transition-colors hover:opacity-80"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              >
                <span className="capitalize">{platform}</span>
                <span className="material-symbols-outlined text-xs">open_in_new</span>
              </a>
            ))}
          </div>
        ) : value ? (
          <div
            className={`text-sm break-all ${mono ? "font-mono" : ""}`}
            style={{ color: "var(--text-primary)" }}
          >
            {value}
          </div>
        ) : (
          <div className="text-sm italic" style={{ color: "var(--text-muted)" }}>
            {empty}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Edit Business Profile Modal ───────────────────────────────────────────────

function EditProfileModal({
  bu,
  onClose,
  onSaved,
}: {
  bu: BusinessUnit;
  onClose: () => void;
  onSaved: (updated: BusinessUnit) => void;
}) {
  const [primaryUrl, setPrimaryUrl] = useState(bu.primary_url ?? "");
  const [gscSite, setGscSite] = useState(bu.google_search_console_site ?? "");
  const [socialLinks, setSocialLinks] = useState(bu.social_media_links ?? "");
  const [adsId, setAdsId] = useState(bu.google_ads_customer_id ?? "");
  const [waNumber, setWaNumber] = useState(bu.owner_whatsapp_number);
  const [ownerEmail, setOwnerEmail] = useState(bu.owner_email);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const updated = await api.businessUnits.updateProfile(bu.id, {
        primary_url: primaryUrl || null,
        google_search_console_site: gscSite || null,
        social_media_links: socialLinks || null,
        google_ads_customer_id: adsId || null,
        owner_whatsapp_number: waNumber,
        owner_email: ownerEmail,
      });
      onSaved(updated);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-box"
        style={{ maxWidth: 560 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Edit Business Profile
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {bu.name}
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: "0.35rem 0.75rem" }}>
            <Icon name="close" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Website */}
          <div>
            <label className="form-label">Primary Website URL</label>
            <input
              className="form-input"
              value={primaryUrl}
              onChange={(e) => setPrimaryUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          {/* GSC */}
          <div>
            <label className="form-label">Google Search Console Property</label>
            <input
              className="form-input"
              value={gscSite}
              onChange={(e) => setGscSite(e.target.value)}
              placeholder="https://example.com  or  sc-domain:example.com"
            />
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Must be a verified property in your GSC account.
            </p>
          </div>

          {/* Social */}
          <div>
            <label className="form-label">Social Media Links</label>
            <textarea
              className="form-input"
              rows={3}
              value={socialLinks}
              onChange={(e) => setSocialLinks(e.target.value)}
              placeholder={`instagram: https://instagram.com/brand\nfacebook: https://facebook.com/brand`}
              style={{ resize: "vertical", fontFamily: "inherit" }}
            />
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Enter one profile per line. These are stored as-is for reference.
            </p>
          </div>

          {/* Ads */}
          <div>
            <label className="form-label">Google Ads Customer ID</label>
            <input
              className="form-input font-mono"
              value={adsId}
              onChange={(e) => setAdsId(e.target.value)}
              placeholder="123-456-7890"
            />
          </div>

          {/* WhatsApp */}
          <div>
            <label className="form-label">Owner WhatsApp Number (E.164)</label>
            <input
              className="form-input font-mono"
              value={waNumber}
              onChange={(e) => setWaNumber(e.target.value)}
              placeholder="+254712345678"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="form-label">Owner Email</label>
            <input
              className="form-input"
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder="owner@business.com"
              required
            />
          </div>

          {error && <p className="text-sm" style={{ color: "#fb7185" }}>{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-ghost flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? "Saving…" : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Lead row ─────────────────────────────────────────────────────────────────

function LeadRow({ lead }: { lead: Lead }) {
  return (
    <tr>
      <td>
        <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
          {lead.is_blurred ? lead.full_name : lead.full_name}
        </div>
        <div className="text-xs font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>
          {lead.phone_number}
        </div>
      </td>
      <td><ChannelBadge channel={lead.source_channel} /></td>
      <td>
        <StatusBadge value={lead.delivery_status} />
      </td>
      <td>
        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
          {new Date(lead.last_activity_at).toLocaleString()}
        </div>
      </td>
    </tr>
  );
}

// ── Keyword row ───────────────────────────────────────────────────────────────

function CompetitionDot({ level }: { level: string }) {
  const colors: Record<string, string> = {
    LOW: "#34d399",
    MEDIUM: "#fbbf24",
    HIGH: "#fb7185",
    UNKNOWN: "var(--text-muted)",
  };
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: colors[level] ?? colors.UNKNOWN,
        marginRight: 6,
      }}
    />
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BuCommandCenterPage() {
  const params = useParams();
  const orgId = params.id as string;
  const buId = params.buId as string;

  const [bu, setBu] = useState<BusinessUnit | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [keywords, setKeywords] = useState<KeywordIdea[]>([]);
  const [keywordsLoading, setKeywordsLoading] = useState(false);
  const [keywordError, setKeywordError] = useState("");
  const [keywordSeeds, setKeywordSeeds] = useState("");
  const [negativeKeywords, setNegativeKeywords] = useState("");
  const [scrapedData, setScrapedData] = useState<ScrapedMetadata | null>(null);
  const [scrapingLoading, setScrapingLoading] = useState(false);
  const [keywordLocations, setKeywordLocations] = useState<string[]>(["Kenya"]);
  const [keywordLanguages, setKeywordLanguages] = useState<string[]>(["English"]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [webhookCopied, setWebhookCopied] = useState(false);
  const [discoveringSocials, setDiscoveringSocials] = useState(false);
  const [socialSuccessMessage, setSocialSuccessMessage] = useState("");

  const handleDiscoverSocials = async () => {
    if (!bu) return;
    if (!bu.primary_url && !bu.google_search_console_site) {
      alert("Please configure a Primary Website or Google Search Console property first.");
      return;
    }
    setDiscoveringSocials(true);
    setSocialSuccessMessage("");
    try {
      const res = await api.businessUnits.discoverSocials(buId);
      const count = Object.keys(res.social_media_links || {}).length;
      if (res.raw_social_links_str) {
        setBu((prev) => (prev ? { ...prev, social_media_links: res.raw_social_links_str } : prev));
      }
      setSocialSuccessMessage(
        count > 0 ? `Found ${count}!` : "None found"
      );
      setTimeout(() => setSocialSuccessMessage(""), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Social discovery failed");
    } finally {
      setDiscoveringSocials(false);
    }
  };

  const canEdit = user?.role === "SUPER_ADMIN" || user?.role === "MANAGER";

  const ingestUrl = `https://worker.mugogoinc.com/ingest/${buId}`;
  const snippetCode = `<!-- Mugogo Lead Tracking Snippet -->
<script>
  window.MUGOGO_BU_ID = "${buId}";
  (function(w,d,s){
    var j=d.createElement(s); j.async=true;
    j.src="https://worker.mugogoinc.com/tracker.js";
    d.head.appendChild(j);
  })(window,document,"script");
</script>`;

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [buData, orgData, leadsData, userData] = await Promise.all([
        api.businessUnits.get(buId),
        api.organizations.get(orgId),
        api.leads.list({ business_unit_id: buId, limit: 20 }),
        api.auth.me().catch(() => null),
      ]);
      setBu(buData);
      setOrg(orgData);
      setLeads(leadsData.items);
      setLeadsTotal(leadsData.total);
      setUser(userData);

      // Auto-fetch scraped metadata from client website if primary_url is configured
      if (buData.primary_url) {
        setScrapingLoading(true);
        api.marketing
          .scrapePreview(buData.primary_url)
          .then((preview) => {
            setScrapedData(preview);
            if (preview.success && preview.suggested_seeds && preview.suggested_seeds.length > 0) {
              setKeywordSeeds((prev) => (prev ? prev : preview.suggested_seeds.join("\n")));
            }
          })
          .catch(() => {})
          .finally(() => setScrapingLoading(false));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load Business Unit.");
    } finally {
      setLoading(false);
    }
  }, [buId, orgId]);

  useEffect(() => {
    const t = setTimeout(fetchData, 0);
    return () => clearTimeout(t);
  }, [fetchData]);

  const copyBuId = () => {
    navigator.clipboard.writeText(buId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(snippetCode);
    setWebhookCopied(true);
    setTimeout(() => setWebhookCopied(false), 2000);
  };


  const runKeywords = async () => {
    if (!bu) return;
    setKeywordsLoading(true);
    setKeywordError("");
    try {
      const seeds = keywordSeeds
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const negatives = negativeKeywords
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const result = await api.marketing.searchKeywords(
        seeds,
        keywordLocations,
        keywordLanguages,
        bu.primary_url ?? undefined,
        buId,
        undefined,
        negatives,
      );
      setKeywords(result.keywords);
    } catch (err: unknown) {
      setKeywordError(err instanceof Error ? err.message : "Keyword fetch failed");
    } finally {
      setKeywordsLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">

        {/* ── Breadcrumb ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-2 text-xs animate-fade-in" style={{ color: "var(--text-muted)" }}>
          <Link href="/organizations" style={{ color: "var(--text-muted)" }}>Organizations</Link>
          <span>›</span>
          <Link href={`/organizations/${orgId}`} style={{ color: "var(--text-muted)" }}>
            {org?.name ?? orgId.slice(0, 8) + "…"}
          </Link>
          <span>›</span>
          <span style={{ color: "var(--text-primary)" }}>{bu?.name ?? "Business Unit"}</span>
        </div>

        {loading && (
          <div className="text-center py-20" style={{ color: "var(--text-muted)" }}>Loading…</div>
        )}

        {error && (
          <div className="card mb-6" style={{ borderColor: "rgba(244,63,94,0.3)", background: "rgba(244,63,94,0.06)" }}>
            <p className="text-sm" style={{ color: "#fb7185" }}>
              <Icon name="warning" className="mr-2" /> {error}
            </p>
          </div>
        )}

        {bu && (
          <>
            {/* ── Page Header ───────────────────────────────────────────────── */}
            <div className="flex items-start justify-between mb-8 animate-fade-in">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                    {bu.name}
                  </h1>
                  <RouteTypeBadge type={bu.route_type} />
                </div>
                <p className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                  {bu.id}
                </p>
              </div>
              <div className="flex gap-2">
                {canEdit && (
                  <button
                    id="edit-bu-profile-btn"
                    className="btn btn-primary"
                    onClick={() => setShowEditModal(true)}
                  >
                    <Icon name="edit" size="sm" />
                    Edit Profile
                  </button>
                )}
                <Link
                  href={`/leads?business_unit_id=${buId}`}
                  className="btn btn-ghost"
                >
                  <Icon name="bolt" size="sm" />
                  All Leads
                </Link>
              </div>
            </div>
            <div className="accent-line mb-8" />

            {/* ── Main Grid ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* ── LEFT COLUMN: Profile + Ingestion ────────────────────────── */}
              <div className="space-y-6">

                {/* Business Profile Card */}
                <div className="card animate-fade-in">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-base" style={{ color: "var(--accent-blue)" }}>
                      business
                    </span>
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                      Business Profile
                    </h2>
                  </div>

                  <ProfileRow icon="language" label="Primary Website" value={bu.primary_url} />
                  <ProfileRow
                    icon="search"
                    label="Google Search Console"
                    value={bu.google_search_console_site}
                    mono
                    empty="Not configured"
                  />
                  <ProfileRow
                    icon="campaign"
                    label="Google Ads Customer ID"
                    value={bu.google_ads_customer_id}
                    mono
                    empty="Not configured"
                  />
                  <ProfileRow
                    icon="share"
                    label="Social Media Links"
                    value={bu.social_media_links}
                    empty="Not configured"
                    action={
                      canEdit && (
                        <button
                          type="button"
                          onClick={handleDiscoverSocials}
                          disabled={discoveringSocials}
                          className="text-2xs px-2 py-0.5 rounded border flex items-center gap-1 transition-all"
                          style={{
                            borderColor: "var(--border)",
                            background: "var(--bg-elevated)",
                            color: discoveringSocials ? "var(--text-muted)" : "var(--accent-blue)",
                            cursor: discoveringSocials ? "wait" : "pointer",
                          }}
                          title="Auto-discover official social profiles from verified website / GSC"
                        >
                          <span
                            className={`material-symbols-outlined text-xs ${
                              discoveringSocials ? "animate-spin" : ""
                            }`}
                          >
                            {discoveringSocials ? "refresh" : "bolt"}
                          </span>
                          {discoveringSocials ? "Discovering…" : socialSuccessMessage || "Auto-Discover"}
                        </button>
                      )
                    }
                  />
                  <ProfileRow icon="smartphone" label="Owner WhatsApp" value={bu.owner_whatsapp_number} mono />
                  <ProfileRow icon="email" label="Owner Email" value={bu.owner_email} />

                  {bu.route_type === "ENTERPRISE" && bu.webhook_url && (
                    <ProfileRow icon="link" label="CRM Webhook URL" value={bu.webhook_url} mono />
                  )}

                  <div className="pt-3 mt-1">
                    <div className="flex gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                      <span>Target:</span>
                      <span className="font-mono">{bu.target_country ?? "2404"}</span>
                      <span>/</span>
                      <span className="font-mono">{bu.target_language ?? "1000"}</span>
                    </div>
                  </div>
                </div>

                {/* Lead Ingestion & Tracking Widget */}
                <div
                  className="card animate-fade-in"
                  style={{ borderColor: "rgba(6,182,212,0.25)", background: "rgba(6,182,212,0.04)" }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-base" style={{ color: "#06b6d4" }}>
                      track_changes
                    </span>
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                      Lead Ingestion &amp; Tracking
                    </h2>
                  </div>

                  {/* BU ID Copy */}
                  <div className="mb-4">
                    <div className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                      Business Unit ID
                    </div>
                    <div
                      className="flex items-center gap-2 p-2.5 rounded-xl font-mono text-xs"
                      style={{ background: "var(--bg-elevated)" }}
                    >
                      <span className="flex-1 truncate" style={{ color: "var(--text-primary)" }}>
                        {buId}
                      </span>
                      <button
                        id="copy-bu-id-btn"
                        onClick={copyBuId}
                        className="btn btn-ghost"
                        style={{ padding: "0.2rem 0.6rem", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                      >
                        <Icon name={copied ? "check" : "content_copy"} size="sm" />
                        {copied ? "Copied!" : "Copy ID"}
                      </button>
                    </div>
                  </div>

                  {/* Ingest URL */}
                  <div className="mb-4">
                    <div className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                      Ingest Endpoint
                    </div>
                    <div
                      className="p-2.5 rounded-xl font-mono text-xs break-all"
                      style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
                    >
                      POST {ingestUrl}
                    </div>
                  </div>

                  {/* Tracking Snippet */}
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                      Tracking Snippet
                    </div>
                    <pre
                      className="text-xs rounded-xl p-3 overflow-x-auto"
                      style={{
                        background: "var(--bg-elevated)",
                        color: "var(--text-secondary)",
                        fontFamily: "'JetBrains Mono', monospace",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-all",
                      }}
                    >
                      {snippetCode}
                    </pre>
                    <button
                      id="copy-snippet-btn"
                      onClick={copyWebhook}
                      className="btn btn-ghost w-full mt-2"
                      style={{ fontSize: "0.8rem" }}
                    >
                      <Icon name={webhookCopied ? "check" : "content_copy"} size="sm" />
                      {webhookCopied ? "Snippet Copied!" : "📋 Copy Tracking Snippet"}
                    </button>
                  </div>
                </div>

                {/* ── Google Search Console Card (below Lead Ingestion) ────── */}
                {bu.google_search_console_site ? (
                  <div
                    className="card animate-fade-in"
                    style={{ borderColor: "rgba(245,158,11,0.2)", background: "rgba(245,158,11,0.04)" }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-base" style={{ color: "#fbbf24" }}>
                        travel_explore
                      </span>
                      <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                        Google Search Console
                      </h2>
                      <span
                        style={{
                          background: "rgba(245,158,11,0.15)",
                          color: "#fbbf24",
                          borderRadius: "9999px",
                          padding: "0.1rem 0.55rem",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                        }}
                      >
                        Coming Soon
                      </span>
                    </div>
                    <div
                      className="p-3 rounded-xl font-mono text-xs"
                      style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
                    >
                      {bu.google_search_console_site}
                    </div>
                    <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
                      GSC OAuth connection is being built. Once connected, Clicks, Impressions,
                      CTR, and Average Position will appear here, grouped by query and page.
                    </p>
                  </div>
                ) : (
                  <div
                    className="card animate-fade-in"
                    style={{ borderColor: "rgba(107,114,128,0.2)", background: "rgba(107,114,128,0.03)" }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-base" style={{ color: "var(--text-muted)" }}>
                        travel_explore
                      </span>
                      <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                        Google Search Console
                      </h2>
                    </div>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      No GSC property configured. Edit the Business Profile to add a verified Search Console property.
                    </p>
                    {canEdit && (
                      <button
                        className="btn btn-ghost mt-3"
                        style={{ fontSize: "0.8rem" }}
                        onClick={() => setShowEditModal(true)}
                      >
                        <Icon name="edit" size="sm" />
                        Add GSC Property
                      </button>
                    )}
                  </div>
                )}

              </div>

              {/* ── RIGHT COLUMNS: Leads + Keywords ─────────────────────────── */}
              <div className="lg:col-span-2 space-y-6">

                {/* Recent Leads Feed */}
                <div className="card animate-slide-up" style={{ padding: 0, overflow: "hidden" }}>
                  <div
                    className="flex items-center justify-between px-5 py-4 border-b"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base" style={{ color: "var(--accent-blue)" }}>
                        bolt
                      </span>
                      <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                        Recent Leads
                      </h2>
                      <span
                        style={{
                          background: "rgba(6,182,212,0.14)",
                          color: "#06b6d4",
                          borderRadius: "9999px",
                          padding: "0.1rem 0.55rem",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                        }}
                      >
                        {leadsTotal} total
                      </span>
                    </div>
                    <Link
                      href={`/leads?business_unit_id=${buId}`}
                      className="btn btn-ghost"
                      style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}
                    >
                      View All →
                    </Link>
                  </div>

                  {leads.length === 0 ? (
                    <div className="py-12 text-center" style={{ color: "var(--text-muted)" }}>
                      <Icon name="bolt" size="lg" />
                      <p className="mt-2 text-sm">No leads yet. Embed the tracking snippet to start capturing.</p>
                    </div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Lead</th>
                          <th>Channel</th>
                          <th>Status</th>
                          <th>Activity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads.map((lead) => (
                          <LeadRow key={lead.id} lead={lead} />
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* BU-Scoped Keyword Tool */}
                <div className="card animate-slide-up">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-base" style={{ color: "var(--accent-blue)" }}>
                      manage_search
                    </span>
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                        Keyword Planner
                      </h2>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        Pre-filled with this BU's URL and Ads account
                      </p>
                    </div>
                  </div>

                  {/* Pre-filled context pills */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {bu.primary_url && (
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-mono"
                        style={{ background: "rgba(6,182,212,0.1)", color: "#06b6d4" }}
                      >
                        🌐 {bu.primary_url}
                      </span>
                    )}
                    {bu.google_ads_customer_id && (
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-mono"
                        style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa" }}
                      >
                        📊 Ads ID: {bu.google_ads_customer_id}
                      </span>
                    )}
                    <span
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80" }}
                    >
                      📍 {keywordLocations.length === 1 ? keywordLocations[0] : `${keywordLocations.length} Countries`}
                    </span>
                    <span
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24" }}
                    >
                      🌐 {keywordLanguages.length === 1 ? keywordLanguages[0] : `${keywordLanguages.length} Languages`}
                    </span>
                    {!bu.primary_url && !bu.google_ads_customer_id && (
                      <span className="text-xs italic" style={{ color: "var(--text-muted)" }}>
                        Edit the Business Profile to pre-fill URL and Ads account.
                      </span>
                    )}
                  </div>

                  {/* Scraped Website Intelligence Card */}
                  {bu.primary_url && (
                    <div
                      className="p-3.5 mb-4 rounded-xl border text-xs animate-fade-in"
                      style={{
                        background: "var(--bg-elevated)",
                        borderColor: "var(--border)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold flex items-center gap-1.5" style={{ color: "var(--accent-blue)" }}>
                          <Icon name="travel_explore" size="sm" />
                          Website Scraped Intelligence
                        </span>
                        <div className="flex items-center gap-2">
                          {scrapingLoading && (
                            <span className="text-2xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                              <span className="material-symbols-outlined text-xs animate-spin">refresh</span>
                              Scanning…
                            </span>
                          )}
                          {scrapedData?.suggested_seeds && scrapedData.suggested_seeds.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setKeywordSeeds(scrapedData.suggested_seeds.join("\n"));
                              }}
                              className="btn btn-ghost"
                              style={{ padding: "0.2rem 0.55rem", fontSize: "0.72rem" }}
                              title="Load suggested seed phrases into the text area"
                            >
                              ⚡ Auto-fill Seeds ({scrapedData.suggested_seeds.length})
                            </button>
                          )}
                        </div>
                      </div>

                      {scrapedData?.success ? (
                        <div className="space-y-1.5">
                          {scrapedData.title && (
                            <div>
                              <span className="font-medium" style={{ color: "var(--text-muted)" }}>Title: </span>
                              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{scrapedData.title}</span>
                            </div>
                          )}
                          {scrapedData.meta_description && (
                            <div>
                              <span className="font-medium" style={{ color: "var(--text-muted)" }}>Description: </span>
                              <span style={{ color: "var(--text-secondary)" }}>{scrapedData.meta_description}</span>
                            </div>
                          )}
                          {scrapedData.headings && scrapedData.headings.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              <span className="font-medium self-center mr-1" style={{ color: "var(--text-muted)" }}>Headings:</span>
                              {scrapedData.headings.slice(0, 4).map((h, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded text-2xs font-mono"
                                  style={{
                                    background: "rgba(6,182,212,0.1)",
                                    color: "var(--accent-cyan)",
                                    border: "1px solid rgba(6,182,212,0.2)",
                                  }}
                                >
                                  {h}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : scrapingLoading ? (
                        <p style={{ color: "var(--text-muted)" }}>Fetching title and metadata from {bu.primary_url}…</p>
                      ) : (
                        <p style={{ color: "var(--text-muted)" }}>
                          Domain metadata will be fed into the Google Ads engine during keyword analysis.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Multi-Region & Multi-Language Searchable Pickers */}
                  <div className="mb-4 space-y-4">
                    <SearchableMultiSelect
                      id="keyword-location-picker"
                      label="Target Locations"
                      options={AVAILABLE_LOCATIONS}
                      selected={keywordLocations}
                      onChange={setKeywordLocations}
                      presets={REGION_PRESETS}
                      presetField="countries"
                      accentColor="#22d3ee"
                      accentBg="rgba(6,182,212,0.15)"
                      placeholder="Search country…"
                    />
                    <SearchableMultiSelect
                      id="keyword-language-picker"
                      label="Languages"
                      options={AVAILABLE_LANGUAGES}
                      selected={keywordLanguages}
                      onChange={setKeywordLanguages}
                      presets={REGION_PRESETS}
                      presetField="languages"
                      accentColor="#c084fc"
                      accentBg="rgba(168,85,247,0.12)"
                      placeholder="Search language…"
                    />
                  </div>

                  {/* Seed Keywords & Negative Keywords Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="form-label flex items-center justify-between">
                        <span>Seed Keywords (one per line)</span>
                        <span className="text-2xs font-normal" style={{ color: "var(--text-muted)" }}>Include phrases</span>
                      </label>
                      <textarea
                        id="seed-keywords-input"
                        className="form-input"
                        rows={4}
                        value={keywordSeeds}
                        onChange={(e) => setKeywordSeeds(e.target.value)}
                        placeholder={"safari packages kenya\nnairobi day trips\nluxury lodge"}
                        style={{ resize: "vertical" }}
                      />
                    </div>
                    <div>
                      <label className="form-label flex items-center justify-between">
                        <span className="flex items-center gap-1 font-semibold" style={{ color: "#fb7185" }}>
                          <Icon name="block" size="sm" /> Negative Keywords (exclude)
                        </span>
                        <span className="text-2xs font-normal" style={{ color: "#fb7185" }}>Filtered out</span>
                      </label>
                      <textarea
                        id="negative-keywords-input"
                        className="form-input"
                        rows={4}
                        value={negativeKeywords}
                        onChange={(e) => setNegativeKeywords(e.target.value)}
                        placeholder={"free\ncheap\ndownload\ncrack\njobs"}
                        style={{
                          resize: "vertical",
                          borderColor: "rgba(244,63,94,0.35)",
                        }}
                      />
                    </div>
                  </div>

                  {keywordError && (
                    <p className="text-sm mb-3" style={{ color: "#fb7185" }}>
                      {keywordError}
                    </p>
                  )}

                  <button
                    id="run-keywords-btn"
                    onClick={runKeywords}
                    disabled={keywordsLoading}
                    className="btn btn-primary w-full mb-4"
                  >
                    {keywordsLoading ? (
                      <>
                        <span className="animate-spin material-symbols-outlined text-base">refresh</span>
                        Fetching…
                      </>
                    ) : (
                      <>
                        <Icon name="manage_search" size="sm" />
                        Run Keyword Analysis
                      </>
                    )}
                  </button>

                  {keywords.length > 0 && (
                    <div style={{ overflowX: "auto" }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Keyword</th>
                            <th>Volume / mo</th>
                            <th>Competition</th>
                            <th>Bid Range (USD)</th>
                            <th>Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {keywords.map((kw) => (
                            <tr key={kw.keyword}>
                              <td>
                                <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                                  {kw.keyword}
                                </span>
                              </td>
                              <td>
                                <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                                  {kw.monthly_search_volume.toLocaleString()}
                                </span>
                              </td>
                              <td>
                                <span className="text-xs">
                                  <CompetitionDot level={kw.competition} />
                                  {kw.competition}
                                </span>
                              </td>
                              <td>
                                <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                                  ${kw.low_top_of_page_bid_usd} – ${kw.high_top_of_page_bid_usd}
                                </span>
                              </td>
                              <td>
                                <div className="flex items-center gap-1.5">
                                  <div
                                    style={{
                                      width: `${kw.opportunity_score}%`,
                                      maxWidth: 60,
                                      height: 4,
                                      borderRadius: 2,
                                      background:
                                        kw.opportunity_score >= 70
                                          ? "#34d399"
                                          : kw.opportunity_score >= 40
                                          ? "#fbbf24"
                                          : "#fb7185",
                                    }}
                                  />
                                  <span className="text-xs font-mono">{kw.opportunity_score}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Edit Profile Modal ─────────────────────────────────────────────── */}
        {showEditModal && bu && (
          <EditProfileModal
            bu={bu}
            onClose={() => setShowEditModal(false)}
            onSaved={(updated) => {
              setBu(updated);
              setShowEditModal(false);
            }}
          />
        )}
      </main>
    </div>
  );
}
