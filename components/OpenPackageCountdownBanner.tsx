'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Package, Clock, ChevronDown, ChevronUp, X } from 'lucide-react';
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

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

  if (!openPackage || !timeRemaining || isDismissed) {
    return null;
  }

  return (
    <div className="relative w-full bg-gradient-to-r from-[#D4AF37] via-[#E5C562] to-[#D4AF37] shadow-lg z-50">
      <div className="max-w-7xl mx-auto">
        {!isCollapsed ? (
          <div className="px-4 py-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm md:text-base">
                    Colis ouvert actif
                  </p>
                  <p className="text-white/90 text-xs md:text-sm">
                    Expédition automatique dans
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-4">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                  <Clock className="h-5 w-5 text-white" />
                  <div className="flex items-center gap-1 text-white font-mono font-bold text-lg md:text-xl">
                    {timeRemaining.days > 0 && (
                      <>
                        <span className="min-w-[2ch] text-center">{timeRemaining.days}</span>
                        <span className="text-white/70">j</span>
                      </>
                    )}
                    <span className="min-w-[2ch] text-center">{String(timeRemaining.hours).padStart(2, '0')}</span>
                    <span className="text-white/70">:</span>
                    <span className="min-w-[2ch] text-center">{String(timeRemaining.minutes).padStart(2, '0')}</span>
                    <span className="text-white/70">:</span>
                    <span className="min-w-[2ch] text-center">{String(timeRemaining.seconds).padStart(2, '0')}</span>
                  </div>
                </div>

                <Link href="/account/my-packages">
                  <button className="bg-white text-[#D4AF37] px-4 py-2 rounded-lg font-semibold text-sm hover:bg-white/90 transition-colors whitespace-nowrap">
                    Voir mon colis
                  </button>
                </Link>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsCollapsed(true)}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    aria-label="Réduire"
                  >
                    <ChevronUp className="h-4 w-4 text-white" />
                  </button>
                  <button
                    onClick={() => setIsDismissed(true)}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    aria-label="Fermer"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-full px-4 py-2 flex items-center justify-between hover:bg-black/10 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-white" />
              <span className="text-white text-sm font-semibold">Colis ouvert actif</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-mono font-bold">
                {timeRemaining.days > 0 && `${timeRemaining.days}j `}
                {String(timeRemaining.hours).padStart(2, '0')}:{String(timeRemaining.minutes).padStart(2, '0')}:{String(timeRemaining.seconds).padStart(2, '0')}
              </span>
              <ChevronDown className="h-4 w-4 text-white" />
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
