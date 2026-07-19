import React, { Suspense } from "react";
import { Loading } from "./Loading";

interface LoadingBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  isLoading?: boolean;
}

export function LoadingBoundary({ children, fallback, isLoading }: LoadingBoundaryProps) {
  if (isLoading !== undefined) {
    if (isLoading) {
      return <>{fallback || <Loading size="md" />}</>;
    }
    return <>{children}</>;
  }

  return (
    <Suspense fallback={fallback || <Loading size="md" />}>
      {children}
    </Suspense>
  );
}
