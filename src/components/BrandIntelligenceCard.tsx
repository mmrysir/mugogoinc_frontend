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

  const socialCount = Object.keys(socials).filter(
    (k) => k !== "google_business" && Boolean(socials[k])
  ).length;

  return (
    <div
      className="card animate-fade-in"
      style={{
        borderColor: "rgba(6,182,212,0.25)",
        background: "var(--bg-card)",
      }}
    >
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div
        className="flex items-start justify-between pb-4 border-b gap-3 flex-wrap"
        style={{ borderColor: "var(--border)" }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base" style={{ color: "#06b6d4" }}>
              verified
            </span>
            <h2
              className="text-sm font-bold uppercase tracking-wider"
              style={{ color: "var(--text-secondary)" }}
            >
              Brand Intelligence &amp; Footprint
            </h2>
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Local storefront health, live Google Places telemetry, and verified authority signals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasPlaceId && onSyncGbp && (
            <button
              type="button"
              onClick={onSyncGbp}
              disabled={loadingSyncGbp}
              className="text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all"
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
            className="text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all"
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-4">
        {/* 1. Google Business Profile & Local Storefront */}
        <div
          className="p-3.5 rounded-xl border flex flex-col justify-between"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border)",
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
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
                <div className="flex items-baseline gap-2">
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
                className="mt-2 p-2.5 rounded-lg border"
                style={{
                  background: "rgba(245,158,11,0.06)",
                  borderColor: "rgba(245,158,11,0.25)",
                }}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#fbbf24" }}>
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  Awaiting Initial Sync
                </div>
                <p className="text-2xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Place ID linked. Click <strong>Sync GBP</strong> above to pull live ratings and review counts.
                </p>
              </div>
            ) : (
              /* State C: No Place ID Linked */
              <div
                className="mt-2 p-2.5 rounded-lg border"
                style={{
                  background: "rgba(107,114,128,0.06)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  <span className="material-symbols-outlined text-sm">link_off</span>
                  No storefront linked yet
                </div>
                {onEditProfile && (
                  <button
                    type="button"
                    onClick={onEditProfile}
                    className="mt-2 text-2xs px-2.5 py-1 rounded font-semibold transition hover:opacity-85"
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

          <div className="mt-3 pt-2 border-t flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            {mapUrl ? (
              <a
                href={mapUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-2xs font-medium hover:underline"
                style={{ color: "#22d3ee" }}
              >
                <span className="material-symbols-outlined text-xs">location_on</span>
                View on Google Maps
                <span className="material-symbols-outlined text-2xs">open_in_new</span>
              </a>
            ) : (
              <span className="text-2xs italic" style={{ color: "var(--text-muted)" }}>
                {hasPlaceId ? `Place ID: ${businessUnit.google_business_place_id?.slice(0, 14)}…` : "No Maps URL configured"}
              </span>
            )}

            {hasPlaceId && isSynced && onSyncGbp && (
              <button
                type="button"
                onClick={onSyncGbp}
                disabled={loadingSyncGbp}
                className="text-2xs hover:underline flex items-center gap-0.5"
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
          className="p-3.5 rounded-xl border md:col-span-2 flex flex-col justify-between"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border)",
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="text-2xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Connected Digital Properties
                </span>
                {socialCount > 0 && (
                  <span
                    className="text-2xs px-1.5 py-0.5 rounded-full font-bold"
                    style={{
                      background: "rgba(16,185,129,0.15)",
                      color: "#34d399",
                    }}
                  >
                    {socialCount} Active
                  </span>
                )}
              </div>

              {/* Schema badge */}
              <div className="flex items-center gap-1.5 text-2xs">
                <span className="material-symbols-outlined text-xs" style={{ color: "#06b6d4" }}>
                  schema
                </span>
                <span style={{ color: "var(--text-muted)" }}>Schema.org:</span>
                <span className="font-mono font-medium" style={{ color: "var(--text-primary)" }}>
                  {schemaType}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2">
              {Object.keys(socials).length === 0 ? (
                <div
                  className="p-3 rounded-lg border w-full text-center"
                  style={{
                    background: "rgba(107,114,128,0.04)",
                    borderColor: "var(--border)",
                  }}
                >
                  <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>
                    No social profiles discovered yet. Click &ldquo;Auto-Discover&rdquo; above to scan DOM &amp; Schema.org metadata.
                  </p>
                </div>
              ) : (
                Object.entries(socials).map(([platform, url]) => {
                  if (!url || platform === "google_business") return null;
                  return (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all hover:opacity-85"
                      style={{
                        background: "var(--bg-card)",
                        borderColor: "var(--border)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <span className="capitalize font-semibold" style={{ color: "#22d3ee" }}>
                        {platform}
                      </span>
                      <span className="material-symbols-outlined text-2xs opacity-60">open_in_new</span>
                    </a>
                  );
                })
              )}
            </div>
          </div>

          <div
            className="flex items-center justify-between text-2xs mt-3 pt-2 border-t flex-wrap gap-2"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: "#34d399" }}
              />
              Auto-extracted via Schema.org JSON-LD &amp; Footer DOM Parser
            </div>

            {footprint.google_business?.status && (
              <span className="font-mono text-2xs" style={{ color: "#34d399" }}>
                GBP: {footprint.google_business.status.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
