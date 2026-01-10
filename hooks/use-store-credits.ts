import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface StoreCredit {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  status: string;
  created_at: string;
  expires_at: string | null;
  used_at: string | null;
  order_id: string | null;
}

export function useStoreCredits(userId?: string) {
  const [storeCredits, setStoreCredits] = useState<StoreCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAvailable, setTotalAvailable] = useState(0);

  useEffect(() => {
    if (userId) {
      loadStoreCredits();
    }
  }, [userId]);

  const loadStoreCredits = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('store_credits')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'available')
        .order('created_at', { ascending: true });

      if (error) throw error;

      setStoreCredits(data || []);

      const total = (data || []).reduce((sum, credit) => sum + Number(credit.amount), 0);
      setTotalAvailable(total);
    } catch (error) {
      console.error('Error loading store credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const useStoreCredit = async (creditId: string, orderId: string) => {
    try {
      const { error } = await supabase
        .from('store_credits')
        .update({
          status: 'used',
          used_at: new Date().toISOString(),
          order_id: orderId,
        })
        .eq('id', creditId);

      if (error) throw error;

      await loadStoreCredits();
      return { success: true };
    } catch (error) {
      console.error('Error using store credit:', error);
      return { success: false, error };
    }
  };

  return {
    storeCredits,
    totalAvailable,
    loading,
    useStoreCredit,
    reload: loadStoreCredits,
  };
}
