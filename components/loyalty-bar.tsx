'use client';

import { useEffect, useState } from 'react';
import { supabase, Profile } from '@/lib/supabase';
import { Sparkles, Star, Coins } from 'lucide-react';

const LOYALTY_TIERS = [
  { name: 'Bronze', minPoints: 0, color: '#CD7F32' },
  { name: 'Argent', minPoints: 500, color: '#C0C0C0' },
  { name: 'Or', minPoints: 1000, color: '#D4AF37' },
  { name: 'Platine', minPoints: 2000, color: '#E5E4E2' },
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

  const loyaltyPoints = profile.loyalty_points || 0;
  const loyaltyEuros = profile.loyalty_euros || 0;

  const currentTier = LOYALTY_TIERS.reduce((prev, curr) =>
    loyaltyPoints >= curr.minPoints ? curr : prev
  );

  const nextTier = LOYALTY_TIERS.find(tier => tier.minPoints > loyaltyPoints);
  const progressToNext = nextTier
    ? ((loyaltyPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
    : 100;

  return (
    <div className="sticky top-20 z-40 bg-gradient-to-r from-[#D4AF37] to-[#b8933d] py-3 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-white fill-white" />
              <span className="text-white font-semibold">
                {currentTier.name}
              </span>
            </div>
            <div className="h-6 w-px bg-white/30" />
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-white" />
              <span className="text-white font-medium">
                {loyaltyPoints} points
              </span>
            </div>
            <div className="h-6 w-px bg-white/30" />
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-white" />
              <span className="text-white font-medium">
                {loyaltyEuros.toFixed(2)}€
              </span>
            </div>
          </div>

          {nextTier && (
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="flex-1 bg-white/30 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-white h-full transition-all duration-500 rounded-full"
                  style={{ width: `${progressToNext}%` }}
                />
              </div>
              <span className="text-white text-sm whitespace-nowrap">
                {(nextTier.minPoints - loyaltyPoints)} pts vers {nextTier.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
