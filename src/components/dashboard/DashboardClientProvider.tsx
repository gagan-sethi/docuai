"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { setAuthToken } from "@/lib/api";

function ImpersonateTokenListener() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const impersonateToken = searchParams.get("impersonate_token");
    if (impersonateToken) {
      setAuthToken(impersonateToken);
      // Clean up URL without reloading the page
      const url = new URL(window.location.href);
      url.searchParams.delete("impersonate_token");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [searchParams]);

  return null;
}

export default function DashboardClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <ImpersonateTokenListener />
      </Suspense>
      {children}
    </>
  );
}
