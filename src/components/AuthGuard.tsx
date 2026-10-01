"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getAccessToken } from "@/lib/api";

const publicPaths = ["/login", "/register"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token && !publicPaths.includes(pathname)) {
      router.push("/login");
    } else {
      setIsReady(true);
    }
  }, [pathname, router]);

  if (!isReady && !publicPaths.includes(pathname)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <span className="material-symbols-outlined text-4xl mb-4 animate-spin text-gray-400">refresh</span>
      </div>
    );
  }

  return <>{children}</>;
}
