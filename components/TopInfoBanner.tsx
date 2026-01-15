'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { NextLiveBanner } from '@/components/NextLiveBanner';
import OpenPackageCountdownBanner from '@/components/OpenPackageCountdownBanner';
import { supabase } from '@/lib/supabase';

export function TopInfoBanner() {
  const { user } = useAuth();
  const [hasOpenPackage, setHasOpenPackage] = useState(false);

  useEffect(() => {
    if (user) {
      checkOpenPackage();
      const interval = setInterval(checkOpenPackage, 60000);
      return () => clearInterval(interval);
    } else {
      setHasOpenPackage(false);
    }
  }, [user]);

  async function checkOpenPackage() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('open_packages')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      setHasOpenPackage(!error && data !== null);
    } catch (error) {
      console.error('Error checking open package:', error);
      setHasOpenPackage(false);
    }
  }

  const shouldUseTwoColumns = user && hasOpenPackage;

  return (
    <div className={`w-full grid ${shouldUseTwoColumns ? 'grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x' : 'grid-cols-1'} divide-white/20`}>
      <NextLiveBanner />
      {user && hasOpenPackage && <OpenPackageCountdownBanner />}
    </div>
  );
}
