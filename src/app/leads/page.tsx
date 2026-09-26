"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api, Lead, DeliveryStatus, SourceChannel } from "@/lib/api";
import Icon from "@/components/Icon";
import Sidebar from "@/components/Sidebar";
import { StatusBadge, ChannelBadge } from "@/components/Badges";

const STATUSES: DeliveryStatus[] = ["PENDING", "DELIVERED", "FAILED"];
const CHANNELS: SourceChannel[] = [
  "LANDING_PAGE",
  "META_LEAD_AD",
  "GOOGLE_ADS",
  "TIKTOK",
  "SMS",
];

function LeadDetail({ lead }: { lead: Lead }) {
  return (
    <div className="modal-backdrop" onClick={(e) => e.stopPropagation()}>
      <div className="modal-box" style={{ maxWidth: 600 }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              {lead.full_name}
            </h2>
            <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{lead.id}</span>
          </div>
          <StatusBadge value={lead.delivery_status} />
        </div>
        <div className="space-y-2 mb-4">
          {[
            [<><Icon name="smartphone" className="mr-2" /> Phone</>, lead.phone_number],
            [<><Icon name="email" className="mr-2" /> Email</>, lead.email || "—"],
            [<><Icon name="public" className="mr-2" /> Channel</>, lead.source_channel],
            [<><Icon name="apartment" className="mr-2" /> BU ID</>, lead.business_unit_id],
            [<><Icon name="calendar_today" className="mr-2" /> Received</>, new Date(lead.created_at).toLocaleString()],
            [<><Icon name="settings_phone" className="mr-2" /> CRM Status</>, lead.crm_forward_status],
          ].map(([label, value], idx) => (
            <div key={String(idx)} className="flex gap-4 text-sm">
              <span style={{ color: "var(--text-muted)", minWidth: 120 }}>{label}</span>
              <span className="font-mono" style={{ color: "var(--text-primary)" }}>{value as string}</span>
            </div>
          ))}
        </div>
        {Object.keys(lead.payload_meta).length > 0 && (
          <div className="rounded-xl p-3 text-xs font-mono overflow-auto"
            style={{ background: "var(--bg-base)", color: "var(--accent-cyan)", maxHeight: 160 }}>
            {JSON.stringify(lead.payload_meta, null, 2)}
          </div>
        )}
      </div>
    </div>
  );
}

function LeadFeedInner() {
  const searchParams = useSearchParams();
  const buIdParam = searchParams.get("business_unit_id") || undefined;

  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const openLead = async (leadId: string) => {
    setDetailLoading(true);
    try {
      const lead = await api.leads.get(leadId);
      setSelectedLead(lead);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to load lead");
    } finally {
      setDetailLoading(false);
    }
  };

  const [filterStatus, setFilterStatus] = useState<DeliveryStatus | "">("");
  const [filterChannel, setFilterChannel] = useState<SourceChannel | "">("");
  const [filterBuId, setFilterBuId] = useState(buIdParam || "");

  const fetchLeads = useCallback(async () => {
    try {
      const data = await api.leads.list({
        business_unit_id: filterBuId || undefined,
        delivery_status: (filterStatus as DeliveryStatus) || undefined,
        source_channel: (filterChannel as SourceChannel) || undefined,
        limit: 100,
      });
      setLeads(data.items);
      setTotal(data.total);
      setError(null);
    } catch {
      setError("Cannot reach API.");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterChannel, filterBuId]);

  useEffect(() => {
    const initial = setTimeout(fetchLeads, 0);
    const interval = setInterval(fetchLeads, 15000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [fetchLeads]);

  return (
    <>
      <div className="flex items-center justify-between mb-6 animate-fade-in flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            Lead Feed
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            {total} lead{total !== 1 ? "s" : ""} · live polling every 15s
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            id="filter-status"
            className="form-select"
            style={{ width: "auto" }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as DeliveryStatus | "")}
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            id="filter-channel"
            className="form-select"
            style={{ width: "auto" }}
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value as SourceChannel | "")}
          >
            <option value="">All Channels</option>
            {CHANNELS.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
          </select>
          <input
            id="filter-bu-id"
            className="form-input"
            style={{ width: 220 }}
            value={filterBuId}
            onChange={(e) => setFilterBuId(e.target.value)}
            placeholder="Filter by Business Unit ID"
          />
        </div>
      </div>
      <div className="accent-line mb-6" />

      {error && (
        <div className="card mb-4" style={{ borderColor: "rgba(244,63,94,0.3)", background: "rgba(244,63,94,0.06)" }}>
          <p className="text-sm" style={{ color: "#fb7185" }}><Icon name="warning" className="mr-2" /> {error}</p>
        </div>
      )}

      {loading && <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>Loading leads…</div>}

      {!loading && leads.length === 0 && !error && (
        <div className="card text-center py-16">
          <div className="text-4xl mb-4"><Icon name="flash_on" size="lg" /></div>
          <p className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>No leads yet</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Leads will appear here as they are ingested via POST /api/v1/ingest/&#123;business_unit_id&#125;
          </p>
        </div>
      )}

      {leads.length > 0 && (
        <div className="card animate-slide-up" style={{ padding: 0, overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
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
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => openLead(lead.id)}
                >
                  <td>
                    <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                      {lead.full_name}
                    </span>
                    {lead.email && (
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{lead.email}</div>
                    )}
                  </td>
                  <td>
                    <span className="font-mono text-xs">{lead.phone_number}</span>
                  </td>
                  <td><ChannelBadge channel={lead.source_channel} /></td>
                  <td><StatusBadge value={lead.delivery_status} /></td>
                  <td><StatusBadge value={lead.crm_forward_status} /></td>
                  <td>
                    <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                      {new Date(lead.created_at).toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openLead(lead.id);
                      }}
                    >
                      {detailLoading ? "Loading…" : "View"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedLead && (
        <div className="modal-backdrop" onClick={() => setSelectedLead(null)}>
          <LeadDetail lead={selectedLead} />
        </div>
      )}
    </>
  );
}

export default function LeadsPage() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Suspense fallback={<div style={{ color: "var(--text-muted)" }}>Loading…</div>}>
          <LeadFeedInner />
        </Suspense>
      </main>
    </div>
  );
}
