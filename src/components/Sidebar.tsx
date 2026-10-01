"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api, clearAccessToken, AuthUser } from "@/lib/api";

const NAV = [
  { href: "/", icon: "dashboard", label: "Dashboard" },
  { href: "/organizations", icon: "account_balance", label: "Organizations" },
  { href: "/leads", icon: "bolt", label: "Lead Feed" },
  { href: "/blog-admin", icon: "article", label: "Blog & Human Approval" },
  { href: "/marketing-hub", icon: "insights", label: "Keyword & Ad Monitor" },
  { href: "/blog", icon: "language", label: "Public Blog Hub" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let active = true;
    api.auth
      .me()
      .then((u) => {
        if (active) {
          setUser(u);
          // Fetch pending approvals count for Managers and Admins
          if (u.role === "SUPER_ADMIN" || u.role === "MANAGER") {
            api.users.list().then((all) => {
              if (active) setPendingCount(all.filter((x) => !x.is_approved).length);
            }).catch(() => {});
          }
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const handleSignOut = () => {
    clearAccessToken();
    router.push("/login");
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <img
            src="/mugologo_t.png"
            alt="Mugogo Inc. logo"
            className="w-10 h-10 rounded-xl object-cover"
          />
          <div>
            <div className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
              Mugogo Inc.
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              Engine v1.0
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        <div
          className="text-xs font-semibold uppercase tracking-widest px-3 pt-3 pb-2"
          style={{ color: "var(--text-muted)" }}
        >
          Operations
        </div>
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item${active ? " active" : ""}`}
            >
              <span className="material-symbols-outlined text-base leading-none">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
        {(user?.role === "SUPER_ADMIN" || user?.role === "MANAGER") && (
          <Link
            href="/users"
            className={`nav-item${pathname.startsWith("/users") ? " active" : ""}`}
          >
            <span className="material-symbols-outlined text-base leading-none">
              group
            </span>
            <span>Team Management</span>
            {pendingCount > 0 && (
              <span
                style={{
                  marginLeft: "auto",
                  background: "#eab308",
                  color: "#0f172a",
                  borderRadius: "9999px",
                  padding: "0.05rem 0.45rem",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  lineHeight: 1.6,
                }}
              >
                {pendingCount}
              </span>
            )}
          </Link>
        )}
      </nav>

      {/* Logout & Theme */}
      <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
        <button
          type="button"
          onClick={() => {
            const current = document.documentElement.getAttribute('data-theme') || 'light';
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('mugogo-theme-app', next);
          }}
          className="nav-item w-full text-left transition-colors mb-2"
        >
          <span className="material-symbols-outlined text-base leading-none">
            brightness_6
          </span>
          <span>Toggle Theme</span>
        </button>

        <button
          type="button"
          onClick={handleSignOut}
          className="nav-item w-full text-left text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          style={{ color: "#ef4444" }}
        >
          <span className="material-symbols-outlined text-base leading-none">
            logout
          </span>
          <span>Sign Out</span>
        </button>
      </div>

      {/* Footer */}
      <div
        className="p-4 border-t text-xs"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
      >
        {user && (
          <>
            <div className="font-semibold truncate" style={{ color: "var(--text-primary)" }}>
              {user.name}
            </div>
            <div className="truncate">{user.email}</div>
            <div className="mt-1">
              <span className="badge badge-express">{user.role.replace(/_/g, " ")}</span>
            </div>
            <div className="mt-2" style={{ borderColor: "var(--border)" }} />
          </>
        )}
        <div>Agent Control Panel</div>
        <div>Kenya & East Africa</div>
      </div>
    </aside>
  );
}
