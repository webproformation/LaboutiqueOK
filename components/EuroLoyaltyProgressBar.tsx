'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Progress } from '@/components/ui/progress';
import { ChevronUp, ChevronDown, Wallet, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';

interface TierInfo {
  tier: number;
  multiplier: number;
  tier_name: string;
  current_balance: number;
  next_tier_threshold: number;
}

export default function EuroLoyaltyProgressBar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedVisibility = localStorage.getItem('euroLoyaltyBarVisible');
    if (savedVisibility !== null) {
      setIsVisible(savedVisibility === 'true');
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('euroLoyaltyBarVisible', isVisible.toString());
    }
  }, [isVisible, isMounted]);

  useEffect(() => {
    if (user) {
      loadTierInfo();

      const interval = setInterval(loadTierInfo, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadTierInfo = async () => {
    if (!user) return;

    try {
      const response = await fetch(
        `/api/loyalty/get-tier`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ user_id: user.id })
        }
      );

      if (!response.ok) throw new Error('Failed to fetch tier info');

      const data = await response.json();

      if (data && data.length > 0) {
        setTierInfo(data[0]);
      }
    } catch (error) {
      console.error('Error loading tier info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (pathname.startsWith('/admin') || !user || loading || !isMounted || !tierInfo) {
    return null;
  }

  const progressPercentage = tierInfo.tier === 3
    ? 100
    : ((tierInfo.current_balance / tierInfo.next_tier_threshold) * 100);

  const amountToNextTier = tierInfo.tier === 3
    ? 0
    : (tierInfo.next_tier_threshold - tierInfo.current_balance).toFixed(2);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 shadow-sm">
      {isVisible ? (
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="bg-blue-500 rounded-full p-2">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {tierInfo.tier_name} (x{tierInfo.multiplier})
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                      <Sparkles className="h-3 w-3" />
                      {tierInfo.current_balance.toFixed(2)} €
                    </span>
                  </div>
                  <span className="text-xs text-gray-600 hidden sm:block">
                    Ma Cagnotte Fidélité
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Progress
                      value={progressPercentage}
                      className="h-2 bg-blue-100"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      {tierInfo.tier === 3 ? (
                        <>Palier maximum atteint ! (x3)</>
                      ) : (
                        <>Plus que {amountToNextTier} € pour {tierInfo.tier_name === 'Palier 1' ? 'Palier 2 (x2)' : 'Palier 3 (x3)'}</>
                      )}
                    </p>
                  </div>
                  <div className="hidden md:flex items-center gap-4 text-xs">
                    <div className="text-center px-3 py-1 bg-white rounded-lg shadow-sm">
                      <div className="font-bold text-blue-600">x{tierInfo.multiplier}</div>
                      <div className="text-gray-500">Multiplicateur</div>
                    </div>
                  </div>
                  <Link href="/account/loyalty">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-300 text-blue-700 hover:bg-blue-100 text-xs whitespace-nowrap"
                    >
                      Voir détails
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleVisibility}
              className="h-8 w-8 p-0 hover:bg-blue-200"
            >
              <ChevronUp className="h-4 w-4 text-gray-600" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-blue-500 rounded-full p-1.5">
                <Wallet className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                Cagnotte: {tierInfo.current_balance.toFixed(2)} € ({tierInfo.tier_name})
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleVisibility}
              className="h-7 w-7 p-0 hover:bg-blue-200"
            >
              <ChevronDown className="h-4 w-4 text-gray-600" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}