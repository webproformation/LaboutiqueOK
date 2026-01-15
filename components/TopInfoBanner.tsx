'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { NextLiveBanner } from '@/components/NextLiveBanner';
import OpenPackageCountdownBanner from '@/components/OpenPackageCountdownBanner';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Sparkles, Euro } from 'lucide-react';

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
      {!user ? (
        <Link href="/auth/register" className="block">
          <div className="bg-gradient-to-r from-[#C6A15B] via-[#D4AF37] to-[#FFD700] hover:from-[#B59149] hover:via-[#C6A15B] hover:to-[#D4AF37] transition-all duration-300">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-center gap-3 text-white">
                <Sparkles className="h-6 w-6 animate-pulse" />
                <span className="font-bold text-lg">
                  Crée ton compte et reçois 5€ de bienvenue !
                </span>
                <Euro className="h-6 w-6" />
              </div>
            </div>
          </div>
        </Link>
      ) : (
        <NextLiveBanner />
      )}
      {user && hasOpenPackage && <OpenPackageCountdownBanner />}
    </div>
  );
}
