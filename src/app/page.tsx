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
    <div className="kpi-card">
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
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            Dashboard
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Real-time lead engine metrics — auto-refreshes every 15 seconds
          </p>
          <div className="accent-line mt-4" />
        </div>

        {error && (
          <div className="card mb-6 animate-fade-in"
            style={{ borderColor: "rgba(244,63,94,0.3)", background: "rgba(244,63,94,0.06)" }}>
            <p className="text-sm" style={{ color: "#fb7185" }}><Icon name="warning" className="mr-2" /> {error}</p>
          </div>
        )}

        {loading && !stats && (
          <div className="text-center py-20" style={{ color: "var(--text-muted)" }}>
            Loading metrics...
          </div>
        )}

        {stats && (
          <>
            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in">
              <KpiCard icon="apartment" label="Organizations" value={stats.organizations} />
              <KpiCard icon="place" label="Business Units" value={stats.business_units} />
              <KpiCard icon="flash_on" label="Total Leads" value={stats.leads.total} />
              <KpiCard
                icon="insights"
                label="Delivery Rate"
                value={`${stats.leads.delivery_rate_pct}%`}
                accent="linear-gradient(135deg,#10b981,#06b6d4)"
              />
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-3 gap-4 mb-8 animate-fade-in">
              <KpiCard icon="event" label="Leads Today" value={stats.leads.today} />
              <KpiCard icon="date_range" label="This Week" value={stats.leads.this_week} />
              <KpiCard
                icon="check_circle"
                label="Delivered"
                value={stats.leads.delivered}
                accent="linear-gradient(135deg,#10b981,#34d399)"
              />
            </div>

            {/* Delivery breakdown + Channels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Delivery Breakdown */}
              <div className="card animate-slide-up">
                <h2 className="font-semibold mb-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                  DELIVERY BREAKDOWN
                </h2>
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
              <div className="card animate-slide-up">
                <h2 className="font-semibold mb-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                  LEAD CHANNELS
                </h2>
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
            <div className="card animate-slide-up">
              <h2 className="font-semibold mb-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                7-DAY DAILY VOLUME
              </h2>
              {stats.daily_volume.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No volume data yet</p>
              ) : (
                <div className="flex items-end gap-2 h-20">
                  {stats.daily_volume.map((d) => {
                    const max = Math.max(...stats.daily_volume.map((x) => x.count), 1);
                    const h = Math.max((d.count / max) * 100, 4);
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                        <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity font-mono"
                          style={{ color: "var(--accent-blue)", fontSize: "0.65rem" }}>
                          {d.count}
                        </span>
                        <div
                          className="w-full rounded-t transition-all duration-500"
                          style={{ height: `${h}%`, background: "var(--gradient-accent)", opacity: 0.8 }}
                        />
                        <span className="text-xs" style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}>
                          {d.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
