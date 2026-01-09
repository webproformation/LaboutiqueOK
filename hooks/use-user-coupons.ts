import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface UserCoupon {
  id: string;
  user_id: string;
  coupon_type_id: string;
  code: string;
  source: string;
  is_used: boolean;
  used_at: string | null;
  order_id: string | null;
  obtained_at: string;
  valid_until: string;
  coupon_type?: {
    name: string;
    discount_type: string;
    discount_value: number;
    description: string;
  };
}

export function useUserCoupons(userId: string | undefined) {
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCoupons = async () => {
    if (!userId) {
      setCoupons([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_coupons')
        .select(`
          *,
          coupon_type:coupon_types!coupon_type_id(
            name,
            discount_type,
            discount_value,
            description
          )
        `)
        .eq('user_id', userId)
        .eq('is_used', false)
        .gte('valid_until', new Date().toISOString())
        .order('obtained_at', { ascending: false });

      if (fetchError) throw fetchError;

      setCoupons(data || []);
    } catch (err: any) {
      console.error('Error loading user coupons:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, [userId]);

  const markCouponAsUsed = async (couponId: string, orderId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('user_coupons')
        .update({
          is_used: true,
          used_at: new Date().toISOString(),
          order_id: orderId,
        })
        .eq('id', couponId);

      if (updateError) throw updateError;

      await loadCoupons();
      return { success: true };
    } catch (err: any) {
      console.error('Error marking coupon as used:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    coupons,
    loading,
    error,
    reload: loadCoupons,
    markCouponAsUsed,
  };
}
