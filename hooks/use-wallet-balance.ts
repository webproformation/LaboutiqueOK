import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/context/AuthContext';

export function useWalletBalance() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!user) {
      setBalance(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('loyalty_transactions')
        .select('amount')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      const totalBalance = data?.reduce((sum, transaction) => sum + parseFloat(transaction.amount.toString()), 0) || 0;

      setBalance(totalBalance);
    } catch (err) {
      console.error('Error fetching wallet balance:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setBalance(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const deductAmount = useCallback(async (amount: number, description: string, referenceId?: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (amount > balance) {
      throw new Error('Solde insuffisant');
    }

    try {
      const { error: insertError } = await supabase
        .from('loyalty_transactions')
        .insert({
          user_id: user.id,
          amount: -amount,
          type: 'admin_adjustment',
          description: description,
          reference_id: referenceId,
        });

      if (insertError) throw insertError;

      await fetchBalance();
    } catch (err) {
      console.error('Error deducting amount:', err);
      throw err;
    }
  }, [user, balance, fetchBalance]);

  return {
    balance,
    loading,
    error,
    refreshBalance: fetchBalance,
    deductAmount,
  };
}
