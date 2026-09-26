"use client";

import { RouteType, SourceChannel } from "@/lib/api";

const STATUS_MAP: Record<string, string> = {
  ACTIVE: "badge-active",
  SUSPENDED: "badge-suspended",
  ONBOARDING: "badge-onboarding",
  DELIVERED: "badge-delivered",
  PENDING: "badge-pending",
  FAILED: "badge-failed",
  EXPRESS: "badge-express",
  ENTERPRISE: "badge-enterprise",
  NOT_REQUIRED: "badge-pending",
  QUEUED: "badge-pending",
  FORWARDED: "badge-delivered",
};

import Icon from "./Icon";

const CHANNEL_ICONS: Record<string, string> = {
  LANDING_PAGE: "public",
  META_LEAD_AD: "campaign",
  GOOGLE_ADS: "search",
  TIKTOK: "music_note",
  SMS: "sms",
};

export function StatusBadge({ value }: { value: string }) {
  const cls = STATUS_MAP[value] || "badge-pending";
  const label = value.replace(/_/g, " ");
  return <span className={`badge ${cls}`}>{label}</span>;
}

export function ChannelBadge({ channel }: { channel: SourceChannel }) {
  const icon = CHANNEL_ICONS[channel] || "travel_explore";
  const label = channel.replace(/_/g, " ").toLowerCase();
  return (
    <span className="badge badge-express" style={{ textTransform: "capitalize" }}>
      <Icon name={icon} className="mr-2" size="sm" /> {label}
    </span>
  );
}

export function RouteTypeBadge({ type }: { type: RouteType }) {
  const cls = type === "EXPRESS" ? "badge-express" : "badge-enterprise";
  return <span className={`badge ${cls}`}>{type}</span>;
}
