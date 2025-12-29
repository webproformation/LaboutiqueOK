"use client";

import dynamic from 'next/dynamic';
import HeroSlider from '@/components/HeroSlider';
import HomeCategories from '@/components/HomeCategories';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase-client';
import { usePathname } from 'next/navigation';

const ScratchCardGame = dynamic(() => import('@/components/ScratchCardGame'), { ssr: false });
const WheelGame = dynamic(() => import('@/components/WheelGame'), { ssr: false });
const FeaturedProductsSlider = dynamic(() => import('@/components/FeaturedProductsSlider'), { ssr: false });
const VideoShowcase = dynamic(() => import('@/components/VideoShowcase'), { ssr: false });
const GuestbookSlider = dynamic(() => import('@/components/GuestbookSlider'), { ssr: false });
const WeeklyAmbassador = dynamic(() => import('@/components/WeeklyAmbassador'), { ssr: false });
const GuestbookCounters = dynamic(() => import('@/components/GuestbookCounters'), { ssr: false });
const LiveStreamsSlider = dynamic(() => import('@/components/LiveStreamsSlider'), { ssr: false });
const CustomerReviewsSlider = dynamic(() => import('@/components/CustomerReviewsSlider'), { ssr: false });
const GeneralReviewForm = dynamic(() => import('@/components/GeneralReviewForm'), { ssr: false });

interface ScratchGameSettings {
  is_enabled: boolean;
  popup_delay_seconds: number;
  win_probability: number;
  max_plays_per_user: number;
  max_plays_per_day: number;
}

interface WheelGameSettings {
  is_enabled: boolean;
  popup_delay_seconds: number;
  max_plays_per_day: number;
  max_plays_per_user: number;
  require_authentication: boolean;
}

type ActiveGame = 'scratch' | 'wheel' | null;

export default function Home() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [showScratchGame, setShowScratchGame] = useState(false);
  const [showWheelGame, setShowWheelGame] = useState(false);
  const [scratchSettings, setScratchSettings] = useState<ScratchGameSettings | null>(null);
  const [wheelSettings, setWheelSettings] = useState<WheelGameSettings | null>(null);
  const [activeGame, setActiveGame] = useState<ActiveGame>(null);
  const [canPlay, setCanPlay] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random()}`);

  useEffect(() => {
    const fetchGameSettings = async () => {
      const [scratchRes, wheelRes] = await Promise.all([
        supabase.from('scratch_game_settings').select('*').limit(1).maybeSingle(),
        supabase.from('wheel_game_settings').select('*').limit(1).maybeSingle()
      ]);

      if (scratchRes.data?.is_enabled) {
        setScratchSettings(scratchRes.data);
        setActiveGame('scratch');
      } else if (wheelRes.data?.is_enabled) {
        setWheelSettings(wheelRes.data);
        setActiveGame('wheel');
      }
    };

    fetchGameSettings();
  }, []);

  useEffect(() => {
    if (activeGame === 'scratch' && scratchSettings) {
      let timer: NodeJS.Timeout | null = null;

      const checkCanPlayAndShowGame = async () => {
        if (!user) {
          setCanPlay(true);
          timer = setTimeout(() => {
            setShowScratchGame(true);
          }, scratchSettings.popup_delay_seconds * 1000);
          return;
        }

        let canPlayNow = true;

        if (scratchSettings.max_plays_per_day > 0) {
          const { data: playsToday } = await supabase
            .rpc('get_user_plays_today', { user_uuid: user.id });

          const todayCount = playsToday || 0;
          if (todayCount >= scratchSettings.max_plays_per_day) {
            canPlayNow = false;
          }
        }

        if (canPlayNow && scratchSettings.max_plays_per_user > 0) {
          const { data: plays } = await supabase
            .from('scratch_game_plays')
            .select('id')
            .eq('user_id', user.id);

          const playCount = plays?.length || 0;
          if (playCount >= scratchSettings.max_plays_per_user) {
            canPlayNow = false;
          }
        }

        setCanPlay(canPlayNow);

        if (canPlayNow) {
          timer = setTimeout(() => {
            setShowScratchGame(true);
          }, scratchSettings.popup_delay_seconds * 1000);
        }
      };

      checkCanPlayAndShowGame();

      return () => {
        if (timer) {
          clearTimeout(timer);
        }
      };
    }
  }, [user, scratchSettings, activeGame]);

  useEffect(() => {
    if (activeGame === 'wheel' && wheelSettings) {
      let timer: NodeJS.Timeout | null = null;

      const checkCanPlayAndShowGame = async () => {
        if (!user && wheelSettings.require_authentication) {
          return;
        }

        let canPlayNow = true;

        if (user) {
          if (wheelSettings.max_plays_per_user > 0) {
            const { count: totalPlays } = await supabase
              .from('wheel_game_plays')
              .select('*', { count: 'exact' })
              .eq('user_id', user.id);

            if (totalPlays && totalPlays >= wheelSettings.max_plays_per_user) {
              canPlayNow = false;
            }
          }

          if (canPlayNow && wheelSettings.max_plays_per_day > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { count } = await supabase
              .from('wheel_game_plays')
              .select('*', { count: 'exact' })
              .eq('user_id', user.id)
              .gte('created_at', today.toISOString());

            if (count && count >= wheelSettings.max_plays_per_day) {
              canPlayNow = false;
            }
          }
        } else {
          if (wheelSettings.max_plays_per_day > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { count } = await supabase
              .from('wheel_game_plays')
              .select('*', { count: 'exact' })
              .eq('session_id', sessionId)
              .gte('created_at', today.toISOString());

            if (count && count >= wheelSettings.max_plays_per_day) {
              canPlayNow = false;
            }
          }
        }

        setCanPlay(canPlayNow);

        if (canPlayNow) {
          timer = setTimeout(() => {
            setShowWheelGame(true);
          }, wheelSettings.popup_delay_seconds * 1000);
        }
      };

      checkCanPlayAndShowGame();

      return () => {
        if (timer) {
          clearTimeout(timer);
        }
      };
    }
  }, [user, wheelSettings, activeGame, sessionId]);

  return (
    <>
      {showScratchGame && scratchSettings && activeGame === 'scratch' && (
        <ScratchCardGame
          onClose={() => setShowScratchGame(false)}
          winProbability={scratchSettings.win_probability}
        />
      )}
      {showWheelGame && activeGame === 'wheel' && (
        <WheelGame onClose={() => setShowWheelGame(false)} />
      )}
      <HeroSlider />
      <HomeCategories />
      <FeaturedProductsSlider />
      <VideoShowcase />
      {/* <WeeklyAmbassador /> */}
      {/* <GuestbookSlider /> */}
      {/* <GuestbookCounters /> */}
      {/* <LiveStreamsSlider /> */}
      {/* <CustomerReviewsSlider /> */}
      {/* <GeneralReviewForm /> */}
    </>
  );
}
