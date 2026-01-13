'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PiggyBank, TrendingUp, Sparkles } from 'lucide-react';

export function LoyaltyBanner() {
  const { profile } = useAuth();
  const multiplier = 1;

  if (!profile) {
    return null;
  }

  const walletBalance = Number(profile.wallet_balance) || 0;
  const loyaltyPoints = Number(profile.loyalty_points) || 0;

  return (
    <div className="bg-gradient-to-r from-[#D4AF37] via-[#C6A15B] to-[#D4AF37] border-b border-[#C6A15B]">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4" />
              <span className="text-sm font-medium">
                Cagnotte: <span className="font-bold">{walletBalance.toFixed(2)}€</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">
                Points: <span className="font-bold">{loyaltyPoints}</span>
              </span>
            </div>

            {multiplier > 1 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full">
                <TrendingUp className="h-4 w-4 animate-bounce" />
                <span className="text-sm font-bold">
                  Multiplicateur x{multiplier}
                </span>
              </div>
            )}
          </div>

          <div className="text-xs text-white/90 hidden md:block">
            Chaque achat te rapproche de ta prochaine pépite
          </div>
        </div>
      </div>
    </div>
  );
}
