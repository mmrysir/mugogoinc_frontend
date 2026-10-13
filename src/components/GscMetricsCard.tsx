"use client";

import React from "react";
import { GscMetrics, GscQueryRow } from "@/lib/api";

// ── Helpers ──────────────────────────────────────────────────────────────────

function KpiTile({
  icon,
  label,
  value,
  sub,
  color = "#22d3ee",
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div
      className="p-3.5 rounded-xl border flex flex-col gap-1 min-w-0"
      style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center gap-1.5">
        <span className="material-symbols-outlined text-sm shrink-0" style={{ color }}>
          {icon}
        </span>
        <span
          className="text-2xs font-semibold uppercase tracking-wider truncate"
          style={{ color: "var(--text-muted)" }}
        >
          {label}
        </span>
      </div>
      <div
        className="text-xl font-bold font-mono leading-tight"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </div>
      {sub && (
        <div className="text-2xs" style={{ color: "var(--text-muted)" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function PositionBar({ position }: { position: number }) {
  // position 1 = best, 100+ = worst. Map to a width 0–100%.
  const clamped = Math.min(Math.max(position, 1), 50);
  const pct = Math.max(5, 100 - ((clamped - 1) / 49) * 100);
  const color =
    position <= 3
      ? "#34d399"
      : position <= 10
      ? "#fbbf24"
      : "#fb7185";
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <div
        className="h-1.5 rounded-full shrink-0"
        style={{
          width: `${pct}%`,
          maxWidth: "4rem",
          background: color,
          minWidth: "0.25rem",
        }}
      />
      <span className="text-2xs font-mono" style={{ color }}>
        #{position.toFixed(1)}
      </span>
    </div>
  );
}

// ── Unlinked State ────────────────────────────────────────────────────────────

interface UnlinkedProps {
  buId: string;
  hasSiteConfigured: boolean;
  onConnectGsc: () => void;
  onEditProfile?: () => void;
}

function GscUnlinkedState({
  hasSiteConfigured,
  onConnectGsc,
  onEditProfile,
}: UnlinkedProps) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center py-6 px-4 gap-4 rounded-xl border"
      style={{
        background: "rgba(245,158,11,0.04)",
        borderColor: "rgba(245,158,11,0.2)",
        borderStyle: "dashed",
      }}
    >
      <span
        className="material-symbols-outlined text-4xl"
        style={{ color: "#fbbf24", opacity: 0.8 }}
      >
        travel_explore
      </span>

      {hasSiteConfigured ? (
        <>
          <div>
            <p
              className="text-sm font-semibold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              Connect Google Search Console
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Authorise access to view Search Analytics — Clicks, Impressions, CTR, and
              Average Position for this verified property.
            </p>
          </div>
          <button
            id="gsc-connect-btn"
            type="button"
            onClick={onConnectGsc}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
            style={{
              background: "rgba(245,158,11,0.18)",
              color: "#fbbf24",
              border: "1px solid rgba(245,158,11,0.4)",
            }}
          >
            <span className="material-symbols-outlined text-base">link</span>
            Connect Google Search Console
          </button>
        </>
      ) : (
        <>
          <div>
            <p
              className="text-sm font-semibold mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              No GSC Property Configured
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Add a verified Google Search Console property URL in the Business Profile
              to enable the OAuth connection.
            </p>
          </div>
          {onEditProfile && (
            <button
              type="button"
              onClick={onEditProfile}
              className="text-xs px-3 py-1.5 rounded-lg border transition-all hover:opacity-85"
              style={{
                borderColor: "rgba(6,182,212,0.3)",
                background: "rgba(6,182,212,0.1)",
                color: "#22d3ee",
              }}
            >
              + Add GSC Property
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── Metrics Table ─────────────────────────────────────────────────────────────

function GscQueryTable({ rows }: { rows: GscQueryRow[] }) {
  if (!rows || rows.length === 0) {
    return (
      <p className="text-xs text-center py-4 italic" style={{ color: "var(--text-muted)" }}>
        No query data available for the selected date range.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
      <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr
            style={{
              background: "var(--bg-elevated)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <th
              className="text-left px-3 py-2 font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Query
            </th>
            <th
              className="text-right px-3 py-2 font-semibold uppercase tracking-wider whitespace-nowrap"
              style={{ color: "var(--text-muted)" }}
            >
              Clicks
            </th>
            <th
              className="text-right px-3 py-2 font-semibold uppercase tracking-wider whitespace-nowrap"
              style={{ color: "var(--text-muted)" }}
            >
              Impressions
            </th>
            <th
              className="text-right px-3 py-2 font-semibold uppercase tracking-wider whitespace-nowrap"
              style={{ color: "var(--text-muted)" }}
            >
              CTR
            </th>
            <th
              className="px-3 py-2 font-semibold uppercase tracking-wider whitespace-nowrap"
              style={{ color: "var(--text-muted)" }}
            >
              Position
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={`${row.query}-${idx}`}
              style={{
                borderBottom: idx < rows.length - 1 ? "1px solid var(--border)" : "none",
                background:
                  idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
              }}
            >
              <td className="px-3 py-2 max-w-[180px]">
                <span
                  className="block truncate font-medium"
                  style={{ color: "var(--text-primary)" }}
                  title={row.query}
                >
                  {row.query}
                </span>
                {row.page && (
                  <a
                    href={row.page}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-2xs hover:underline"
                    style={{ color: "var(--text-muted)" }}
                    title={row.page}
                  >
                    {row.page.replace(/^https?:\/\//, "").slice(0, 40)}
                    {row.page.length > 50 ? "…" : ""}
                  </a>
                )}
              </td>
              <td className="px-3 py-2 text-right font-mono" style={{ color: "#22d3ee" }}>
                {row.clicks.toLocaleString()}
              </td>
              <td
                className="px-3 py-2 text-right font-mono"
                style={{ color: "var(--text-secondary)" }}
              >
                {row.impressions.toLocaleString()}
              </td>
              <td
                className="px-3 py-2 text-right font-mono"
                style={{ color: row.ctr >= 5 ? "#34d399" : "var(--text-secondary)" }}
              >
                {row.ctr.toFixed(1)}%
              </td>
              <td className="px-3 py-2">
                <PositionBar position={row.position} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Card ─────────────────────────────────────────────────────────────────

export interface GscMetricsCardProps {
  buId: string;
  siteUrl?: string | null;
  gscConnected: boolean;
  gscMetrics?: GscMetrics | null;
  onConnectGsc: () => void;
  onSyncGsc: () => void;
  onDisconnect?: () => void;
  loadingSync: boolean;
  onEditProfile?: () => void;
}

export default function GscMetricsCard({
  buId,
  siteUrl,
  gscConnected,
  gscMetrics,
  onConnectGsc,
  onSyncGsc,
  onDisconnect,
  loadingSync,
  onEditProfile,
}: GscMetricsCardProps) {
  const summary = gscMetrics?.summary;
  const topQueries = gscMetrics?.top_queries ?? [];
  const hasData = Boolean(summary && summary.rows_returned > 0);

  return (
    <div
      className="card animate-fade-in overflow-hidden"
      style={{
        borderColor: gscConnected
          ? "rgba(245,158,11,0.3)"
          : "rgba(107,114,128,0.2)",
        background: gscConnected
          ? "rgba(245,158,11,0.03)"
          : "var(--bg-card)",
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        className="flex items-start justify-between pb-4 border-b gap-3 flex-wrap min-w-0"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-base shrink-0"
              style={{ color: gscConnected ? "#fbbf24" : "var(--text-muted)" }}
            >
              travel_explore
            </span>
            <h2
              className="text-sm font-bold uppercase tracking-wider truncate"
              style={{ color: "var(--text-secondary)" }}
            >
              Google Search Console
            </h2>
            {gscConnected && (
              <span
                className="text-2xs px-1.5 py-0.5 rounded-full font-bold shrink-0"
                style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80" }}
              >
                Connected
              </span>
            )}
          </div>
          {siteUrl && (
            <p
              className="text-2xs mt-1 font-mono truncate"
              style={{ color: "var(--text-muted)" }}
            >
              {siteUrl}
            </p>
          )}
          {summary?.date_range && (
            <p className="text-2xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {summary.date_range.start} → {summary.date_range.end}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {gscConnected && (
            <>
              <button
                id="gsc-sync-btn"
                type="button"
                onClick={onSyncGsc}
                disabled={loadingSync}
                className="text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all whitespace-nowrap"
                style={{
                  borderColor: "rgba(245,158,11,0.4)",
                  background: "rgba(245,158,11,0.1)",
                  color: "#fbbf24",
                  cursor: loadingSync ? "wait" : "pointer",
                  fontWeight: 600,
                }}
              >
                <span
                  className={`material-symbols-outlined text-sm ${
                    loadingSync ? "animate-spin" : ""
                  }`}
                >
                  {loadingSync ? "refresh" : "sync"}
                </span>
                {loadingSync ? "Syncing…" : "⚡ Sync Now"}
              </button>

              {onDisconnect && (
                <button
                  id="gsc-disconnect-btn"
                  type="button"
                  onClick={onDisconnect}
                  className="text-xs px-2 py-1.5 rounded-lg border flex items-center gap-1 transition-all whitespace-nowrap"
                  style={{
                    borderColor: "rgba(107,114,128,0.3)",
                    background: "transparent",
                    color: "var(--text-muted)",
                    fontWeight: 500,
                  }}
                  title="Disconnect Google Search Console"
                >
                  <span className="material-symbols-outlined text-sm">link_off</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="pt-4 space-y-4 min-w-0">
        {!gscConnected ? (
          <GscUnlinkedState
            buId={buId}
            hasSiteConfigured={Boolean(siteUrl)}
            onConnectGsc={onConnectGsc}
            onEditProfile={onEditProfile}
          />
        ) : !hasData ? (
          /* Connected but no data yet */
          <div
            className="flex flex-col items-center gap-3 py-5 text-center rounded-xl border"
            style={{
              background: "rgba(245,158,11,0.05)",
              borderColor: "rgba(245,158,11,0.2)",
            }}
          >
            <span className="material-symbols-outlined text-3xl" style={{ color: "#fbbf24" }}>
              hourglass_empty
            </span>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                No data yet
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Click <strong>Sync Now</strong> to pull the latest Search Analytics data.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* KPI grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <KpiTile
                icon="ads_click"
                label="Total Clicks"
                value={summary!.total_clicks.toLocaleString()}
                color="#22d3ee"
              />
              <KpiTile
                icon="visibility"
                label="Impressions"
                value={summary!.total_impressions.toLocaleString()}
                color="#a78bfa"
              />
              <KpiTile
                icon="percent"
                label="Avg. CTR"
                value={`${summary!.avg_ctr_pct.toFixed(1)}%`}
                sub="click-through rate"
                color="#34d399"
              />
              <KpiTile
                icon="leaderboard"
                label="Avg. Position"
                value={`#${summary!.avg_position.toFixed(1)}`}
                sub={
                  summary!.avg_position <= 3
                    ? "Top 3 🔥"
                    : summary!.avg_position <= 10
                    ? "Page 1"
                    : "Page 2+"
                }
                color={
                  summary!.avg_position <= 3
                    ? "#34d399"
                    : summary!.avg_position <= 10
                    ? "#fbbf24"
                    : "#fb7185"
                }
              />
            </div>

            {/* Top queries table */}
            <div>
              <div
                className="flex items-center justify-between mb-2"
                style={{ color: "var(--text-muted)" }}
              >
                <span className="text-2xs font-semibold uppercase tracking-wider">
                  Top Search Queries
                </span>
                <span className="text-2xs font-mono">
                  {topQueries.length} queries · last 28 days
                </span>
              </div>
              <GscQueryTable rows={topQueries} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
