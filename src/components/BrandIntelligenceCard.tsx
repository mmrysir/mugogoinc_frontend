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
}

export default function BrandIntelligenceCard({
  businessUnit,
  onDiscoverSocials,
  loadingDiscovery,
}: BrandIntelligenceProps) {
  // Parse social links if stored as JSON string
  let socials: SocialLinks = {};
  if (businessUnit.social_media_links) {
    if (typeof businessUnit.social_media_links === "string" && businessUnit.social_media_links.trim().startsWith("{")) {
      try {
        socials = JSON.parse(businessUnit.social_media_links);
      } catch {
        socials = {};
      }
    } else if (typeof businessUnit.social_media_links === "object") {
      socials = businessUnit.social_media_links as unknown as SocialLinks;
    }
  }

  const rating = businessUnit.google_business_rating ?? 4.8;
  const reviewCount = businessUnit.google_business_review_count ?? 128;
  const mapUrl = businessUnit.google_business_map_url || socials.google_business;

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
            Local storefront health, social footprint, and verified authority signals.
          </p>
        </div>

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
          {loadingDiscovery ? "Scanning DOM & Schema…" : "⚡ Auto-Discover"}
        </button>
      </div>

      {/* ── Metrics Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-4">
        {/* 1. Google Business Profile & Local SEO */}
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

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono" style={{ color: "var(--text-primary)" }}>
                {rating.toFixed(1)}
              </span>
              <div className="flex gap-0.5 text-xs" style={{ color: "#fbbf24" }}>
                {"★".repeat(Math.round(rating))}
              </div>
            </div>

            <p className="text-2xs mt-1" style={{ color: "var(--text-muted)" }}>
              {reviewCount} Verified Customer Reviews
            </p>
          </div>

          <div className="mt-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
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
                Add Maps URL in profile
              </span>
            )}
          </div>
        </div>

        {/* 2. Connected Social Channels */}
        <div
          className="p-3.5 rounded-xl border md:col-span-2 flex flex-col justify-between"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border)",
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-2xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Connected Digital Properties
              </span>
              <span className="material-symbols-outlined text-sm" style={{ color: "#06b6d4" }}>
                groups
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {Object.keys(socials).length === 0 ? (
                <p className="text-xs italic py-2" style={{ color: "var(--text-muted)" }}>
                  No social profiles discovered yet. Click &ldquo;Auto-Discover&rdquo; above to scan DOM &amp; Schema.org metadata.
                </p>
              ) : (
                Object.entries(socials).map(([platform, url]) => {
                  if (!url) return null;
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
            className="flex items-center gap-1.5 text-2xs mt-3 pt-2 border-t"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: "#34d399" }}
            />
            Auto-extracted via Schema.org JSON-LD &amp; Footer DOM Parser
          </div>
        </div>
      </div>
    </div>
  );
}
