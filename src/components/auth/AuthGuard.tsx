"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Spinner } from "@/components/ui/Loading";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, initialize } = useAuthStore();

  React.useEffect(() => {
    initialize();
  }, [initialize]);

  React.useEffect(() => {
    if (isLoading) return;

    const isLoginPage = pathname === "/login";

    if (!isAuthenticated && !isLoginPage) {
      router.push("/login");
    } else if (isAuthenticated && isLoginPage) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Spinner />
          <p className="text-sm font-semibold text-muted-foreground animate-pulse">
            Verifying secure session...
          </p>
        </div>
      </div>
    );
  }

  const isLoginPage = pathname === "/login";
  if (!isAuthenticated && !isLoginPage) {
    return null; // Prevent showing protected content while redirecting
  }

  return <>{children}</>;
}
