'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Package, Clock } from 'lucide-react';
import Link from 'next/link';

interface OpenPackage {
  id: string;
  closes_at: string;
  status: string;
}

export default function OpenPackageCountdownBanner() {
  const { user } = useAuth();
  const [openPackage, setOpenPackage] = useState<OpenPackage | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<{days: number; hours: number; minutes: number; seconds: number} | null>(null);

  useEffect(() => {
    if (user) {
      loadOpenPackage();
      const interval = setInterval(loadOpenPackage, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (openPackage) {
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [openPackage]);

  async function loadOpenPackage() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('open_packages')
        .select('id, closes_at, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!error && data) {
        setOpenPackage(data);
      } else {
        setOpenPackage(null);
      }
    } catch (error) {
      console.error('Error loading open package:', error);
    }
  }

  function updateCountdown() {
    if (!openPackage) return;

    const now = new Date().getTime();
    const closes = new Date(openPackage.closes_at).getTime();
    const diff = closes - now;

    if (diff <= 0) {
      setTimeRemaining(null);
      closePackageAutomatically();
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    setTimeRemaining({ days, hours, minutes, seconds });
  }

  async function closePackageAutomatically() {
    if (!openPackage) return;

    try {
      const { error } = await supabase
        .from('open_packages')
        .update({
          status: 'closed',
          updated_at: new Date().toISOString()
        })
        .eq('id', openPackage.id);

      if (!error) {
        setOpenPackage(null);
      }
    } catch (error) {
      console.error('Error closing package:', error);
    }
  }

  if (!openPackage || !timeRemaining) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-white py-2 px-2 md:px-4">
      <Link href="/account/my-packages" className="block">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 text-[10px] md:text-base hover:opacity-90 transition-opacity">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0 animate-pulse" />
            <span className="font-medium whitespace-nowrap text-[10px] md:text-base">
              COLIS OUVERT ACTIF
            </span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            <Clock className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            <span className="font-mono font-bold whitespace-nowrap text-[10px] md:text-base">
              {timeRemaining.days > 0 && `${timeRemaining.days}j `}
              {timeRemaining.hours.toString().padStart(2, '0')}h : {timeRemaining.minutes.toString().padStart(2, '0')}m
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
