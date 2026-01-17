import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useUserCoupons(userId: string | undefined) {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchCoupons = async () => {
      // On suppose une table user_coupons ou coupons simple
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString()); // Valides uniquement

      if (!error && data) {
        setCoupons(data);
      }
      setLoading(false);
    };

    fetchCoupons();
  }, [userId]);

  return { coupons, loading };
}