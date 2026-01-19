import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useUserCoupons(userId: string | undefined) {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadCoupons();
    }
  }, [userId]);

  const loadCoupons = async () => {
    try {
      // On ne charge que les coupons NON utilisés pour le checkout
      const { data, error } = await supabase
        .from('user_coupons')
        .select('*, coupon:coupons(*)')
        .eq('user_id', userId)
        .eq('is_used', false) // Important
        .order('obtained_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Erreur chargement coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  // C'est cette fonction qui fait le travail de déplacement vers "Utilisés"
  const markCouponAsUsed = async (userCouponId: string, orderId: string) => {
    try {
      console.log('Marquage du coupon comme utilisé:', userCouponId);
      
      const { error } = await supabase
        .from('user_coupons')
        .update({ 
          is_used: true, 
          used_at: new Date().toISOString(),
          order_id: orderId 
        })
        .eq('id', userCouponId)
        .eq('user_id', userId); // Sécurité supplémentaire

      if (error) {
        console.error('Erreur SQL lors du marquage:', error);
        throw error;
      }
      
      // On rafraîchit la liste locale pour qu'il disparaisse du sélecteur
      await loadCoupons();
      return true;
    } catch (error) {
      console.error('Impossible de marquer le coupon comme utilisé:', error);
      return false;
    }
  };

  return {
    coupons,
    loading,
    refreshCoupons: loadCoupons,
    markCouponAsUsed // On exporte bien la fonction
  };
}