"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Loading";

export default function RootPage() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-2">
        <Spinner />
        <p className="text-xs text-muted-foreground animate-pulse">Routing to console...</p>
      </div>
    </div>
  );
}
