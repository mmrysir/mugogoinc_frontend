"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  api,
  Lead,
  BusinessUnit,
  DeliveryStatus,
  SourceChannel,
} from "@/lib/api";
import Icon from "@/components/Icon";
import Sidebar from "@/components/Sidebar";
import { StatusBadge, ChannelBadge } from "@/components/Badges";

// ── Date-range helpers ────────────────────────────────────────────────────────

type RangeKey = "today" | "1w" | "1m" | "3m" | "6m" | "1y" | "custom";

interface DateRange {
  from: string | undefined; // ISO string
  to: string | undefined;
}

const RANGE_LABELS: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "1w", label: "1 Week" },
  { key: "1m", label: "1 Month" },
  { key: "3m", label: "3 Months" },
  { key: "6m", label: "6 Months" },
  { key: "1y", label: "1 Year" },
  { key: "custom", label: "Custom" },
];

function resolveRange(key: RangeKey, custom: { from: string; to: string }): DateRange {
  const now = new Date();
  const end = now.toISOString();

  if (key === "custom") {
    return {
      from: custom.from ? new Date(custom.from).toISOString() : undefined,
      to: custom.to ? new Date(custom.to + "T23:59:59").toISOString() : undefined,
    };
  }

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const offsets: Record<Exclude<RangeKey, "custom">, number> = {
    today: 0,
    "1w": 7,
    "1m": 30,
    "3m": 90,
    "6m": 180,
    "1y": 365,
  };
  const days = offsets[key as Exclude<RangeKey, "custom">];
  const from = new Date(startOfToday);
  from.setDate(from.getDate() - days);
  return { from: from.toISOString(), to: end };
}

// ── Lead Detail Slide-Over ────────────────────────────────────────────────────

function LeadSlideOver({
  lead,
  onClose,
}: {
  lead: Lead;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const rows: [string, string][] = [
    ["Phone", lead.phone_number],
    ["Email", lead.email || "—"],
    ["Business Unit", lead.business_unit_id],
    ["Source Channel", lead.source_channel.replace(/_/g, " ")],
    ["Delivery Status", lead.delivery_status],
    ["CRM Status", lead.crm_forward_status.replace(/_/g, " ")],
    [
      "Received",
      new Date(lead.created_at).toLocaleString("en-KE", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    ],
  ];

  if (lead.utm_source) rows.push(["UTM Source", lead.utm_source]);
  if (lead.utm_medium) rows.push(["UTM Medium", lead.utm_medium]);
  if (lead.utm_campaign) rows.push(["UTM Campaign", lead.utm_campaign]);
  if (lead.gclid) rows.push(["GCLID", lead.gclid]);
  if (lead.fbclid) rows.push(["FBCLID", lead.fbclid]);

  return (
    <>
      {/* Overlay */}
      <div
        className="slide-over-backdrop"
        onClick={onClose}
        aria-label="Close lead details"
      />
      {/* Panel */}
      <aside className="slide-over-panel" role="dialog" aria-modal="true" aria-label="Lead Details">
        {/* Header */}
        <div className="slide-over-header">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              {lead.full_name}
            </h2>
            <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
              {lead.id}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge value={lead.delivery_status} />
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: "0.35rem", borderRadius: 8 }}
              onClick={onClose}
              aria-label="Close"
            >
              <Icon name="close" />
            </button>
          </div>
        </div>

        <div className="slide-over-body">
          {/* Contact card */}
          <div
            className="rounded-xl p-4 mb-5"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-base"
                style={{
                  background: "rgba(6,182,212,0.15)",
                  color: "var(--accent-blue)",
                }}
              >
                {lead.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <div className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  {lead.full_name}
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {lead.email || lead.phone_number}
                </div>
              </div>
            </div>
            <ChannelBadge channel={lead.source_channel} />
          </div>

          {/* Detail rows */}
          <div className="space-y-3">
            {rows.map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between items-start gap-4 text-sm py-2"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <span style={{ color: "var(--text-muted)", flexShrink: 0, minWidth: 110 }}>
                  {label}
                </span>
                <span
                  className="font-mono text-right"
                  style={{ color: "var(--text-primary)", wordBreak: "break-all" }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Payload meta */}
          {Object.keys(lead.payload_meta).length > 0 && (
            <div className="mt-5">
              <div
                className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: "var(--text-muted)" }}
              >
                Payload Meta
              </div>
              <pre
                className="rounded-xl p-3 text-xs font-mono overflow-auto"
                style={{
                  background: "var(--bg-base)",
                  color: "var(--accent-cyan)",
                  maxHeight: 180,
                  border: "1px solid var(--border)",
                }}
              >
                {JSON.stringify(lead.payload_meta, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const STATUSES: DeliveryStatus[] = ["PENDING", "DELIVERED", "FAILED"];
const CHANNELS: SourceChannel[] = [
  "LANDING_PAGE",
  "META_LEAD_AD",
  "GOOGLE_ADS",
  "TIKTOK",
  "SMS",
];

export default function BuLeadsPage() {
  const params = useParams<{ buId: string }>();
  const router = useRouter();
  const buId = params.buId;

  const [bu, setBu] = useState<BusinessUnit | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Filters
  const [rangeKey, setRangeKey] = useState<RangeKey>("1m");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [filterStatus, setFilterStatus] = useState<DeliveryStatus | "">("");
  const [filterChannel, setFilterChannel] = useState<SourceChannel | "">("");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  // Fetch BU details
  useEffect(() => {
    api.businessUnits.get(buId).then(setBu).catch(() => {});
  }, [buId]);

  const fetchLeads = useCallback(async () => {
    const range = resolveRange(rangeKey, { from: customFrom, to: customTo });
    try {
      const data = await api.leads.list({
        business_unit_id: buId,
        delivery_status: (filterStatus as DeliveryStatus) || undefined,
        source_channel: (filterChannel as SourceChannel) || undefined,
        date_from: range.from,
        date_to: range.to,
        skip: page * PAGE_SIZE,
        limit: PAGE_SIZE,
      });
      setLeads(data.items);
      setTotal(data.total);
      setError(null);
    } catch {
      setError("Cannot reach API.");
    } finally {
      setLoading(false);
    }
  }, [buId, rangeKey, customFrom, customTo, filterStatus, filterChannel, page]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(fetchLeads, 0);
    const interval = setInterval(fetchLeads, 20_000);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, [fetchLeads]);

  const openLead = async (leadId: string) => {
    setDetailLoading(true);
    try {
      const lead = await api.leads.get(leadId);
      setSelectedLead(lead);
    } catch {
      alert("Failed to load lead details.");
    } finally {
      setDetailLoading(false);
    }
  };

  // Client-side search filter
  const displayed = searchQuery
    ? leads.filter(
        (l) =>
          l.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.phone_number.includes(searchQuery) ||
          (l.email && l.email.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : leads;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-1 animate-fade-in">
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: "0.35rem 0.6rem", borderRadius: 8 }}
            onClick={() => router.back()}
            aria-label="Go back"
          >
            <Icon name="arrow_back" />
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {bu ? bu.name : "Business Unit"} — Leads
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {total.toLocaleString()} lead{total !== 1 ? "s" : ""} · auto-refreshes every 20s
            </p>
          </div>
        </div>

        <div className="accent-line my-5" />

        {/* ── Time Range Pills ── */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {RANGE_LABELS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              id={`range-${key}`}
              className={`range-pill${rangeKey === key ? " active" : ""}`}
              onClick={() => {
                setRangeKey(key);
                setShowCustom(key === "custom");
                setPage(0);
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Custom date inputs ── */}
        {showCustom && (
          <div className="flex gap-3 flex-wrap mb-4 animate-fade-in">
            <div>
              <label className="form-label" htmlFor="custom-from">From</label>
              <input
                id="custom-from"
                type="date"
                className="form-input"
                style={{ width: 170 }}
                value={customFrom}
                onChange={(e) => { setCustomFrom(e.target.value); setPage(0); }}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="custom-to">To</label>
              <input
                id="custom-to"
                type="date"
                className="form-input"
                style={{ width: 170 }}
                value={customTo}
                onChange={(e) => { setCustomTo(e.target.value); setPage(0); }}
              />
            </div>
          </div>
        )}

        {/* ── Secondary Filters ── */}
        <div className="flex flex-wrap gap-2 mb-6">
          <input
            id="lead-search"
            className="form-input"
            style={{ width: 220 }}
            placeholder="Search name, phone, email…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            id="filter-status"
            className="form-select"
            style={{ width: "auto" }}
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value as DeliveryStatus | ""); setPage(0); }}
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            id="filter-channel"
            className="form-select"
            style={{ width: "auto" }}
            value={filterChannel}
            onChange={(e) => { setFilterChannel(e.target.value as SourceChannel | ""); setPage(0); }}
          >
            <option value="">All Channels</option>
            {CHANNELS.map((c) => (
              <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>

        {/* ── Summary Stats ── */}
        <div className="flex gap-3 flex-wrap mb-6">
          {[
            {
              label: "Total",
              value: total,
              icon: "group",
              color: "var(--accent-blue)",
            },
            {
              label: "Delivered",
              value: leads.filter((l) => l.delivery_status === "DELIVERED").length,
              icon: "check_circle",
              color: "#34d399",
            },
            {
              label: "Pending",
              value: leads.filter((l) => l.delivery_status === "PENDING").length,
              icon: "schedule",
              color: "#fbbf24",
            },
            {
              label: "Failed",
              value: leads.filter((l) => l.delivery_status === "FAILED").length,
              icon: "cancel",
              color: "#fb7185",
            },
          ].map(({ label, value, icon, color }) => (
            <div
              key={label}
              className="kpi-card flex items-center gap-3"
              style={{ flex: "1 1 130px", minWidth: 130, padding: "0.875rem 1.25rem" }}
            >
              <span
                className="material-symbols-outlined"
                style={{ color, fontSize: 24 }}
              >
                {icon}
              </span>
              <div>
                <div
                  className="text-xl font-extrabold"
                  style={{ color, letterSpacing: "-0.03em" }}
                >
                  {value.toLocaleString()}
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Error ── */}
        {error && (
          <div
            className="card mb-4"
            style={{
              borderColor: "rgba(244,63,94,0.3)",
              background: "rgba(244,63,94,0.06)",
            }}
          >
            <p className="text-sm" style={{ color: "#fb7185" }}>
              <Icon name="warning" className="mr-2" /> {error}
            </p>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
            <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32 }}>
              autorenew
            </span>
            <p className="mt-2 text-sm">Loading leads…</p>
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && displayed.length === 0 && !error && (
          <div className="card text-center py-16">
            <div
              className="material-symbols-outlined mb-4"
              style={{ fontSize: 48, color: "var(--text-muted)" }}
            >
              flash_on
            </div>
            <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              No leads found
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Try a wider date range or different filters.
            </p>
          </div>
        )}

        {/* ── Table ── */}
        {!loading && displayed.length > 0 && (
          <div className="card animate-slide-up" style={{ padding: 0, overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Channel</th>
                  <th>Status</th>
                  <th>CRM</th>
                  <th>Received</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((lead, idx) => (
                  <tr
                    key={lead.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => openLead(lead.id)}
                  >
                    <td>
                      <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                        {page * PAGE_SIZE + idx + 1}
                      </span>
                    </td>
                    <td>
                      <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                        {lead.full_name}
                      </span>
                      {lead.email && (
                        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {lead.email}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="font-mono text-xs">{lead.phone_number}</span>
                    </td>
                    <td>
                      <ChannelBadge channel={lead.source_channel} />
                    </td>
                    <td>
                      <StatusBadge value={lead.delivery_status} />
                    </td>
                    <td>
                      <StatusBadge value={lead.crm_forward_status} />
                    </td>
                    <td>
                      <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                        {new Date(lead.created_at).toLocaleString("en-KE", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ padding: "0.25rem 0.7rem", fontSize: "0.75rem" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openLead(lead.id);
                        }}
                        aria-label={`View lead ${lead.full_name}`}
                      >
                        {detailLoading ? "…" : "View"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Page {page + 1} of {totalPages} · {total.toLocaleString()} leads
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ padding: "0.3rem 0.7rem", fontSize: "0.8rem" }}
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <Icon name="chevron_left" /> Prev
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ padding: "0.3rem 0.7rem", fontSize: "0.8rem" }}
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  >
                    Next <Icon name="chevron_right" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Lead Detail Slide-Over ── */}
        {selectedLead && (
          <LeadSlideOver
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
          />
        )}
      </main>
    </div>
  );
}
