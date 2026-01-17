'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Play, Radio } from 'lucide-react';
import Link from 'next/link';

interface LiveStream {
  id: string;
  title: string;
  status: string;
}

export function LiveBanner() {
  const [currentLive, setCurrentLive] = useState<LiveStream | null>(null);

  useEffect(() => {
    checkLiveStatus();

    const channel = supabase
      .channel('live_status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_streams',
        },
        () => {
          checkLiveStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function checkLiveStatus() {
    const { data } = await supabase
      .from('live_streams')
      .select('id, title, status')
      .eq('status', 'live')
      .maybeSingle();

    setCurrentLive(data);
  }

  if (!currentLive) return null;

  return (
    <Link href="/live">
      <div className="relative bg-gradient-to-r from-red-600 via-red-500 to-pink-500 overflow-hidden cursor-pointer group">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />

        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-4 text-white">
            <div className="flex items-center gap-2 animate-pulse">
              <div className="relative">
                <Radio className="w-6 h-6" />
                <div className="absolute inset-0 animate-ping">
                  <Radio className="w-6 h-6 opacity-75" />
                </div>
              </div>
              <span className="font-bold text-lg uppercase tracking-wide">
                LIVE EN COURS
              </span>
            </div>

            <div className="hidden md:block h-6 w-px bg-white/30" />

            <div className="hidden md:flex items-center gap-2">
              <Play className="w-5 h-5 fill-white" />
              <span className="font-medium">
                {currentLive.title}
              </span>
            </div>

            <div className="hidden lg:block h-6 w-px bg-white/30" />

            <span className="hidden lg:inline text-sm font-semibold bg-white/20 px-4 py-1 rounded-full group-hover:bg-white/30 transition-colors">
              Cliquez pour rejoindre →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
