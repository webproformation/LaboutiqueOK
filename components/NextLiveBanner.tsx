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
    <div className="bg-gradient-to-r from-[#C6A15B] to-[#B8933D] text-white py-2 px-4">
      <Link href="/live" className="block">
        <div className="container mx-auto flex items-center justify-center gap-3 text-sm md:text-base hover:opacity-90 transition-opacity">
          <Video className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium truncate max-w-[150px] md:max-w-none">
            PROCHAIN LIVE : {nextLive.title}
          </span>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span className="font-mono font-bold whitespace-nowrap">
              {timeRemaining.days > 0 && `${timeRemaining.days}j `}
              {timeRemaining.hours.toString().padStart(2, '0')}h : {timeRemaining.minutes.toString().padStart(2, '0')}m
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
