import type { Metadata } from "next";
import AuthGuard from "@/components/AuthGuard";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mugogo Inc. Engine — Agent Control Panel",
  description:
    "Internal multi-tenant lead ingestion, routing, and monitoring dashboard for Mugogo Inc. agency operations.",
  icons: {
    icon: [
      { url: "/mugologo_t.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/mugologo_t.png",
    apple: "/mugologo_t.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/mugologo_t.png" type="image/png" sizes="any" />
        <link rel="apple-touch-icon" href="/mugologo_t.png" />
        <link rel="shortcut icon" href="/mugologo_t.png" />
          <link
            href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@100..700&display=swap"
            rel="stylesheet"
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    var t = localStorage.getItem('mugogo-theme-app') || 'light';
                    document.documentElement.setAttribute('data-theme', t);
                  } catch (e) {}
                })();
              `,
            }}
          />
      </head>
      <body>
        <AuthGuard>
          {children}
        </AuthGuard>
      </body>
    </html>
  );
}
