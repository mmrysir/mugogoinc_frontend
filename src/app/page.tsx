"use client";

import { useEffect, useState } from "react";
import { api, DashboardStats } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import Icon from "@/components/Icon";

function KpiCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: string;
  accent?: string;
}) {
  return (
    <div className="kpi-card shadow-md-1 hover:shadow-md-2">
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl"><Icon name={icon} size="lg" /></span>
        {sub && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: "rgba(59,130,246,0.1)", color: "var(--accent-blue)" }}>
            {sub}
          </span>
        )}
      </div>
      <div className="kpi-value" style={accent ? { background: accent, WebkitBackgroundClip: "text", backgroundClip: "text" } : {}}>
        {value}
      </div>
      <div className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{label}</div>
    </div>
  );
}

function ChannelBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
        <span>{label.replace(/_/g, " ")}</span>
        <span className="font-mono">{count}</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: "var(--bg-elevated)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: "var(--gradient-accent)" }}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const data = await api.stats.dashboard();
      setStats(data);
      setError(null);
    } catch {
      setError("Cannot reach API. Is the backend running at port 8000?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initial = setTimeout(fetchStats, 0);
    const interval = setInterval(fetchStats, 15000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <div className="mb-8 animate-fade-in flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
              Dashboard
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
              Real-time engine metrics — auto-refreshes every 15s
            </p>
          </div>
          <div className="text-right">
            <span className="badge badge-active text-xs px-3 py-1 shadow-md-1">
              Live System Active
            </span>
          </div>
        </div>

        {error && (
          <div className="card mb-6 animate-fade-in shadow-md-1"
            style={{ borderColor: "rgba(244,63,94,0.3)", background: "rgba(244,63,94,0.06)" }}>
            <p className="text-sm font-medium" style={{ color: "#fb7185" }}>
              <Icon name="warning" className="mr-2" /> {error}
            </p>
          </div>
        )}

        {loading && !stats && (
          <div className="flex flex-col items-center justify-center py-32" style={{ color: "var(--text-muted)" }}>
            <span className="material-symbols-outlined text-4xl mb-4 animate-spin">refresh</span>
            <p>Loading metrics...</p>
          </div>
        )}

        {stats && (
          <div className="space-y-6">
            {/* Primary KPI Row - 4 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
              <KpiCard icon="flash_on" label="Total Leads" value={stats.leads.total} />
              <KpiCard
                icon="check_circle"
                label="Delivered"
                value={stats.leads.delivered}
                accent="linear-gradient(135deg,#10b981,#34d399)"
              />
              <KpiCard
                icon="insights"
                label="Delivery Rate"
                value={`${stats.leads.delivery_rate_pct}%`}
                accent="linear-gradient(135deg,#10b981,#06b6d4)"
              />
              <KpiCard icon="event" label="Leads Today" value={stats.leads.today} />
            </div>

            {/* Secondary KPI Row - 3 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
              <KpiCard icon="date_range" label="Leads This Week" value={stats.leads.this_week} />
              <KpiCard icon="apartment" label="Active Organizations" value={stats.organizations} />
              <KpiCard icon="place" label="Business Units" value={stats.business_units} />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
              {/* Delivery Breakdown */}
              <div className="card shadow-md-1 hover:shadow-md-2">
                <div className="flex items-center gap-2 mb-6 text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                  <Icon name="pie_chart" size="sm" /> Delivery Breakdown
                </div>
                <div className="space-y-4">
                  {[
                    { label: "Delivered", count: stats.leads.delivered, color: "#34d399" },
                    { label: "Pending", count: stats.leads.pending, color: "#fbbf24" },
                    { label: "Failed", count: stats.leads.failed, color: "#fb7185" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
                        <span>{item.label}</span>
                        <span className="font-mono">{item.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: "var(--bg-elevated)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: stats.leads.total > 0
                              ? `${Math.round((item.count / stats.leads.total) * 100)}%`
                              : "0%",
                            background: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Channel Breakdown */}
              <div className="card shadow-md-1 hover:shadow-md-2">
                <div className="flex items-center gap-2 mb-6 text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                  <Icon name="share" size="sm" /> Lead Channels
                </div>
                {Object.keys(stats.channels).length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No channel data yet</p>
                ) : (
                  Object.entries(stats.channels).map(([ch, count]) => (
                    <ChannelBar key={ch} label={ch} count={count} total={stats.leads.total} />
                  ))
                )}
              </div>
            </div>

            {/* 7-day volume */}
            <div className="card shadow-md-1 hover:shadow-md-2 animate-slide-up" style={{ animationDelay: "300ms" }}>
              <div className="flex items-center gap-2 mb-6 text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                <Icon name="monitoring" size="sm" /> 7-Day Daily Volume
              </div>
              {stats.daily_volume.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No volume data yet</p>
              ) : (
                <div className="flex items-end gap-2 h-24">
                  {stats.daily_volume.map((d) => {
                    const max = Math.max(...stats.daily_volume.map((x) => x.count), 1);
                    const h = Math.max((d.count / max) * 100, 4);
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                        <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity font-mono font-bold"
                          style={{ color: "var(--accent-blue)", fontSize: "0.75rem" }}>
                          {d.count}
                        </span>
                        <div
                          className="w-full rounded-t-md transition-all duration-500 shadow-sm"
                          style={{ height: `${h}%`, background: "var(--gradient-accent)", opacity: 0.9 }}
                        />
                        <span className="text-xs font-medium mt-1" style={{ color: "var(--text-muted)", fontSize: "0.65rem" }}>
                          {d.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
