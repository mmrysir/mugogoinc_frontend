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
import AuditCard from "@/components/audit/AuditCard";
import { RouteTypeBadge, StatusBadge, ChannelBadge } from "@/components/Badges";
import Icon from "@/components/Icon";
import { SearchableMultiSelect } from "@/components/ui/SearchableMultiSelect";
import { REGION_PRESETS, AVAILABLE_LOCATIONS, AVAILABLE_LANGUAGES } from "@/constants/regions";
import BrandIntelligenceCard from "@/components/BrandIntelligenceCard";
import GscMetricsCard from "@/components/GscMetricsCard";

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

// ── Social link (de)serialization ─────────────────────────────────────────────

const SOCIAL_PLATFORM_PATTERNS: Array<[string, RegExp]> = [
  ["instagram", /instagram\.com/i],
  ["facebook", /(facebook\.com|fb\.com)/i],
  ["tiktok", /tiktok\.com/i],
  ["twitter", /(twitter\.com|x\.com)/i],
  ["linkedin", /linkedin\.com/i],
  ["youtube", /(youtube\.com|youtu\.be)/i],
  ["pinterest", /pinterest\.com/i],
  ["threads", /threads\.net/i],
  ["whatsapp", /(wa\.me|whatsapp\.com)/i],
];

function socialPlatformFor(url: string): string {
  const match = SOCIAL_PLATFORM_PATTERNS.find(([, re]) => re.test(url));
  return match ? match[0] : "";
}

/** Turn a stored JSON object (or legacy "platform: url" text) into clean URLs. */
function socialLinksToText(raw: string | null | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      if (parsed && typeof parsed === "object") {
        return Object.values(parsed)
          .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
          .join("\n");
      }
    } catch {
      // fall through to line parsing
    }
  }

  return trimmed
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(/https?:\/\/\S+/);
      return (match ? match[0] : line).trim();
    })
    .filter(Boolean)
    .join("\n");
}

/** Serialize one-URL-per-line input back into the JSON object the app expects. */
function serializeSocialLinks(text: string): string | null {
  const urls = text
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(/https?:\/\/\S+/);
      return (match ? match[0] : line).trim();
    })
    .filter(Boolean);

  if (urls.length === 0) return null;

  const result: Record<string, string> = {};
  urls.forEach((url, index) => {
    const platform = socialPlatformFor(url) || `social_${index + 1}`;
    result[platform] = url;
  });
  return JSON.stringify(result);
}

// ── Edit Business Profile Modal ───────────────────────────────────────────────

function EditProfileModal({
  bu,
  orgId,
  onClose,
  onSaved,
}: {
  bu: BusinessUnit;
  orgId: string;
  onClose: () => void;
  onSaved: (updated: BusinessUnit) => void;
}) {
  const [name, setName] = useState(bu.name);
  const [primaryUrl, setPrimaryUrl] = useState(bu.primary_url ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(bu.website_url ?? bu.primary_url ?? "");
  const [city, setCity] = useState(bu.city ?? "");
  const [industry, setIndustry] = useState(bu.industry ?? "");
  const [phone, setPhone] = useState(bu.phone ?? "");
  const [gscSite, setGscSite] = useState(bu.google_search_console_site ?? "");
  const [placeId, setPlaceId] = useState(bu.google_business_place_id ?? "");
  const [googleMapUrl, setGoogleMapUrl] = useState(bu.google_business_map_url ?? "");
  const [socialLinks, setSocialLinks] = useState(() => socialLinksToText(bu.social_media_links));
  const [adsId, setAdsId] = useState(bu.google_ads_customer_id ?? "");
  const [waNumber, setWaNumber] = useState(bu.owner_whatsapp_number);
  const [ownerEmail, setOwnerEmail] = useState(bu.owner_email);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError("Business name must be at least 2 characters.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const updated = await api.businessUnits.updateOrgProfile(orgId, bu.id, {
        name: name.trim(),
        primary_url: primaryUrl.trim() || null,
        website_url: websiteUrl.trim() || null,
        city: city.trim() || null,
        industry: industry.trim() || null,
        phone: phone.trim() || null,
        google_business_place_id: placeId.trim() || null,
        google_business_map_url: googleMapUrl.trim() || null,
        google_search_console_site: gscSite.trim() || null,
        google_ads_customer_id: adsId.trim() || null,
        owner_whatsapp_number: waNumber.trim(),
        owner_email: ownerEmail.trim(),
        social_media_links: serializeSocialLinks(socialLinks),
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
      <form
        onSubmit={submit}
        className="modal-box flex flex-col w-full max-h-[90vh] overflow-hidden shadow-xl"
        style={{ padding: 0, maxWidth: 672 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div
          className="shrink-0 flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Edit Business Profile
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {bu.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="btn btn-ghost"
            style={{ padding: "0.35rem 0.75rem", fontSize: "1.25rem", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Business Name</label>
              <input
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
              />
            </div>
            <div>
              <label className="form-label">Primary Website URL</label>
              <input
                className="form-input"
                value={primaryUrl}
                onChange={(e) => setPrimaryUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Audit Website URL (optional)</label>
              <input
                className="form-input"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
              />
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Leave blank to use the primary website.
              </p>
            </div>
            <div>
              <label className="form-label">Primary City</label>
              <input
                className="form-input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Zanzibar, Nairobi"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Industry / Category</label>
              <input
                className="form-input"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Wellness, Spas & Medspas"
              />
            </div>
            <div>
              <label className="form-label">Business Phone</label>
              <input
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+255776583434"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Google Places / Place ID</label>
              <input
                className="form-input font-mono"
                value={placeId}
                onChange={(e) => setPlaceId(e.target.value)}
                placeholder="e.g. ChIJN1t_tDeuEmsRUsoyG83frY4"
              />
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Used to query live reviews and ratings via Google Places API.{" "}
                <a
                  href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--accent-blue)", fontWeight: 600 }}
                >
                  Look it up on Google Maps Place ID Finder ↗
                </a>
              </p>
            </div>
            <div>
              <label className="form-label">Google Business Profile (Maps URL)</label>
              <input
                className="form-input"
                value={googleMapUrl}
                onChange={(e) => setGoogleMapUrl(e.target.value)}
                placeholder="https://maps.google.com/?cid=..."
              />
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                <a
                  href="https://www.google.com/maps"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--accent-blue)", fontWeight: 600 }}
                >
                  Search &amp; copy share URL from Google Maps ↗
                </a>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Google Search Console Property</label>
              <input
                className="form-input"
                value={gscSite}
                onChange={(e) => setGscSite(e.target.value)}
                placeholder="https://example.com or sc-domain:example.com"
              />
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Must be a verified property in your GSC account.
              </p>
            </div>
            <div>
              <label className="form-label">Google Ads Customer ID</label>
              <input
                className="form-input font-mono"
                value={adsId}
                onChange={(e) => setAdsId(e.target.value)}
                placeholder="123-456-7890"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>

          <div>
            <label className="form-label">Social Media Links</label>
            <textarea
              className="form-input"
              rows={3}
              value={socialLinks}
              onChange={(e) => setSocialLinks(e.target.value)}
              placeholder={"https://instagram.com/brand\nhttps://facebook.com/brand"}
              style={{ resize: "vertical", fontFamily: "inherit" }}
            />
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              One URL per line. Saved as structured JSON automatically.
            </p>
          </div>

          <div
            className="rounded-xl p-3 text-xs flex items-start gap-2"
            style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
          >
            <Icon name="info" size="sm" />
            <span>
              Storefront rating and review count are read-only — they sync automatically from the latest Google Places audit match.
            </span>
          </div>
        </div>

        {/* Sticky footer */}
        <div
          className="shrink-0 flex items-center gap-3 px-6 py-4 border-t"
          style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
        >
          {error && (
            <p className="text-sm mr-auto" style={{ color: "#fb7185" }}>
              {error}
            </p>
          )}
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary flex items-center gap-2">
            {loading && (
              <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
            )}
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── GBP Verification Modal ────────────────────────────────────────────────────

function GbpVerifyModal({
  bu,
  onClose,
  onVerified,
}: {
  bu: BusinessUnit;
  onClose: () => void;
  onVerified: (updated: BusinessUnit) => void;
}) {
  const [placeId, setPlaceId] = useState(bu.google_business_place_id ?? "");
  const [mapsUrl, setMapsUrl] = useState(bu.google_business_map_url ?? "");
  const [preview, setPreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePreview = async () => {
    if (!placeId.trim() && !mapsUrl.trim()) {
      setError("Provide a Place ID or Maps URL to preview.");
      return;
    }
    setPreviewLoading(true);
    setError("");
    setPreview(null);
    try {
      const data = await api.businessUnits.previewGbp(bu.id, {
        place_id: placeId.trim() || undefined,
        maps_url: mapsUrl.trim() || undefined,
      });
      setPreview(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Preview failed.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirm = async (data: {
    place_id: string;
    name?: string | null;
    rating?: number | null;
    review_count?: number | null;
    map_url?: string | null;
  }) => {
    setConfirmLoading(true);
    setError("");
    try {
      const updated = await api.businessUnits.confirmGbp(bu.id, {
        place_id: data.place_id,
        maps_url: data.map_url || mapsUrl.trim() || undefined,
        name: data.name || undefined,
        rating: data.rating ?? undefined,
        review_count: data.review_count ?? undefined,
      });
      // Refresh the BU to get updated digital_footprint_metrics
      const fresh = await api.businessUnits.get(bu.id);
      onVerified(fresh);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setConfirmLoading(false);
    }
  };

  const hasExisting = !!bu.google_business_place_id;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-box flex flex-col w-full max-w-2xl max-h-[90vh] overflow-hidden"
        style={{ padding: 0, maxWidth: 672 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="shrink-0 flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Verify Google Business Profile
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {bu.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="btn btn-ghost"
            style={{ padding: "0.35rem 0.75rem", fontSize: "1.25rem", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-5">
          {/* Quick confirm using existing place_id */}
          {hasExisting && !preview && (
            <div
              className="rounded-xl p-4 border"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
            >
              <p className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                Current profile:{" "}
                <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                  {bu.google_business_place_id}
                </span>
              </p>
              <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                {bu.google_business_rating
                  ? `★ ${bu.google_business_rating} · ${bu.google_business_review_count ?? 0} reviews`
                  : "No rating synced yet"}
              </p>
              <button
                type="button"
                disabled={confirmLoading}
                onClick={() =>
                  handleConfirm({
                    place_id: bu.google_business_place_id!,
                    name: bu.name,
                    rating: bu.google_business_rating ?? null,
                    review_count: bu.google_business_review_count ?? null,
                    map_url: bu.google_business_map_url ?? null,
                  })
                }
                className="btn btn-primary flex items-center gap-2"
              >
                {confirmLoading && (
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                )}
                Yes, this is correct — Lock it
              </button>
            </div>
          )}

          {/* Override / fix */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Or enter a corrected Place ID / Maps URL
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Google Place ID</label>
                <input
                  className="form-input font-mono"
                  value={placeId}
                  onChange={(e) => setPlaceId(e.target.value)}
                  placeholder="ChIJ..."
                />
              </div>
              <div>
                <label className="form-label">Google Maps URL</label>
                <input
                  className="form-input"
                  value={mapsUrl}
                  onChange={(e) => setMapsUrl(e.target.value)}
                  placeholder="https://www.google.com/maps/place/..."
                />
              </div>
            </div>

            {error && <p className="text-sm" style={{ color: "#fb7185" }}>{error}</p>}

            <button
              type="button"
              onClick={handlePreview}
              disabled={previewLoading}
              className="btn btn-ghost flex items-center gap-2"
            >
              {previewLoading && (
                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
              )}
              Preview
            </button>

            {/* Preview result */}
            {preview && (
              <div
                className="rounded-xl p-4 border space-y-3"
                style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
              >
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  Found:{" "}
                  <strong>{preview.name ?? "Unknown"}</strong>{" "}
                  {preview.rating != null && (
                    <span style={{ color: "var(--text-muted)" }}>
                      (★ {preview.rating} · {preview.review_count ?? 0} reviews)
                    </span>
                  )}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Is this the business you're verifying?
                </p>
                <button
                  type="button"
                  disabled={confirmLoading}
                  onClick={() =>
                    handleConfirm({
                      place_id: preview.place_id,
                      name: preview.name,
                      rating: preview.rating,
                      review_count: preview.review_count,
                      map_url: preview.map_url,
                    })
                  }
                  className="btn btn-primary flex items-center gap-2"
                >
                  {confirmLoading && (
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  )}
                  Confirm &amp; Lock
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t"
          style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
        >
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Social Media Verification Modal ───────────────────────────────────────────

function SocialVerifyModal({
  bu,
  onClose,
  onVerified,
}: {
  bu: BusinessUnit;
  onClose: () => void;
  onVerified: (updated: BusinessUnit) => void;
}) {
  const [platform, setPlatform] = useState("instagram");
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [error, setError] = useState("");

  const platforms = ["instagram", "facebook", "tiktok", "linkedin"];

  const handlePreview = async () => {
    if (!url.trim()) {
      setError("Enter a URL to preview.");
      return;
    }
    setPreviewLoading(true);
    setError("");
    setPreview(null);
    try {
      const data = await api.businessUnits.previewSocial(bu.id, {
        platform,
        url: url.trim(),
      });
      setPreview(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Preview failed.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview) return;
    setConfirmLoading(true);
    setError("");
    try {
      await api.businessUnits.confirmSocial(bu.id, {
        platform,
        url: url.trim(),
        followers: preview.followers ?? undefined,
      });
      const fresh = await api.businessUnits.get(bu.id);
      onVerified(fresh);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-box flex flex-col w-full max-w-2xl max-h-[90vh] overflow-hidden"
        style={{ padding: 0, maxWidth: 672 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="shrink-0 flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Verify Social Media Profile
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {bu.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="btn btn-ghost"
            style={{ padding: "0.35rem 0.75rem", fontSize: "1.25rem", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Platform</label>
              <select
                className="form-input"
                value={platform}
                onChange={(e) => {
                  setPlatform(e.target.value);
                  setPreview(null);
                  setError("");
                }}
              >
                {platforms.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Profile URL</label>
              <input
                className="form-input"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setPreview(null);
                  setError("");
                }}
                placeholder="https://instagram.com/brand"
              />
            </div>
          </div>

          {error && <p className="text-sm" style={{ color: "#fb7185" }}>{error}</p>}

          <button
            type="button"
            onClick={handlePreview}
            disabled={previewLoading}
            className="btn btn-ghost flex items-center gap-2"
          >
            {previewLoading && (
              <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
            )}
            Preview
          </button>

          {preview && (
            <div
              className="rounded-xl p-4 border space-y-3"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
            >
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {preview.active ? "Profile found" : "Profile not accessible"}
                {preview.followers != null && (
                  <span style={{ color: "var(--text-muted)" }}> · {preview.followers} followers</span>
                )}
              </p>
              {preview.description_snippet && (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {preview.description_snippet}
                </p>
              )}
              {preview.error && (
                <p className="text-xs" style={{ color: "#fb7185" }}>{preview.error}</p>
              )}
              <button
                type="button"
                disabled={confirmLoading || !preview.active}
                onClick={handleConfirm}
                className="btn btn-primary flex items-center gap-2"
              >
                {confirmLoading && (
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                )}
                Confirm &amp; Lock
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t"
          style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
        >
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Lead row ─────────────────────────────────────────────────────────────────

const CHANNEL_LABELS: Record<string, string> = {
  GOOGLE_ADS: "Google Ads",
  META_LEAD_AD: "Meta Ads",
  LANDING_PAGE: "Landing Page",
  TIKTOK: "TikTok",
  SMS: "SMS",
};

function attributionLabel(lead: Lead): string {
  if (lead.gclid) return "Google Ads";
  if (lead.fbclid) return "Meta Ads";
  if (lead.utm_source && lead.utm_source.trim()) return lead.utm_source.trim();
  return CHANNEL_LABELS[lead.source_channel] ?? lead.source_channel;
}

function channelBuckets(leads: Lead[]): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const lead of leads) {
    const label = attributionLabel(lead);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function LeadRow({ lead }: { lead: Lead }) {
  const geo = [lead.city, lead.country].filter(Boolean).join(", ");
  return (
    <tr>
      <td>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
            {lead.full_name}
          </span>
          {(lead.is_returning || (lead.submission_count ?? 1) > 1) && (
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa" }}
            >
              RETURNING
            </span>
          )}
        </div>
        <div className="text-xs font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>
          {lead.phone_number}
        </div>
        {geo && (
          <div className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            📍 {geo}
          </div>
        )}
      </td>
      <td><ChannelBadge channel={lead.source_channel} /></td>
      <td>
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
          {attributionLabel(lead)}
        </span>
        {lead.utm_campaign && (
          <div
            className="text-[10px] font-mono truncate max-w-[140px]"
            style={{ color: "var(--text-muted)" }}
            title={lead.utm_campaign}
          >
            {lead.utm_campaign}
          </div>
        )}
      </td>
      <td><StatusBadge value={lead.delivery_status} /></td>
      <td>
        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
          {new Date(lead.last_activity_at).toLocaleString()}
        </div>
      </td>
    </tr>
  );
}

// ── Lead Performance Strip ────────────────────────────────────────────────────

function LeadPerformanceStrip({ leads, last7Count }: { leads: Lead[]; last7Count: number }) {
  const total = leads.length;
  const returning = leads.filter((l) => l.is_returning || (l.submission_count ?? 1) > 1).length;
  const delivered = leads.filter((l) => l.delivery_status === "DELIVERED").length;
  const deliveryRate = total ? Math.round((delivered / total) * 100) : 0;
  const returningRate = total ? Math.round((returning / total) * 100) : 0;
  const topChannel = channelBuckets(leads)[0];

  const items = [
    { icon: "schedule", color: "#f59e0b", label: "Last 7 Days", value: `${last7Count}`, hint: "new leads" },
    { icon: "autorenew", color: "#a78bfa", label: "Returning", value: `${returningRate}%`, hint: `${returning} repeat` },
    { icon: "check_circle", color: "#22c55e", label: "Delivery Success", value: `${deliveryRate}%`, hint: `${delivered} delivered` },
    {
      icon: "ads_click",
      color: "#3b82f6",
      label: "Top Channel",
      value: topChannel?.label ?? "—",
      hint: topChannel ? `${topChannel.count} leads` : "no data yet",
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="p-3 rounded-lg border flex items-center gap-3"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <div style={{ color: item.color }}>
              <Icon name={item.icon} size="lg" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{item.label}</p>
              <p className="text-base font-bold truncate" style={{ color: "var(--text-primary)" }}>{item.value}</p>
              <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>{item.hint}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] mt-2" style={{ color: "var(--text-muted)" }}>
        Based on the {total} most recent leads.
      </p>
    </div>
  );
}

// ── Channel Attribution ───────────────────────────────────────────────────────

function ChannelAttributionCard({ leads }: { leads: Lead[] }) {
  const buckets = channelBuckets(leads).slice(0, 5);
  const total = leads.length;
  const colors = ["#06b6d4", "#a78bfa", "#34d399", "#fbbf24", "#fb7185"];
  const topCampaign = leads.map((l) => l.utm_campaign).find((c) => Boolean(c)) ?? null;

  return (
    <div className="card animate-fade-in h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base" style={{ color: "var(--accent-blue)" }}>
            donut_large
          </span>
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
            Channel Attribution
          </h2>
        </div>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          last {total} leads
        </span>
      </div>

      {total === 0 ? (
        <div className="py-8 text-center" style={{ color: "var(--text-muted)" }}>
          <Icon name="pie_chart" size="lg" />
          <p className="mt-2 text-sm">Attribution appears once leads start arriving.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {buckets.map((bucket, idx) => {
            const pct = Math.round((bucket.count / total) * 100);
            return (
              <div key={bucket.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium" style={{ color: "var(--text-secondary)" }}>
                    {bucket.label}
                  </span>
                  <span className="font-mono" style={{ color: "var(--text-muted)" }}>
                    {bucket.count} · {pct}%
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: "var(--bg-elevated)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(pct, 3)}%`, background: colors[idx % colors.length] }}
                  />
                </div>
              </div>
            );
          })}
          {topCampaign && (
            <p className="text-xs pt-1" style={{ color: "var(--text-muted)" }}>
              Top campaign: <span className="font-mono" style={{ color: "var(--text-secondary)" }}>{topCampaign}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Ads Account Alerts ────────────────────────────────────────────────────────

interface AdsDiagnostics {
  status?: string;
  data?: {
    account_status?: string;
    prepay_balance?: string;
    conversion_tracking?: string;
    alerts?: Array<{ type?: string; message?: string }>;
  };
}

function AdsAccountAlerts({ diagnostics }: { diagnostics: AdsDiagnostics | null }) {
  if (!diagnostics) return null;
  const data = diagnostics.data ?? {};
  const alerts: Array<{ type?: string; message?: string }> = Array.isArray(data.alerts) ? data.alerts : [];
  const statuses = [
    { label: "Account", value: data.account_status },
    { label: "Prepay", value: data.prepay_balance },
    { label: "Conversions", value: data.conversion_tracking },
  ].filter((s) => s.value);

  return (
    <div
      className="card animate-fade-in"
      style={{ borderColor: "rgba(59,130,246,0.25)", background: "rgba(59,130,246,0.04)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-base" style={{ color: "#3b82f6" }}>
          campaign
        </span>
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
          Ads Account Alerts
        </h2>
      </div>

      {statuses.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {statuses.map((s) => (
            <span
              key={s.label}
              className="text-xs px-2.5 py-1 rounded-full font-mono"
              style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
            >
              {s.label}: <strong style={{ color: "var(--text-primary)" }}>{String(s.value)}</strong>
            </span>
          ))}
        </div>
      )}

      {alerts.length === 0 ? (
        <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--accent-emerald)" }}>
          <Icon name="check_circle" size="sm" /> No account alerts.
        </p>
      ) : (
        <ul className="space-y-2">
          {alerts.map((alert, idx) => (
            <li key={idx} className="text-xs flex items-start gap-2" style={{ color: "var(--text-secondary)" }}>
              <span className="material-symbols-outlined text-sm mt-0.5" style={{ color: "var(--accent-blue)" }}>
                info
              </span>
              <span>{alert.message ?? String(alert)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Tracking Installation ─────────────────────────────────────────────────────

function TrackingInstallationCard({
  buId,
  ingestUrl,
  snippetCode,
  copied,
  webhookCopied,
  onCopyId,
  onCopySnippet,
}: {
  buId: string;
  ingestUrl: string;
  snippetCode: string;
  copied: boolean;
  webhookCopied: boolean;
  onCopyId: () => void;
  onCopySnippet: () => void;
}) {
  return (
    <div
      className="card animate-fade-in h-full"
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

      <div className="mb-4">
        <div className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
          Business Unit ID
        </div>
        <div
          className="flex items-center gap-2 p-2.5 rounded-xl font-mono text-xs"
          style={{ background: "var(--bg-elevated)" }}
        >
          <span className="flex-1 truncate" style={{ color: "var(--text-primary)" }}>{buId}</span>
          <button
            onClick={onCopyId}
            className="btn btn-ghost"
            style={{ padding: "0.2rem 0.6rem", fontSize: "0.75rem", whiteSpace: "nowrap" }}
          >
            <Icon name={copied ? "check" : "content_copy"} size="sm" />
            {copied ? "Copied!" : "Copy ID"}
          </button>
        </div>
      </div>

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
        <button onClick={onCopySnippet} className="btn btn-ghost w-full mt-2" style={{ fontSize: "0.8rem" }}>
          <Icon name={webhookCopied ? "check" : "content_copy"} size="sm" />
          {webhookCopied ? "Snippet Copied!" : "📋 Copy Tracking Snippet"}
        </button>
      </div>
    </div>
  );
}

// ── Integrations & Access ─────────────────────────────────────────────────────

function IntegrationsCard({ bu, ingestUrl }: { bu: BusinessUnit; ingestUrl: string }) {
  return (
    <div className="card animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-base" style={{ color: "var(--accent-blue)" }}>
          hub
        </span>
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
          Integrations &amp; Access
        </h2>
      </div>

      <ProfileRow icon="campaign" label="Google Ads Customer ID" value={bu.google_ads_customer_id} mono empty="Not connected" />
      {bu.route_type === "ENTERPRISE" && (
        <ProfileRow icon="link" label="CRM Webhook" value={bu.webhook_url} mono empty="Not configured" />
      )}
      <ProfileRow icon="webhook" label="Ingest Endpoint" value={ingestUrl} mono />
      <ProfileRow
        icon="notifications_active"
        label="Lead Delivery"
        value={bu.owner_whatsapp_number && bu.owner_email ? "WhatsApp + Email enabled" : "Not configured"}
      />
      <ProfileRow
        icon="public"
        label="Target Market"
        value={`${bu.target_country ?? "2404"} / ${bu.target_language ?? "1000"}`}
        mono
      />
    </div>
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

// ── GBP verification helpers ──────────────────────────────────────────────────

function parseFootprintScores(bu: BusinessUnit | null): {
  overall: number;
  local: number;
  website: number;
  social: number;
  auditedAt: string | null;
} | null {
  if (!bu) return null;
  const m = bu.digital_footprint_metrics;
  let fp: any = m;
  if (typeof m === "string") {
    try {
      fp = JSON.parse(m);
    } catch {
      fp = {};
    }
  }
  if (!fp || !fp.scores) return null;
  return {
    overall: fp.scores.overall_health_score ?? 0,
    local: fp.scores.local_authority_score ?? 0,
    website: fp.scores.website_health_score ?? 0,
    social: fp.scores.social_presence_score ?? 0,
    auditedAt: fp.audited_at ?? null,
  };
}

function isGbpVerified(bu: BusinessUnit | null): boolean {
  if (!bu) return false;
  const m = bu.digital_footprint_metrics;
  let footprint: any = m;
  if (typeof m === "string") {
    try {
      footprint = JSON.parse(m);
    } catch {
      footprint = {};
    }
  }
  return !!(footprint && footprint.gbp && footprint.gbp.verified);
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
  const [last7Count, setLast7Count] = useState(0);
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
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showSocialVerifyModal, setShowSocialVerifyModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [webhookCopied, setWebhookCopied] = useState(false);
  const [discoveringSocials, setDiscoveringSocials] = useState(false);
  const [socialSuccessMessage, setSocialSuccessMessage] = useState("");
  const [syncingGbp, setSyncingGbp] = useState(false);
  const [syncingGsc, setSyncingGsc] = useState(false);
  const [activeTab, setActiveTab] = useState<"audit" | "leads" | "keywords" | "settings">("audit");
  const [latestAudit, setLatestAudit] = useState<
    Awaited<ReturnType<typeof api.businessUnitAudit.get>> | null
  >(null);
  const [accountDiagnostics, setAccountDiagnostics] = useState<AdsDiagnostics | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [runningFootprint, setRunningFootprint] = useState(false);

  const handleDiscoverSocials = async () => {
    if (!bu) return;
    if (!bu.primary_url && !bu.website_url && !bu.google_search_console_site) {
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
      await fetchData();
      setTimeout(() => setSocialSuccessMessage(""), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Social discovery failed");
    } finally {
      setDiscoveringSocials(false);
    }
  };

  const handleRunFootprintAudit = async () => {
    if (!bu) return;
    setRunningFootprint(true);
    try {
      await api.businessUnitAudit.runFootprintAudit(orgId, buId);
      await fetchData();
      setToast("Digital footprint audit complete.");
    } catch (err: unknown) {
      setToast(err instanceof Error ? err.message : "Footprint audit failed.");
    } finally {
      setRunningFootprint(false);
    }
  };

  const handleSyncGBP = async () => {
    if (!bu) return;
    if (!bu.google_business_place_id) {
      alert("Please add a Google Places / Place ID in your Business Profile first.");
      setShowEditModal(true);
      return;
    }
    setSyncingGbp(true);
    try {
      const res = await api.businessUnits.syncGbp(buId);
      if (res.status === "success") {
        await fetchData();
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Google Places synchronization failed");
    } finally {
      setSyncingGbp(false);
    }
  };

  const handleConnectGsc = async () => {
    if (!bu) return;
    try {
      await api.gsc.initiateAuth(buId);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to start GSC connection. Please try again.");
    }
  };

  const handleSyncGsc = async () => {
    if (!bu) return;
    setSyncingGsc(true);
    try {
      const res = await api.gsc.sync(buId);
      if (res.status === "success" && res.metrics) {
        setBu((prev) => (prev ? { ...prev, gsc_metrics: res.metrics } : prev));
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "GSC sync failed");
    } finally {
      setSyncingGsc(false);
    }
  };

  const handleDisconnectGsc = async () => {
    if (!bu) return;
    if (!confirm("Disconnect Google Search Console? This will clear all stored tokens and cached metrics.")) return;
    try {
      await api.gsc.disconnect(buId);
      setBu((prev) => prev ? { ...prev, gsc_connected: false, gsc_metrics: null, gsc_refresh_token: undefined } : prev);
      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to disconnect GSC");
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
        api.leads.list({ business_unit_id: buId, limit: 50 }),
        api.auth.me().catch(() => null),
      ]);
      setBu(buData);
      setOrg(orgData);
      setLeads(leadsData.items);
      setLeadsTotal(leadsData.total);
      const cutoff = Date.now() - 7 * 86400000;
      setLast7Count(
        leadsData.items.filter((l) => new Date(l.created_at).getTime() >= cutoff).length
      );
      setUser(userData);

      // Fetch latest audit for KPI header
      api.businessUnitAudit.list(orgId, buId).then((h) => {
        if (h.length > 0) {
          api.businessUnitAudit.get(orgId, buId, h[0].id).then(setLatestAudit).catch(() => {});
        }
      }).catch(() => {});

      // Ads account diagnostics (role-gated endpoint; non-fatal)
      api.marketing.getAccountDiagnostics().then(setAccountDiagnostics).catch(() => {});

      // Auto-fetch scraped metadata from the audit website (falls back to primary_url)
      const effectiveWebsite = buData.website_url || buData.primary_url;
      if (effectiveWebsite) {
        setScrapingLoading(true);
        api.marketing
          .scrapePreview(effectiveWebsite)
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

  // Targeted refresh of the latest audit used by the page-level KPI strip.
  const refreshLatestAudit = useCallback(async () => {
    const history = await api.businessUnitAudit.list(orgId, buId);
    if (history.length > 0) {
      const latest = await api.businessUnitAudit.get(orgId, buId, history[0].id);
      setLatestAudit(latest);
    }
  }, [orgId, buId]);

  useEffect(() => {
    const t = setTimeout(fetchData, 0);
    return () => clearTimeout(t);
  }, [fetchData]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

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
        bu.website_url || bu.primary_url || undefined,
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
            {/* ── 4-Card KPI Insights Strip ──────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-3 rounded-lg border flex items-center gap-3" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                <div className="p-2 rounded-md flex items-center justify-center" style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}>
                  <Icon name="health_and_safety" size="lg" />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Health Score</p>
                  <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                    {latestAudit ? `${Math.round(latestAudit.overall_score)}/100 (Grade ${latestAudit.grade})` : "Not Audited"}
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-lg border flex items-center gap-3" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                <div className="p-2 rounded-md flex items-center justify-center" style={{ background: "rgba(249,115,22,0.12)", color: "#f97316" }}>
                  <Icon name="star" size="lg" />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Google Rating</p>
                  <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                    {latestAudit?.agent_diagnostic?.metrics?.google_rating ? `${latestAudit.agent_diagnostic.metrics.google_rating}★ (${latestAudit.agent_diagnostic.metrics.google_reviews ?? 0} reviews)` : bu.google_business_rating ? `${bu.google_business_rating}★ (${bu.google_business_review_count ?? 0} reviews)` : "Not Linked"}
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-lg border flex items-center gap-3" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                <div className="p-2 rounded-md flex items-center justify-center" style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>
                  <Icon name="trending_up" size="lg" />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Total Leads</p>
                  <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{leadsTotal} Leads</p>
                </div>
              </div>
              <div className="p-3 rounded-lg border flex items-center gap-3" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                <div className="p-2 rounded-md flex items-center justify-center" style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6" }}>
                  <Icon name="link" size="lg" />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Integrations</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {bu.google_business_place_id || latestAudit?.agent_diagnostic?.gbp_profile?.name ? "GBP Connected" : "GBP Pending"} · {bu.gsc_connected ? "GSC Connected" : "GSC Pending"}
                  </p>
                </div>
              </div>
            </div>

            <div className="accent-line mb-8" />

            {/* ── Tab Navigation ─────────────────────────────────────────────── */}
            <div className="flex gap-2 mb-6 border-b" style={{ borderColor: "var(--border)" }}>
              {[
                { id: "audit", label: "Audit & Action Plan", icon: "fact_check" },
                { id: "leads", label: "Leads & Tracking", icon: "bolt" },
                { id: "keywords", label: "Keyword & Ad Performance", icon: "search" },
                { id: "settings", label: "Digital Footprint & Settings", icon: "settings" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as "audit" | "leads" | "keywords" | "settings")}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all"
                  style={{
                    color: activeTab === tab.id ? "var(--accent-blue)" : "var(--text-muted)",
                    borderBottom: activeTab === tab.id ? "2px solid var(--accent-blue)" : "2px solid transparent",
                    marginBottom: "-1px",
                  }}
                >
                  <span className="material-symbols-outlined text-base">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "leads" && (
              <div className="space-y-6 mt-6">
                {/* ── Lead Performance Strip ─────────────────────────────── */}
                <LeadPerformanceStrip leads={leads} last7Count={last7Count} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* ── Tracking Installation (staff only) ───────────────── */}
                  {canEdit && (
                    <div className="min-w-0">
                      <TrackingInstallationCard
                        buId={buId}
                        ingestUrl={ingestUrl}
                        snippetCode={snippetCode}
                        copied={copied}
                        webhookCopied={webhookCopied}
                        onCopyId={copyBuId}
                        onCopySnippet={copyWebhook}
                      />
                    </div>
                  )}

                  {/* ── Channel Attribution ──────────────────────────────── */}
                  <div className={canEdit ? "lg:col-span-2 min-w-0" : "lg:col-span-3 min-w-0"}>
                    <ChannelAttributionCard leads={leads} />
                  </div>
                </div>

                {/* ── Recent Leads (full width) ──────────────────────────── */}
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
                    <div className="overflow-x-auto">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Lead</th>
                            <th>Channel</th>
                            <th>Attribution</th>
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
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "keywords" && (
              <div className="space-y-6 mt-6">
                {/* ── Ads Account Alerts ─────────────────────────────────── */}
                <AdsAccountAlerts diagnostics={accountDiagnostics} />

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
                        Pre-filled with this BU&apos;s URL and Ads account
                      </p>
                    </div>
                  </div>

                  {/* Pre-filled context pills */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(bu.website_url || bu.primary_url) && (
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-mono"
                        style={{ background: "rgba(6,182,212,0.1)", color: "#06b6d4" }}
                      >
                        🌐 {bu.website_url || bu.primary_url}
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
                    {!bu.website_url && !bu.primary_url && !bu.google_ads_customer_id && (
                      <span className="text-xs italic" style={{ color: "var(--text-muted)" }}>
                        Edit the Business Profile to pre-fill URL and Ads account.
                      </span>
                    )}
                  </div>

                  {/* Scraped Website Intelligence Card */}
                  {(bu.website_url || bu.primary_url) && (
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
                        <p style={{ color: "var(--text-muted)" }}>Fetching title and metadata from {bu.website_url || bu.primary_url}…</p>
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
            )}

            {activeTab === "audit" && (
              <div className="space-y-6 mt-6">
                {/* ── Marketing Health Audit Card ─────────────────────────── */}
                <AuditCard
                  orgId={orgId}
                  bu={bu}
                  onEditProfile={canEdit ? () => setShowEditModal(true) : undefined}
                  userRole={user?.role}
                  leadsTotal={leadsTotal}
                  onAuditComplete={refreshLatestAudit}
                />
              </div>
            )}

            {activeTab === "settings" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* ── LEFT: Business Profile (identity + audit profile) ───── */}
                <div className="space-y-6 min-w-0">
                  <div className="card animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base" style={{ color: "var(--accent-blue)" }}>
                          business
                        </span>
                        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                          Business Profile
                        </h2>
                      </div>
                      {canEdit && (
                        <button
                          onClick={() => setShowEditModal(true)}
                          className="btn btn-ghost"
                          style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}
                        >
                          <Icon name="edit" size="sm" /> Edit Profile
                        </button>
                      )}
                    </div>

                    <ProfileRow icon="language" label="Primary Website" value={bu.primary_url} />
                    <ProfileRow
                      icon="travel_explore"
                      label="Audit Website"
                      value={bu.website_url}
                      mono
                      empty="Uses primary website"
                    />
                    <ProfileRow icon="location_city" label="Primary City" value={bu.city} empty="Not set" />
                    <ProfileRow icon="category" label="Industry / Category" value={bu.industry} empty="Not set" />
                    <ProfileRow icon="call" label="Business Phone" value={bu.phone} mono empty="Not set" />
                    <ProfileRow icon="smartphone" label="Owner WhatsApp" value={bu.owner_whatsapp_number} mono />
                    <ProfileRow icon="email" label="Owner Email" value={bu.owner_email} />
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
                  </div>
                </div>

                {/* ── RIGHT: Footprint, GSC, Integrations ─────────────────── */}
                <div className="space-y-6 min-w-0">
                  {/* ── GBP Verification Status ────────────────────────────── */}
                  {canEdit && (
                    <div
                      className="card animate-fade-in flex items-center justify-between gap-3"
                      style={{
                        borderColor: isGbpVerified(bu) ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)",
                        background: isGbpVerified(bu) ? "rgba(34,197,94,0.06)" : "rgba(245,158,11,0.06)",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="material-symbols-outlined text-base"
                          style={{ color: isGbpVerified(bu) ? "#22c55e" : "#f59e0b" }}
                        >
                          {isGbpVerified(bu) ? "verified" : "pending"}
                        </span>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                            {isGbpVerified(bu) ? "GBP Verified" : "GBP Unverified"}
                          </p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {isGbpVerified(bu)
                              ? "Locked — future audits use this Place ID exclusively."
                              : "Verify the Google Business Profile to lock it."}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowVerifyModal(true)}
                        className="btn btn-ghost"
                        style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                      >
                        <Icon name={isGbpVerified(bu) ? "edit" : "verified"} size="sm" />
                        {isGbpVerified(bu) ? "Re-verify" : "Verify"}
                      </button>
                    </div>
                  )}

                  {/* ── Social Media Verification ──────────────────────────── */}
                  {canEdit && (
                    <div
                      className="card animate-fade-in flex items-center justify-between gap-3"
                      style={{
                        borderColor: "rgba(139,92,246,0.3)",
                        background: "rgba(139,92,246,0.06)",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base" style={{ color: "#a78bfa" }}>
                          share
                        </span>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                            Social Media Verification
                          </p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            Verify and lock social profile URLs for auditing.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSocialVerifyModal(true)}
                        className="btn btn-ghost"
                        style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                      >
                        <Icon name="verified" size="sm" /> Verify
                      </button>
                    </div>
                  )}

                  {/* ── Brand Intelligence & Digital Footprint ─────────────── */}
                  <BrandIntelligenceCard
                    businessUnit={bu}
                    onDiscoverSocials={handleDiscoverSocials}
                    loadingDiscovery={discoveringSocials}
                    onSyncGbp={handleSyncGBP}
                    loadingSyncGbp={syncingGbp}
                    onEditProfile={() => setShowEditModal(true)}
                  />

                  {/* ── Google Search Console Card ─────────────────────────── */}
                  <GscMetricsCard
                    buId={buId}
                    siteUrl={bu.gsc_site_url || bu.google_search_console_site}
                    gscConnected={Boolean(bu.gsc_connected)}
                    gscMetrics={bu.gsc_metrics}
                    onConnectGsc={handleConnectGsc}
                    onSyncGsc={handleSyncGsc}
                    onDisconnect={canEdit ? handleDisconnectGsc : undefined}
                    loadingSync={syncingGsc}
                    onEditProfile={canEdit ? () => setShowEditModal(true) : undefined}
                  />

                  {/* ── Digital Footprint Scores ───────────────────────────── */}
                  {(() => {
                    const scores = parseFootprintScores(bu);
                    return (
                      <div className="card animate-fade-in">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-base" style={{ color: "var(--accent-blue)" }}>
                              analytics
                            </span>
                            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                              Digital Footprint Scores
                            </h2>
                          </div>
                          <button
                            type="button"
                            onClick={handleRunFootprintAudit}
                            disabled={runningFootprint}
                            className="btn btn-primary"
                            style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}
                          >
                            {runningFootprint ? "Running..." : "Run Audit"}
                          </button>
                        </div>

                        {scores ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 rounded-lg border text-center" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
                                <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{scores.overall}</p>
                                <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Overall Health</p>
                              </div>
                              <div className="p-3 rounded-lg border text-center" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
                                <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{scores.local}</p>
                                <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Local Authority</p>
                              </div>
                              <div className="p-3 rounded-lg border text-center" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
                                <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{scores.website}</p>
                                <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Website Health</p>
                              </div>
                              <div className="p-3 rounded-lg border text-center" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
                                <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{scores.social}</p>
                                <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Social Presence</p>
                              </div>
                            </div>
                            {scores.auditedAt && (
                              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                                Last audited: {new Date(scores.auditedAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            No footprint audit yet. Click "Run Audit" to generate scores.
                          </p>
                        )}
                      </div>
                    );
                  })()}

                  {/* ── Integrations & Access ──────────────────────────────── */}
                  <IntegrationsCard bu={bu} ingestUrl={ingestUrl} />
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Edit Profile Modal ─────────────────────────────────────────────── */}
        {showEditModal && bu && (
          <EditProfileModal
            bu={bu}
            orgId={orgId}
            onClose={() => setShowEditModal(false)}
            onSaved={(updated) => {
              setBu(updated);
              setShowEditModal(false);
              setToast("Business profile saved");
              fetchData().catch(() => {});
            }}
          />
        )}

        {showVerifyModal && bu && (
          <GbpVerifyModal
            bu={bu}
            onClose={() => setShowVerifyModal(false)}
            onVerified={(updated) => {
              setBu(updated);
              setShowVerifyModal(false);
              setToast("Google Business Profile verified and locked.");
              fetchData().catch(() => {});
            }}
          />
        )}

        {showSocialVerifyModal && bu && (
          <SocialVerifyModal
            bu={bu}
            onClose={() => setShowSocialVerifyModal(false)}
            onVerified={(updated) => {
              setBu(updated);
              setShowSocialVerifyModal(false);
              setToast("Social profile verified and locked.");
              fetchData().catch(() => {});
            }}
          />
        )}

        {toast && (
          <div
            role="status"
            className="fixed bottom-6 right-6 z-[110] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg animate-slide-up"
            style={{ background: "var(--bg-card)", border: "1px solid var(--accent-emerald)" }}
          >
            <span style={{ color: "var(--accent-emerald)", display: "flex" }}>
              <Icon name="check_circle" size="sm" />
            </span>
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {toast}
            </span>
          </div>
        )}
      </main>
    </div>
  );
}
