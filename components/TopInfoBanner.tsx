'use client';

import { useAuth } from '@/context/AuthContext';
import { NextLiveBanner } from '@/components/NextLiveBanner';
import OpenPackageCountdownBanner from '@/components/OpenPackageCountdownBanner';

export function TopInfoBanner() {
  const { user } = useAuth();

  return (
    <div className={`w-full grid ${user ? 'grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x' : 'grid-cols-1'} divide-white/20`}>
      <NextLiveBanner />
      {user && <OpenPackageCountdownBanner />}
    </div>
  );
}
