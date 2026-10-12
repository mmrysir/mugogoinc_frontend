"use client";

import React from "react";
import { BusinessUnit } from "@/lib/api";

export interface SocialLinks {
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
  google_business?: string;
  [key: string]: string | undefined;
}

interface BrandIntelligenceProps {
  businessUnit: BusinessUnit;
  onDiscoverSocials: () => void;
  loadingDiscovery: boolean;
  onSyncGbp?: () => void;
  loadingSyncGbp?: boolean;
  onEditProfile?: () => void;
}

export default function BrandIntelligenceCard({
  businessUnit,
  onDiscoverSocials,
  loadingDiscovery,
  onSyncGbp,
  loadingSyncGbp = false,
  onEditProfile,
}: BrandIntelligenceProps) {
  // Parse social links if stored as JSON string or object
  let socials: SocialLinks = {};
  if (businessUnit.social_media_links) {
    if (
      typeof businessUnit.social_media_links === "string" &&
      businessUnit.social_media_links.trim().startsWith("{")
    ) {
      try {
        socials = JSON.parse(businessUnit.social_media_links);
      } catch {
        socials = {};
      }
    } else if (typeof businessUnit.social_media_links === "object") {
      socials = businessUnit.social_media_links as unknown as SocialLinks;
    }
  }

  // Parse digital footprint metrics
  let footprint: Record<string, any> = {};
  if (businessUnit.digital_footprint_metrics) {
    if (
      typeof businessUnit.digital_footprint_metrics === "string" &&
      businessUnit.digital_footprint_metrics.trim().startsWith("{")
    ) {
      try {
        footprint = JSON.parse(businessUnit.digital_footprint_metrics);
      } catch {
        footprint = {};
      }
    } else if (typeof businessUnit.digital_footprint_metrics === "object") {
      footprint = businessUnit.digital_footprint_metrics;
    }
  }

  const rating = businessUnit.google_business_rating;
  const reviewCount = businessUnit.google_business_review_count;
  const hasPlaceId = Boolean(businessUnit.google_business_place_id?.trim());
  const isSynced = rating !== null && rating !== undefined;
  const mapUrl = businessUnit.google_business_map_url || socials.google_business;
  const schemaType =
    footprint.schema_org?.type || footprint.schema_type || "LocalBusiness";

  const getPlatformStatus = (platform: string): string => {
    const meta = footprint[platform];
    if (meta && typeof meta === "object" && "status" in meta && typeof meta.status === "string") {
      return meta.status.toUpperCase();
    }
    return "ACTIVE";
  };

  const getStatusColor = (status: string): { background: string; color: string; borderColor: string } => {
    switch (status.toLowerCase()) {
      case "verified":
        return {
          background: "rgba(34, 197, 94, 0.12)",
          color: "#4ade80",
          borderColor: "rgba(34, 197, 94, 0.3)",
        };
      case "pending":
        return {
          background: "rgba(245, 158, 11, 0.1)",
          color: "#fbbf24",
          borderColor: "rgba(245, 158, 11, 0.25)",
        };
      case "inactive":
        return {
          background: "rgba(107, 114, 128, 0.08)",
          color: "var(--text-muted)",
          borderColor: "var(--border)",
        };
      case "active":
      default:
        return {
          background: "rgba(6, 182, 212, 0.12)",
          color: "#22d3ee",
          borderColor: "rgba(6, 182, 212, 0.28)",
        };
    }
  };

  const resolvedSocials = { ...Object.fromEntries(
      Object.entries(footprint).filter(([platform, meta]) => {
        if (platform === "google_business") return false;
        return Boolean(meta && typeof meta === "object" && (meta as Record<string, unknown>).url);
      }).map(([platform, meta]) => [platform, String((meta as Record<string, unknown>).url)])
    ),
    ...socials,
  } as Record<string, string | undefined>;

  const socialCount = Object.keys(resolvedSocials).filter(
    (k) => k !== "google_business" && Boolean(resolvedSocials[k])
  ).length;

  const activeFootprintCount = Object.entries(footprint).filter(([platform, meta]) => {
    if (platform === "google_business") return false;
    if (!meta || typeof meta !== "object") return false;
    return (meta as Record<string, unknown>).status !== "inactive";
  }).length;

  const visibleSocialCount = Math.max(socialCount, activeFootprintCount);

  return (
    <div
      className="card animate-fade-in overflow-hidden"
      style={{
        borderColor: "rgba(6,182,212,0.25)",
        background: "var(--bg-card)",
      }}
    >
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div
        className="flex items-start justify-between pb-4 border-b gap-3 flex-wrap min-w-0"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base shrink-0" style={{ color: "#06b6d4" }}>
              verified
            </span>
            <h2
              className="text-sm font-bold uppercase tracking-wider truncate"
              style={{ color: "var(--text-secondary)" }}
            >
              Brand Intelligence &amp; Footprint
            </h2>
          </div>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Local storefront health, live Google Places telemetry, and verified authority signals.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {hasPlaceId && onSyncGbp && (
            <button
              type="button"
              onClick={onSyncGbp}
              disabled={loadingSyncGbp}
              className="text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all whitespace-nowrap"
              style={{
                borderColor: "rgba(245,158,11,0.4)",
                background: "rgba(245,158,11,0.1)",
                color: "#fbbf24",
                cursor: loadingSyncGbp ? "wait" : "pointer",
                fontWeight: 600,
              }}
              title="Query Google Places API for real-time reviews & rating"
            >
              <span
                className={`material-symbols-outlined text-sm ${loadingSyncGbp ? "animate-spin" : ""}`}
              >
                {loadingSyncGbp ? "refresh" : "sync"}
              </span>
              {loadingSyncGbp ? "Syncing Places…" : "⚡ Sync GBP"}
            </button>
          )}

          <button
            type="button"
            onClick={onDiscoverSocials}
            disabled={loadingDiscovery}
            className="text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all whitespace-nowrap"
            style={{
              borderColor: "rgba(6,182,212,0.4)",
              background: "rgba(6,182,212,0.1)",
              color: "#22d3ee",
              cursor: loadingDiscovery ? "wait" : "pointer",
              fontWeight: 600,
            }}
            title="Auto-discover official profiles from website DOM & Schema.org data"
          >
            <span
              className={`material-symbols-outlined text-sm ${loadingDiscovery ? "animate-spin" : ""}`}
            >
              {loadingDiscovery ? "refresh" : "bolt"}
            </span>
            {loadingDiscovery ? "Scanning DOM…" : "⚡ Auto-Discover"}
          </button>
        </div>
      </div>

      {/* ── Metrics Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3.5 pt-4 min-w-0">
        {/* 1. Google Business Profile & Local Storefront */}
        <div
          className="p-3.5 rounded-xl border flex flex-col justify-between min-w-0"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border)",
          }}
        >
          <div className="min-w-0">
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <span
                className="text-2xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Local Storefront
              </span>
              <span className="material-symbols-outlined text-sm" style={{ color: "#fbbf24" }}>
                storefront
              </span>
            </div>

            {/* State A: Live Synced Rating */}
            {isSynced ? (
              <div className="mt-1">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span
                    className="text-2xl font-bold font-mono"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {rating.toFixed(1)}
                  </span>
                  <div className="flex gap-0.5 text-xs" style={{ color: "#fbbf24" }}>
                    {"★".repeat(Math.min(5, Math.max(1, Math.round(rating))))}
                  </div>
                </div>

                <p className="text-2xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {reviewCount ?? 0} Verified Customer Reviews
                </p>
              </div>
            ) : hasPlaceId ? (
              /* State B: Linked via Place ID, Awaiting initial Sync */
              <div
                className="mt-2 p-2.5 rounded-lg border min-w-0"
                style={{
                  background: "rgba(245,158,11,0.06)",
                  borderColor: "rgba(245,158,11,0.25)",
                }}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#fbbf24" }}>
                  <span className="material-symbols-outlined text-sm shrink-0">schedule</span>
                  <span className="truncate">Awaiting Initial Sync</span>
                </div>
                <p className="text-2xs mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  Place ID linked. Click <strong>Sync GBP</strong> above to pull live ratings and review counts.
                </p>
              </div>
            ) : (
              /* State C: No Place ID Linked */
              <div
                className="mt-2 p-2.5 rounded-lg border min-w-0"
                style={{
                  background: "rgba(107,114,128,0.06)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  <span className="material-symbols-outlined text-sm shrink-0">link_off</span>
                  <span>No storefront linked yet</span>
                </div>
                {onEditProfile && (
                  <button
                    type="button"
                    onClick={onEditProfile}
                    className="mt-2 text-2xs px-2.5 py-1 rounded font-semibold transition hover:opacity-85 whitespace-nowrap"
                    style={{
                      background: "rgba(6,182,212,0.15)",
                      color: "#22d3ee",
                      border: "1px solid rgba(6,182,212,0.3)",
                    }}
                  >
                    + Link Storefront / Place ID
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-3 pt-2 border-t flex items-center justify-between flex-wrap gap-2 min-w-0" style={{ borderColor: "var(--border)" }}>
            {mapUrl ? (
              <a
                href={mapUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-2xs font-medium hover:underline min-w-0 truncate"
                style={{ color: "#22d3ee" }}
              >
                <span className="material-symbols-outlined text-xs shrink-0">location_on</span>
                <span className="truncate">View on Google Maps</span>
                <span className="material-symbols-outlined text-2xs shrink-0">open_in_new</span>
              </a>
            ) : (
              <span className="text-2xs italic truncate min-w-0" style={{ color: "var(--text-muted)" }}>
                {hasPlaceId ? `Place ID: ${businessUnit.google_business_place_id?.slice(0, 14)}…` : "No Maps URL configured"}
              </span>
            )}

            {hasPlaceId && isSynced && onSyncGbp && (
              <button
                type="button"
                onClick={onSyncGbp}
                disabled={loadingSyncGbp}
                className="text-2xs hover:underline flex items-center gap-0.5 shrink-0"
                style={{ color: "var(--text-muted)" }}
                title="Refresh live reviews from Google Places API"
              >
                <span className="material-symbols-outlined text-2xs">sync</span>
                Refresh
              </button>
            )}
          </div>
        </div>

        {/* 2. Connected Digital Properties & Schema Metrics */}
        <div
          className="p-3.5 rounded-xl border flex flex-col justify-between min-w-0"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border)",
          }}
        >
          <div className="min-w-0">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="text-2xs font-semibold uppercase tracking-wider truncate"
                  style={{ color: "var(--text-muted)" }}
                >
                  Connected Digital Properties
                </span>
                {visibleSocialCount > 0 && (
                  <span
                    className="text-2xs px-1.5 py-0.5 rounded-full font-bold shrink-0"
                    style={{
                      background: "rgba(16,185,129,0.15)",
                      color: "#34d399",
                    }}
                  >
                    {visibleSocialCount} Active
                  </span>
                )}
              </div>

              {/* Schema badge */}
              <div className="flex items-center gap-1.5 text-2xs shrink-0">
                <span className="material-symbols-outlined text-xs shrink-0" style={{ color: "#06b6d4" }}>
                  schema
                </span>
                <span style={{ color: "var(--text-muted)" }}>Schema:</span>
                <span className="font-mono font-medium truncate max-w-[130px]" style={{ color: "var(--text-primary)" }}>
                  {schemaType}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2 min-w-0">
              {Object.keys(resolvedSocials).filter((platform) => platform !== "google_business" && Boolean(resolvedSocials[platform])).length === 0 ? (
                <div
                  className="p-3 rounded-lg border w-full text-center min-w-0"
                  style={{
                    background: "rgba(107,114,128,0.04)",
                    borderColor: "var(--border)",
                  }}
                >
                  <p className="text-xs italic leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    No social profiles discovered yet. Click &ldquo;Auto-Discover&rdquo; above to scan DOM &amp; Schema.org metadata.
                  </p>
                </div>
              ) : (
                Object.entries(resolvedSocials).map(([platform, url]) => {
                  if (!url || platform === "google_business") return null;
                  const status = getPlatformStatus(platform);
                  const statusStyles = getStatusColor(status);
                  return (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all hover:opacity-85 max-w-full"
                      style={{
                        background: "var(--bg-card)",
                        borderColor: "var(--border)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <span className="capitalize font-semibold truncate" style={{ color: "#22d3ee" }}>
                        {platform}
                      </span>
                      <span
                        className="text-2xs font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border"
                        style={{
                          background: statusStyles.background,
                          color: statusStyles.color,
                          borderColor: statusStyles.borderColor,
                        }}
                      >
                        {status}
                      </span>
                      <span className="material-symbols-outlined text-2xs opacity-60 shrink-0">open_in_new</span>
                    </a>
                  );
                })
              )}
            </div>
          </div>

          <div
            className="flex items-center justify-between text-2xs mt-3 pt-2 border-t flex-wrap gap-2 min-w-0"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: "#34d399" }}
              />
              <span className="leading-tight">
                Auto-extracted via Schema.org JSON-LD &amp; DOM Parser
              </span>
            </div>

            {footprint.google_business?.status && (
              <span className="font-mono text-2xs shrink-0" style={{ color: "#34d399" }}>
                GBP: {footprint.google_business.status.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
