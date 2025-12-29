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
        const response = await fetch(
          `/api/loyalty/award-bonus`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id: user.id })
          }
        );

        if (!response.ok) throw new Error('Failed to check daily bonus');

        const data = await response.json();

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