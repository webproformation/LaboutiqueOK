import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export function useWalletBalance() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshBalance = async () => {
    if (!user) {
      setBalance(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error loading wallet balance:', error);
      setBalance(0);
    } else {
      setBalance(parseFloat(data?.wallet_balance || '0'));
    }

    setLoading(false);
  };

  useEffect(() => {
    refreshBalance();
  }, [user]);

  return { balance, loading, refreshBalance };
}
