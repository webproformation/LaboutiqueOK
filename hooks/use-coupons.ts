import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface UserCoupon {
  id: string;
  user_id: string;
  coupon_id: string;
  assigned_at: string;
  is_used: boolean;
  used_at?: string;
  coupon?: {
    id: string;
    code: string;
    description: string;
    discount_type: 'fixed' | 'percentage' | 'free_shipping';
    discount_value: number;
    min_purchase_amount?: number;
    valid_from?: string;
    valid_until?: string;
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
        .select(`
          *,
          coupon:coupons (
            id,
            code,
            description,
            discount_type,
            discount_value,
            min_purchase_amount,
            valid_from,
            valid_until,
            is_active
          )
        `)
        .eq('user_id', user.id)
        .eq('is_used', false);

      if (error) {
        console.error('Error loading coupons:', error);
        setCoupons([]);
      } else {
        const validCoupons = (data || []).filter(c => {
          if (!c.coupon) return false;
          if (!c.coupon.is_active) return false;
          if (c.coupon.valid_until && new Date(c.coupon.valid_until) < new Date()) return false;
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
