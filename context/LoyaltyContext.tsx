'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from './AuthContext';

interface LoyaltyPoints {
  id: string;
  user_id: string;
  page_visit_points: number;
  live_participation_count: number;
  created_at: string;
  updated_at: string;
}

interface LoyaltyContextType {
  loyaltyPoints: LoyaltyPoints | null;
  loading: boolean;
  visitDiscount: number;
  liveDiscount: number;
  totalDiscount: number;
  progressToNextVisitDiscount: number;
  trackPageVisit: (path: string) => Promise<void>;
  trackLiveParticipation: (liveId: string) => Promise<void>;
  refreshLoyaltyPoints: () => Promise<void>;
}

const LoyaltyContext = createContext<LoyaltyContextType | undefined>(undefined);

const POINTS_PER_VISIT = 1;
const POINTS_FOR_ONE_PERCENT = 500;
const MAX_VISIT_DISCOUNT_PERCENT = 3;
const MAX_LIVE_DISCOUNT_PERCENT = 5;

export function LoyaltyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [loyaltyPoints, setLoyaltyPoints] = useState<LoyaltyPoints | null>(null);
  const [loading, setLoading] = useState(true);

  const calculateVisitDiscount = (points: number): number => {
    const discount = Math.floor(points / POINTS_FOR_ONE_PERCENT);
    return Math.min(discount, MAX_VISIT_DISCOUNT_PERCENT);
  };

  const calculateLiveDiscount = (count: number): number => {
    return Math.min(count, MAX_LIVE_DISCOUNT_PERCENT);
  };

  const calculateProgressToNextDiscount = (points: number): number => {
    const currentDiscount = calculateVisitDiscount(points);
    if (currentDiscount >= MAX_VISIT_DISCOUNT_PERCENT) return 100;

    const pointsForCurrentDiscount = currentDiscount * POINTS_FOR_ONE_PERCENT;
    const pointsForNextDiscount = (currentDiscount + 1) * POINTS_FOR_ONE_PERCENT;
    const pointsNeeded = pointsForNextDiscount - pointsForCurrentDiscount;
    const pointsProgress = points - pointsForCurrentDiscount;

    return (pointsProgress / pointsNeeded) * 100;
  };

  const visitDiscount = loyaltyPoints ? calculateVisitDiscount(loyaltyPoints.page_visit_points) : 0;
  const liveDiscount = loyaltyPoints ? calculateLiveDiscount(loyaltyPoints.live_participation_count) : 0;
  const totalDiscount = visitDiscount + liveDiscount;
  const progressToNextVisitDiscount = loyaltyPoints ? calculateProgressToNextDiscount(loyaltyPoints.page_visit_points) : 0;

  const fetchLoyaltyPoints = useCallback(async () => {
    if (!user) {
      setLoyaltyPoints(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching loyalty points:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }

      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from('loyalty_points')
          .insert({
            user_id: user.id,
            page_visit_points: 0,
            live_participation_count: 0,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting loyalty points:', {
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
            code: insertError.code,
          });
          throw insertError;
        }
        setLoyaltyPoints(newData);
      } else {
        setLoyaltyPoints(data);
      }
    } catch (error: any) {
      console.error('Error in fetchLoyaltyPoints:', {
        error,
        message: error?.message,
        stack: error?.stack,
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshLoyaltyPoints = useCallback(async () => {
    await fetchLoyaltyPoints();
  }, [fetchLoyaltyPoints]);

  const trackPageVisit = useCallback(async (path: string) => {
    if (!user || !loyaltyPoints) return;

    try {
      const newPoints = loyaltyPoints.page_visit_points + POINTS_PER_VISIT;
      const { error: updateError } = await supabase
        .from('loyalty_points')
        .update({
          page_visit_points: newPoints,
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      await fetchLoyaltyPoints();
    } catch (error) {
      console.error('Error tracking page visit:', error);
    }
  }, [user, loyaltyPoints, fetchLoyaltyPoints]);

  const trackLiveParticipation = useCallback(async (liveId: string) => {
    if (!user) return;

    try {
      const { data: existing } = await supabase
        .from('live_participations')
        .select('id')
        .eq('user_id', user.id)
        .eq('live_id', liveId)
        .maybeSingle();

      if (existing) {
        return;
      }

      const { error: participationError } = await supabase
        .from('live_participations')
        .insert({
          user_id: user.id,
          live_id: liveId,
        });

      if (participationError) throw participationError;

      const newCount = (loyaltyPoints?.live_participation_count || 0) + 1;
      const { error: updateError } = await supabase
        .from('loyalty_points')
        .update({
          live_participation_count: newCount,
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      await fetchLoyaltyPoints();
    } catch (error) {
      console.error('Error tracking live participation:', error);
    }
  }, [user, loyaltyPoints?.live_participation_count, fetchLoyaltyPoints]);

  useEffect(() => {
    fetchLoyaltyPoints();
  }, [fetchLoyaltyPoints]);

  return (
    <LoyaltyContext.Provider
      value={{
        loyaltyPoints,
        loading,
        visitDiscount,
        liveDiscount,
        totalDiscount,
        progressToNextVisitDiscount,
        trackPageVisit,
        trackLiveParticipation,
        refreshLoyaltyPoints,
      }}
    >
      {children}
    </LoyaltyContext.Provider>
  );
}

export function useLoyalty() {
  const context = useContext(LoyaltyContext);
  if (context === undefined) {
    throw new Error('useLoyalty must be used within a LoyaltyProvider');
  }
  return context;
}
