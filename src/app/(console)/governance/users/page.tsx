"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
  const router = useRouter();
  useEffect(() => {
    router.push('/admin');
  }, [router]);

  return (
    <div className="p-8 text-zinc-400">
      Redirecting to unified Administration Console...
    </div>
  );
}
