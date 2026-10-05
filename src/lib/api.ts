const DEFAULT_API_BASE = "http://127.0.0.1:8000/api/v1";
const TOKEN_STORAGE_KEY = "mugogo_access_token";

function resolveApiBase(): string {
  const configured =
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return DEFAULT_API_BASE;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = resolveApiBase();
  const url = `${baseUrl}${path}`;
  const token = getAccessToken();

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const raw = await res.text();
      let detail = raw;
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed.detail === "string") detail = parsed.detail;
      } catch {
        // non-JSON error body; keep raw text
      }
      throw new Error(`API ${res.status}: ${detail}`);
    }

    if (res.status === 204) {
      return undefined as T;
    }

    return res.json() as Promise<T>;
  } catch (error) {
    if (typeof window !== "undefined") {
      console.error("API request failed", { url, error });
    }
    throw error;
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type OrgStatus = "ACTIVE" | "SUSPENDED" | "ONBOARDING";
export type RouteType = "EXPRESS" | "ENTERPRISE";
export type SourceChannel =
  | "LANDING_PAGE"
  | "META_LEAD_AD"
  | "GOOGLE_ADS"
  | "TIKTOK"
  | "SMS";
export type DeliveryStatus = "PENDING" | "DELIVERED" | "FAILED";
export type CrmForwardStatus =
  | "NOT_REQUIRED"
  | "QUEUED"
  | "FORWARDED"
  | "FAILED";

export type UserRole = "SUPER_ADMIN" | "MANAGER" | "AGENT";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_approved: boolean;
  is_frozen?: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface Organization {
  id: string;
  name: string;
  status: OrgStatus;
  assigned_agent_id: string | null;
  created_at: string;
}

export interface BusinessUnit {
  id: string;
  organization_id: string;
  name: string;
  route_type: RouteType;
  webhook_url: string | null;
  owner_whatsapp_number: string;
  owner_email: string;
  created_at: string;
}

export interface Lead {
  id: string;
  business_unit_id: string;
  source_channel: SourceChannel;
  full_name: string;
  phone_number: string;
  email: string | null;
  payload_meta: Record<string, unknown>;
  delivery_status: DeliveryStatus;
  crm_forward_status: CrmForwardStatus;
  dedupe_hash: string;
  // Attribution fields (from LeadResponse)
  gclid: string | null;
  fbclid: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  user_agent: string | null;
  // Returning-lead tracking fields
  submission_count: number;
  is_returning: boolean;
  is_partial?: boolean;
  is_blurred?: boolean;
  last_activity_at: string;
  created_at: string;
}

export interface DashboardStats {
  organizations: number;
  business_units: number;
  leads: {
    total: number;
    today: number;
    this_week: number;
    delivered: number;
    failed: number;
    pending: number;
    delivery_rate_pct: number;
  };
  channels: Record<string, number>;
  daily_volume: Array<{ date: string; count: number }>;
  generated_at: string;
}

export interface OrganizationStats {
  organization_id: string;
  organization_name: string;
  business_units: number;
  leads: {
    total: number;
    today: number;
    this_week: number;
    delivered: number;
    failed: number;
    pending: number;
    delivery_rate_pct: number;
  };
  channels: Record<string, number>;
  daily_volume: Array<{ date: string; count: number }>;
  generated_at: string;
}

export interface PaginatedResponse<T> {
  total: number;
  items: T[];
}

// ── Organizations ─────────────────────────────────────────────────────────────

export type PostStatus = "draft" | "published";

export interface BlogPost {
  id: string;
  organization_id?: string | null;
  business_unit_id?: string | null;
  title: string;
  slug: string;
  excerpt?: string | null;
  content_markdown?: string | null;
  content_html?: string | null;
  content?: string | null;
  featured_image_url?: string | null;
  author_name?: string | null;
  status: PostStatus;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  meta_title?: string | null;
  meta_description?: string | null;
  target_keywords?: string[] | Record<string, unknown> | null;
}

export interface BlogPostPaginated {
  posts: BlogPost[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface KeywordIdea {
  keyword: string;
  monthly_search_volume: number;
  competition: "LOW" | "MEDIUM" | "HIGH";
  low_top_of_page_bid_usd: number;
  high_top_of_page_bid_usd: number;
  opportunity_score: number;
}

export interface CampaignMetric {
  campaign_name: string;
  daily_spend_usd: number;
  daily_budget_usd: number;
  leads_count: number;
  owner_phone: string;
}

export const api = {
  blog: {
    listPublic: (page = 1, limit = 10, orgId?: string) => {
      const q = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (orgId) q.set("org_id", orgId);
      return request<BlogPostPaginated>(`/blog/posts?${q.toString()}`);
    },
    getPublicBySlug: (slug: string, orgId?: string) => {
      const q = orgId ? `?org_id=${orgId}` : "";
      return request<BlogPost>(`/blog/posts/${slug}${q}`);
    },
    listRecentPublic: (limit = 5) =>
      request<BlogPost[]>(`/blog/posts/recent?limit=${limit}`),
    createOrUpdateInternal: (body: Partial<BlogPost>, serviceToken: string) =>
      request<BlogPost>("/internal/blog/posts", {
        method: "POST",
        headers: { "X-Internal-Token": serviceToken },
        body: JSON.stringify(body),
      }),
    approveAndPublish: (idOrSlug: string, serviceToken: string) =>
      request<BlogPost>(`/internal/blog/posts/${idOrSlug}/publish`, {
        method: "PATCH",
        headers: { "X-Internal-Token": serviceToken },
      }),
  },

  marketing: {
    searchKeywords: (seedKeywords: string[]) =>
      request<{ keywords: KeywordIdea[]; count: number }>("/marketing/keywords/search", {
        method: "POST",
        body: JSON.stringify({ seed_keywords: seedKeywords }),
      }),
    checkCampaignHealth: (campaigns: CampaignMetric[], recipientPhone?: string) =>
      request<{ checked_at: string; total_campaigns_checked: number; alerts_count: number; alerts: string[] }>(
        `/marketing/campaigns/check-health${recipientPhone ? `?recipient_phone=${recipientPhone}` : ""}`,
        {
          method: "POST",
          body: JSON.stringify(campaigns),
        }
      ),
  },

  organizations: {
    list: (skip = 0, limit = 50) =>
      request<PaginatedResponse<Organization>>(
        `/organizations?skip=${skip}&limit=${limit}`
      ),
    get: (id: string) => request<Organization>(`/organizations/${id}`),
    create: (body: { name: string; status?: OrgStatus; assigned_agent_id?: string }) =>
      request<Organization>("/organizations", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (id: string, body: Partial<Organization>) =>
      request<Organization>(`/organizations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    delete: (id: string) =>
      request<void>(`/organizations/${id}`, { method: "DELETE" }),
    assignAgent: (id: string, agentId: string | null) =>
      request<Organization>(`/organizations/${id}/assign-agent`, {
        method: "PATCH",
        body: JSON.stringify({ agent_id: agentId }),
      }),
  },

  businessUnits: {
    list: (organizationId?: string, skip = 0, limit = 50) =>
      request<PaginatedResponse<BusinessUnit>>(
        `/business-units?skip=${skip}&limit=${limit}${
          organizationId ? `&organization_id=${organizationId}` : ""
        }`
      ),
    get: (id: string) => request<BusinessUnit>(`/business-units/${id}`),
    create: (body: Omit<BusinessUnit, "id" | "created_at">) =>
      request<BusinessUnit>("/business-units", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (id: string, body: Partial<BusinessUnit>) =>
      request<BusinessUnit>(`/business-units/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    delete: (id: string) =>
      request<void>(`/business-units/${id}`, { method: "DELETE" }),
  },

  leads: {
    list: (params?: {
      business_unit_id?: string;
      organization_id?: string;
      delivery_status?: DeliveryStatus;
      source_channel?: SourceChannel;
      date_from?: string;
      date_to?: string;
      skip?: number;
      limit?: number;
    }) => {
      const q = new URLSearchParams();
      if (params?.business_unit_id) q.set("business_unit_id", params.business_unit_id);
      if (params?.organization_id) q.set("organization_id", params.organization_id);
      if (params?.delivery_status) q.set("delivery_status", params.delivery_status);
      if (params?.source_channel) q.set("source_channel", params.source_channel);
      if (params?.date_from) q.set("date_from", params.date_from);
      if (params?.date_to) q.set("date_to", params.date_to);
      q.set("skip", String(params?.skip ?? 0));
      q.set("limit", String(params?.limit ?? 50));
      return request<PaginatedResponse<Lead>>(`/leads?${q.toString()}`);
    },
    get: (id: string) => request<Lead>(`/leads/${id}`),
  },

  stats: {
    dashboard: () => request<DashboardStats>("/stats/dashboard"),
    organization: (orgId: string) =>
      request<OrganizationStats>(`/stats/organizations/${orgId}`),
  },
  users: {
    list: (role?: UserRole, approvedOnly?: boolean) => {
      const q = new URLSearchParams();
      if (role) q.set("role", role);
      if (approvedOnly) q.set("approved_only", "true");
      return request<AuthUser[]>(`/users${q.toString() ? `?${q.toString()}` : ""}`);
    },
    create: (body: { name: string; email: string; phone_number?: string; password: string; role: UserRole }) =>
      request<AuthUser>("/users", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    updateRole: (id: string, role: UserRole) =>
      request<AuthUser>(`/users/${id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      }),
    approve: (id: string) =>
      request<AuthUser>(`/users/${id}/approve`, { method: "PATCH" }),
    reject: (id: string) =>
      request<{ message: string }>(`/users/${id}/reject`, { method: "PATCH" }),
    freeze: (id: string) =>
      request<AuthUser>(`/users/${id}/freeze`, { method: "PATCH" }),
    unfreeze: (id: string) =>
      request<AuthUser>(`/users/${id}/unfreeze`, { method: "PATCH" }),
    delete: (id: string) =>
      request<{ message: string }>(`/users/${id}`, { method: "DELETE" }),
  },
  auth: {
    register: (body: { name: string; email: string; phone_number: string; password: string }) =>
      request<Record<string, unknown>>("/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    login: (body: { email: string; password: string }) =>
      request<TokenResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    me: () => request<AuthUser>("/auth/me"),
  },
};

