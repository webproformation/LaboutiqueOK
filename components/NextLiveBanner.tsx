'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Video, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface LiveStream {
  id: string;
  title: string;
  scheduled_start: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function NextLiveBanner() {
  const [nextLive, setNextLive] = useState<LiveStream | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNextLive();
  }, []);

  useEffect(() => {
    if (!nextLive) return;

    const timer = setInterval(() => {
      calculateTimeRemaining();
    }, 1000);

    return () => clearInterval(timer);
  }, [nextLive]);

  async function loadNextLive() {
    try {
      const { data, error } = await supabase
        .from('live_streams')
        .select('id, title, scheduled_start')
        .eq('status', 'scheduled')
        .gte('scheduled_start', new Date().toISOString())
        .order('scheduled_start', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setNextLive(data);
      if (data) {
        calculateTimeRemaining();
      }
    } catch (error) {
      console.error('Error loading next live:', error);
    } finally {
      setLoading(false);
    }
  }

  function calculateTimeRemaining() {
    if (!nextLive) return;

    const now = new Date().getTime();
    const liveTime = new Date(nextLive.scheduled_start).getTime();
    const distance = liveTime - now;

    if (distance < 0) {
      setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    setTimeRemaining({ days, hours, minutes, seconds });
  }

  if (loading || !nextLive) return null;

  return (
    <div className="bg-gradient-to-r from-[#C6A15B] to-[#B8933D] text-white py-2 px-2 md:px-4">
      <Link href="/live" className="block">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 text-[10px] md:text-base hover:opacity-90 transition-opacity">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
            <span className="font-medium truncate max-w-[200px] md:max-w-none text-[10px] md:text-base">
              PROCHAIN LIVE : {nextLive.title}
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
