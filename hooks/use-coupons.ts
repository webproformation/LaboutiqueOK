import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface UserCoupon {
  id: string;
  code: string;
  source: string;
  is_used: boolean;
  obtained_at: string;
  valid_until: string;
  coupon_types: {
    id: string;
    code: string;
    type: 'discount_amount' | 'discount_percentage' | 'free_delivery';
    value: number;
    description: string;
  };
}

export function useCoupons() {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCoupons = async () => {
    if (!user) {
      setCoupons([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from('user_coupons')
      .select(`
        *,
        coupon_types (
          id,
          code,
          type,
          value,
          description
        )
      `)
      .eq('user_id', user.id)
      .eq('is_used', false)
      .gte('valid_until', new Date().toISOString());

    if (error) {
      console.error('Error loading coupons:', error);
      setCoupons([]);
    } else {
      setCoupons(data as UserCoupon[] || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadCoupons();
  }, [user]);

  return { coupons, loading, refreshCoupons: loadCoupons };
}
