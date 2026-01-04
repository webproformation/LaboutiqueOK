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
        // Check if user already has a daily connection bonus today
        const today = new Date().toISOString().split('T')[0];

        const { data: existingBonus, error: checkError } = await supabase
          .from('loyalty_transactions')
          .select('id')
          .eq('user_id', user.id)
          .eq('type', 'daily_connection')
          .gte('created_at', `${today}T00:00:00`)
          .maybeSingle();

        if (checkError) throw checkError;

        if (existingBonus) {
          console.log('Daily bonus already awarded today');
          hasCheckedRef.current = true;
          return;
        }

        // Award daily connection bonus (5 euros)
        const bonusAmount = 5.0;

        const { error: insertError } = await supabase
          .from('loyalty_transactions')
          .insert({
            user_id: user.id,
            amount: bonusAmount,
            type: 'daily_connection',
            description: 'Bonus de connexion quotidien',
          });

        if (insertError) throw insertError;

        // Update user wallet balance
        const { data: profile } = await supabase
          .from('profiles')
          .select('wallet_balance')
          .eq('id', user.id)
          .maybeSingle();

        const currentBalance = profile?.wallet_balance || 0;

        await supabase
          .from('profiles')
          .update({ wallet_balance: currentBalance + bonusAmount })
          .eq('id', user.id);

        toast.success(`+${bonusAmount.toFixed(2)} € ajoutés à votre cagnotte fidélité !`, {
          duration: 5000
        });

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
