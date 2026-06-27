'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardPage from '../dashboard/page';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Ensure URL matches persona=admin for consistency
    if (typeof window !== 'undefined' && !window.location.search.includes('persona=admin')) {
      router.replace('/dashboard?persona=admin');
    }
  }, [router]);

  return <DashboardPage />;
}
