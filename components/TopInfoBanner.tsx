'use client';

import { NextLiveBanner } from '@/components/NextLiveBanner';
import OpenPackageCountdownBanner from '@/components/OpenPackageCountdownBanner';

export function TopInfoBanner() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/20">
      <NextLiveBanner />
      <OpenPackageCountdownBanner />
    </div>
  );
}
