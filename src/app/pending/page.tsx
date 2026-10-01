"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAccessToken } from "@/lib/api";

export default function PendingApprovalPage() {
  const router = useRouter();
  const [dots, setDots] = useState(".");

  // Animate the waiting dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
    }, 600);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = () => {
    clearAccessToken();
    router.push("/login");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      {/* Card */}
      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "1.5rem",
          padding: "3rem 2.5rem",
          maxWidth: "480px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        }}
      >
        {/* Logo */}
        <img
          src="/mugologo_t.png"
          alt="Mugogo Inc."
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "1rem",
            objectFit: "contain",
            margin: "0 auto 1.5rem",
            display: "block",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          }}
        />

        {/* Animated waiting indicator */}
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            border: "3px solid rgba(99,102,241,0.2)",
            borderTop: "3px solid #6366f1",
            margin: "0 auto 2rem",
            animation: "spin 1.2s linear infinite",
          }}
        />

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        `}</style>

        {/* Heading */}
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            color: "#f1f5f9",
            marginBottom: "0.75rem",
            animation: "fadeUp 0.6s ease both",
          }}
        >
          Request Submitted ✅
        </h1>

        {/* Subheading */}
        <p
          style={{
            fontSize: "1rem",
            color: "#94a3b8",
            marginBottom: "2rem",
            lineHeight: 1.6,
            animation: "fadeUp 0.6s ease 0.1s both",
          }}
        >
          Your agent account has been created successfully. A{" "}
          <strong style={{ color: "#a5b4fc" }}>Manager or Super Admin</strong> will
          review and approve your request shortly.
        </p>

        {/* Status badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(234,179,8,0.12)",
            border: "1px solid rgba(234,179,8,0.25)",
            borderRadius: "2rem",
            padding: "0.5rem 1.25rem",
            marginBottom: "2rem",
            animation: "fadeUp 0.6s ease 0.2s both",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#eab308",
              display: "inline-block",
              animation: "spin 2s linear infinite",
            }}
          />
          <span style={{ color: "#fde68a", fontSize: "0.875rem", fontWeight: 600 }}>
            Awaiting Approval{dots}
          </span>
        </div>

        {/* Info box */}
        <div
          style={{
            background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: "0.75rem",
            padding: "1rem 1.25rem",
            marginBottom: "2rem",
            textAlign: "left",
            animation: "fadeUp 0.6s ease 0.3s both",
          }}
        >
          <p style={{ color: "#c7d2fe", fontSize: "0.85rem", lineHeight: 1.6, margin: 0 }}>
            💡 <strong>What happens next?</strong>
            <br />
            Once approved, you will be able to log in and access the Mugogo Inc.
            Engine dashboard. You may close this tab — your account is safely saved.
          </p>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "0.75rem",
            color: "#94a3b8",
            padding: "0.65rem 1.5rem",
            fontSize: "0.875rem",
            cursor: "pointer",
            transition: "all 0.2s",
            width: "100%",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.3)";
            (e.target as HTMLButtonElement).style.color = "#f1f5f9";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)";
            (e.target as HTMLButtonElement).style.color = "#94a3b8";
          }}
        >
          ← Back to Login
        </button>
      </div>

      {/* Footer */}
      <p style={{ color: "#475569", fontSize: "0.75rem", marginTop: "2rem" }}>
        Mugogo Inc. — Agent Control Panel · Kenya &amp; East Africa
      </p>
    </div>
  );
}
