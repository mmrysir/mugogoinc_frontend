import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mugogo Inc. Engine — Agent Control Panel",
  description:
    "Internal multi-tenant lead ingestion, routing, and monitoring dashboard for Mugogo Inc. agency operations.",
  icons: {
    icon: "/mugologo_t.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@100..700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/mugologo_t.png" type="image/png" />
        {children}
      </body>
    </html>
  );
}
