import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface UserCoupon {
  id: string;
  user_id: string;
  coupon_id: string;
  code: string;
  source: string;
  is_used: boolean;
  used_at?: string;
  obtained_at: string;
  valid_until: string;
  coupon?: {
    id: string;
    code: string;
    type: string;
    value: number;
    description: string;
    name?: string;
    discount_type?: string;
    discount_value?: number;
    is_active: boolean;
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

    try {
      const { data, error } = await supabase
        .from('user_coupons')
        .select('*, coupon:coupons(*)')
        .eq('user_id', user.id)
        .eq('is_used', false);

      if (error) {
        console.error('Error loading coupons:', error);
        setCoupons([]);
      } else {
        const validCoupons = (data || []).filter(c => {
          if (!c.coupon) return false;
          if (!c.coupon.is_active) return false;
          if (c.valid_until && new Date(c.valid_until) < new Date()) return false;
          return true;
        });
        setCoupons(validCoupons);
      }
    } catch (error) {
      console.error('Error loading coupons:', error);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, [user]);

  return { coupons, loading, refreshCoupons: loadCoupons };
}
