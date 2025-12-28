'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';

export function useDailyConnectionBonus() {
  const { user } = useAuth();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (!user || hasCheckedRef.current) return;

    const checkAndAwardBonus = async () => {
      try {
        const { data, error } = await supabase.rpc('award_daily_connection_bonus', {
          p_user_id: user.id
        });

        if (error) throw error;

        if (data.success) {
          toast.success(data.message, {
            duration: 5000
          });
        }

        hasCheckedRef.current = true;
      } catch (error) {
        console.error('Error checking daily bonus:', error);
      }
    };

    const timer = setTimeout(checkAndAwardBonus, 2000);

    return () => clearTimeout(timer);
  }, [user]);
}

export default useDailyConnectionBonus;