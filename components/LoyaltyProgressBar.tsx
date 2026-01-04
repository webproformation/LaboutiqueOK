'use client';

import React, { useState, useEffect } from 'react';
import { useLoyalty } from '@/context/LoyaltyContext';
import { useAuth } from '@/context/AuthContext';
import { Progress } from '@/components/ui/progress';
import { ChevronUp, ChevronDown, Gift, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function LoyaltyProgressBar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const {
    loyaltyPoints,
    loading,
    visitDiscount,
    liveDiscount,
    totalDiscount,
    progressToNextVisitDiscount,
  } = useLoyalty();
  const [isVisible, setIsVisible] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedVisibility = localStorage.getItem('loyaltyBarVisible');
    if (savedVisibility !== null) {
      setIsVisible(savedVisibility === 'true');
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('loyaltyBarVisible', isVisible.toString());
    }
  }, [isVisible, isMounted]);

  if (pathname.startsWith('/admin') || !user || loading || !isMounted) {
    return null;
  }

  const pointsToNextDiscount = loyaltyPoints
    ? (Math.floor(loyaltyPoints.page_visit_points / 500) + 1) * 500 - loyaltyPoints.page_visit_points
    : 500;

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200 shadow-sm">
      {isVisible ? (
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="bg-amber-500 rounded-full p-2">
                <Gift className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">Programme de Fidélité</h3>
                    {totalDiscount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">
                        <Sparkles className="h-3 w-3" />
                        {totalDiscount}% de réduction active
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-600 hidden sm:block">
                    {loyaltyPoints?.page_visit_points || 0} points
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Progress
                      value={progressToNextVisitDiscount}
                      className="h-2 bg-amber-100"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      {visitDiscount < 3 ? (
                        <>Plus que {pointsToNextDiscount} points pour {visitDiscount + 1}% de réduction visites</>
                      ) : (
                        <>Réduction maximum visites atteinte (3%)</>
                      )}
                    </p>
                  </div>
                  <div className="hidden md:flex items-center gap-4 text-xs">
                    <div className="text-center">
                      <div className="font-semibold text-amber-600">{visitDiscount}%</div>
                      <div className="text-gray-500">Visites</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-amber-600">{liveDiscount}%</div>
                      <div className="text-gray-500">Lives</div>
                    </div>
                  </div>
                  <Link href="/account/loyalty">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-amber-300 text-amber-700 hover:bg-amber-100 text-xs whitespace-nowrap"
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
              className="h-8 w-8 p-0 hover:bg-amber-200"
            >
              <ChevronUp className="h-4 w-4 text-gray-600" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-amber-500 rounded-full p-1.5">
                <Gift className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                Fidélité: {totalDiscount}% de réduction
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleVisibility}
              className="h-7 w-7 p-0 hover:bg-amber-200"
            >
              <ChevronDown className="h-4 w-4 text-gray-600" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
