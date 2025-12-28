"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Clock, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface DeliveryBatch {
  id: string;
  created_at: string;
  validate_at: string;
  status: string;
}

export function DeliveryBatchBanner() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeBatch, setActiveBatch] = useState<DeliveryBatch | null>(null);
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchActiveBatch = async () => {
      const { data, error } = await supabase
        .from('delivery_batches')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (!error && data) {
        setActiveBatch(data);
      }
    };

    fetchActiveBatch();

    const subscription = supabase
      .channel('delivery_batches_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_batches',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchActiveBatch();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    if (!activeBatch) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const validateAt = new Date(activeBatch.validate_at).getTime();
      const distance = validateAt - now;

      if (distance < 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [activeBatch]);

  const handleFinalizeBatch = async () => {
    if (!activeBatch) return;

    setFinalizing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/validate-delivery-batch`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            batchId: activeBatch.id,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erreur lors de la validation du colis');
      }

      toast.success('Colis validé avec succès !');
      router.push(`/order-confirmation/${result.orderNumber}`);
    } catch (error) {
      console.error('Error finalizing batch:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue lors de la validation';
      toast.error(errorMessage);
    } finally {
      setFinalizing(false);
    }
  };

  if (!activeBatch) return null;

  return (
    <div className="w-full bg-[rgb(184,147,61)] text-white">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 flex-shrink-0" />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">Mon colis ouvert :</span>
              <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-md">
                <Clock className="h-4 w-4" />
                <span className="font-mono font-semibold">
                  {timeRemaining.days}j {String(timeRemaining.hours).padStart(2, '0')}h{' '}
                  {String(timeRemaining.minutes).padStart(2, '0')}m
                </span>
              </div>
              <span className="text-sm opacity-90">restantes</span>
            </div>
          </div>
          <Button
            onClick={handleFinalizeBatch}
            disabled={finalizing}
            variant="secondary"
            size="sm"
            className="bg-white text-[rgb(184,147,61)] hover:bg-white/90 font-medium"
          >
            {finalizing ? 'Validation...' : 'J\'envoie mon colis en cours'}
          </Button>
        </div>
      </div>
    </div>
  );
}
