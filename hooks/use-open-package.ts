'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface OpenPackage {
  id: string;
  user_id: string;
  status: 'active' | 'closed' | 'shipped';
  shipping_cost_paid: boolean;
  shipping_method_id: string | null;
  shipping_address_id: string | null;
  opened_at: string;
  closes_at: string;
  shipped_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OpenPackageOrder {
  id: string;
  open_package_id: string;
  order_id: string;
  added_at: string;
  paid_at: string | null;
  is_paid: boolean;
}

export function useOpenPackage() {
  const { user } = useAuth();
  const [openPackage, setOpenPackage] = useState<OpenPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    if (user) {
      loadActivePackage();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!openPackage || openPackage.status !== 'active') return;

    const interval = setInterval(() => {
      calculateTimeRemaining();
    }, 1000);

    return () => clearInterval(interval);
  }, [openPackage]);

  async function loadActivePackage() {
    try {
      const { data, error } = await supabase
        .from('open_packages')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;

      setOpenPackage(data);
    } catch (error) {
      console.error('Error loading open package:', error);
    } finally {
      setLoading(false);
    }
  }

  function calculateTimeRemaining() {
    if (!openPackage) return;

    const now = new Date().getTime();
    const closesAt = new Date(openPackage.closes_at).getTime();
    const difference = closesAt - now;

    if (difference <= 0) {
      setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      loadActivePackage();
      return;
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    setTimeRemaining({ days, hours, minutes, seconds });
  }

  async function createOpenPackage(shippingCostPaid: boolean, shippingMethodId: string, addressId: string) {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('open_packages')
        .insert([{
          user_id: user.id,
          shipping_cost_paid: shippingCostPaid,
          shipping_method_id: shippingMethodId,
          shipping_address_id: addressId,
          status: 'active'
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      setOpenPackage(data);
      return data;
    } catch (error) {
      console.error('Error creating open package:', error);
      throw error;
    }
  }

  async function addOrderToPackage(orderId: string) {
    if (!openPackage) return null;

    try {
      const { data, error } = await supabase
        .from('open_package_orders')
        .insert([{
          open_package_id: openPackage.id,
          order_id: orderId,
          is_paid: false
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding order to package:', error);
      throw error;
    }
  }

  async function markOrderAsPaid(packageOrderId: string) {
    try {
      const { error } = await supabase
        .from('open_package_orders')
        .update({
          is_paid: true,
          paid_at: new Date().toISOString()
        })
        .eq('id', packageOrderId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking order as paid:', error);
      throw error;
    }
  }

  async function closePackage() {
    if (!openPackage) return;

    try {
      const { error } = await supabase
        .from('open_packages')
        .update({
          status: 'closed'
        })
        .eq('id', openPackage.id);

      if (error) throw error;
      await loadActivePackage();
    } catch (error) {
      console.error('Error closing package:', error);
      throw error;
    }
  }

  return {
    openPackage,
    loading,
    timeRemaining,
    hasActivePackage: !!openPackage && openPackage.status === 'active',
    createOpenPackage,
    addOrderToPackage,
    markOrderAsPaid,
    closePackage,
    refreshPackage: loadActivePackage
  };
}
