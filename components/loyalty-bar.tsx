'use client';

import { useEffect, useState } from 'react';
import { supabase, Profile } from '@/lib/supabase';
import { Sparkles } from 'lucide-react';

const LOYALTY_TIERS = [
  { name: 'Bronze', minBalance: 0, color: '#CD7F32' },
  { name: 'Argent', minBalance: 50, color: '#C0C0C0' },
  { name: 'Or', minBalance: 100, color: '#D4AF37' },
  { name: 'Platine', minBalance: 200, color: '#E5E4E2' },
];

export function LoyaltyBar() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        setProfile(data);
      }
    };

    fetchProfile();
  }, []);

  if (!profile) return null;

  const currentTier = LOYALTY_TIERS.reduce((prev, curr) =>
    profile.wallet_balance >= curr.minBalance ? curr : prev
  );

  const nextTier = LOYALTY_TIERS.find(tier => tier.minBalance > profile.wallet_balance);
  const progressToNext = nextTier
    ? ((profile.wallet_balance - currentTier.minBalance) / (nextTier.minBalance - currentTier.minBalance)) * 100
    : 100;

  return (
    <div className="sticky top-20 z-40 bg-gradient-to-r from-[#F8B4C1] to-[#D4AF37] py-3 shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-white" />
            <span className="text-white font-medium">
              Tier {currentTier.name}
            </span>
            <span className="text-white/90 text-sm">
              {profile.wallet_balance.toFixed(2)}€
            </span>
          </div>

          {nextTier && (
            <div className="flex items-center gap-3 flex-1 max-w-md ml-8">
              <div className="flex-1 bg-white/30 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-white h-full transition-all duration-500 rounded-full"
                  style={{ width: `${progressToNext}%` }}
                />
              </div>
              <span className="text-white text-sm whitespace-nowrap">
                {(nextTier.minBalance - profile.wallet_balance).toFixed(2)}€ vers {nextTier.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
