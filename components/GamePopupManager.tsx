'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { ScratchCardGame } from './ScratchCardGame';
import { WheelGame } from './WheelGame';
import { CardFlipGame } from './CardFlipGame';
import { toast } from 'sonner';

interface ScratchCardGame {
  id: string;
  name: string;
  description: string;
  card_design: {
    backgroundColor: string;
    scratchColor: string;
  };
  prizes: Array<{
    coupon_id: string;
    coupon_code: string;
    probability: number;
  }>;
  max_plays_per_user: number;
}

interface WheelGameType {
  id: string;
  name: string;
  description: string;
  wheel_design: {
    backgroundColor: string;
    wheelColors: string[];
  };
  segments: Array<{
    label: string;
    color: string;
    coupon_id: string;
    coupon_code: string;
    probability: number;
  }>;
  max_plays_per_user: number;
}

interface CardFlipGameType {
  id: string;
  name: string;
  description: string;
  coupon_id: string;
  max_plays_per_user: number;
}

export function GamePopupManager() {
  const { user } = useAuth();
  const [scratchGame, setScratchGame] = useState<ScratchCardGame | null>(null);
  const [wheelGame, setWheelGame] = useState<WheelGameType | null>(null);
  const [cardFlipGame, setCardFlipGame] = useState<CardFlipGameType | null>(null);
  const [showScratchGame, setShowScratchGame] = useState(false);
  const [showWheelGame, setShowWheelGame] = useState(false);
  const [showCardFlipGame, setShowCardFlipGame] = useState(false);

  useEffect(() => {
    if (user) {
      loadActiveGames();
    }
  }, [user]);

  const loadActiveGames = async () => {
    try {
      const now = new Date().toISOString();

      const { data: scratchData, error: scratchError } = await supabase
        .from('scratch_card_games')
        .select('*')
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (scratchError) {
        console.error('Error loading scratch games:', scratchError);
      }

      const { data: wheelData, error: wheelError } = await supabase
        .from('wheel_games')
        .select('*')
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (wheelError) {
        console.error('Error loading wheel games:', wheelError);
      }

      const { data: cardFlipData, error: cardFlipError } = await supabase
        .from('card_flip_games')
        .select('*')
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cardFlipError) {
        console.error('Error loading card flip games:', cardFlipError);
      }

      const hasSeenToday = sessionStorage.getItem('game-popup-seen-today');
      const today = new Date().toDateString();

      if (scratchData && (!hasSeenToday || hasSeenToday !== today)) {
        const canPlay = await checkCanPlay('scratch_card', scratchData.id, scratchData.max_plays_per_user);
        if (canPlay) {
          setScratchGame(scratchData);
          setTimeout(() => setShowScratchGame(true), 2000);
          sessionStorage.setItem('game-popup-seen-today', today);
        }
      } else if (wheelData && (!hasSeenToday || hasSeenToday !== today)) {
        const canPlay = await checkCanPlay('wheel', wheelData.id, wheelData.max_plays_per_user);
        if (canPlay) {
          setWheelGame(wheelData);
          setTimeout(() => setShowWheelGame(true), 2000);
          sessionStorage.setItem('game-popup-seen-today', today);
        }
      } else if (cardFlipData && (!hasSeenToday || hasSeenToday !== today) && user) {
        const { data: plays } = await supabase
          .from('card_flip_game_plays')
          .select('*')
          .eq('user_id', user.id)
          .eq('game_id', cardFlipData.id);

        const canPlay = (plays?.length || 0) < cardFlipData.max_plays_per_user;
        if (canPlay) {
          setCardFlipGame(cardFlipData);
          setTimeout(() => setShowCardFlipGame(true), 2000);
          sessionStorage.setItem('game-popup-seen-today', today);
        }
      }
    } catch (error) {
      console.error('Error loading games:', error);
    }
  };

  const checkCanPlay = async (gameType: string, gameId: string, maxPlays: number) => {
    if (!user) return false;

    try {
      const { data } = await supabase
        .from('game_plays')
        .select('*')
        .eq('user_id', user.id)
        .eq('game_type', gameType)
        .eq('game_id', gameId);

      const plays = data?.length || 0;
      return plays < maxPlays;
    } catch (error) {
      console.error('Error checking plays:', error);
      return false;
    }
  };

  const handleWin = async (couponCode: string) => {
    if (!user) return;

    try {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('id, code')
        .eq('code', couponCode)
        .maybeSingle();

      if (coupon) {
        const { data: existingAssignment } = await supabase
          .from('user_coupons')
          .select('id')
          .eq('user_id', user.id)
          .eq('coupon_code', coupon.code)
          .maybeSingle();

        if (!existingAssignment) {
          await supabase.from('user_coupons').insert({
            user_id: user.id,
            coupon_id: coupon.id,
            coupon_code: coupon.code,
            is_used: false,
          });
        }
      }

      toast.success(`Félicitations ! Vous avez gagné le code : ${couponCode}`, {
        duration: 5000,
      });
    } catch (error) {
      console.error('Error creating user coupon:', error);
      toast.success(`Félicitations ! Vous avez gagné le code : ${couponCode}`, {
        duration: 5000,
      });
    }
  };

  return (
    <>
      {showScratchGame && scratchGame && (
        <ScratchCardGame
          game={scratchGame}
          onClose={() => setShowScratchGame(false)}
          onWin={handleWin}
        />
      )}

      {showWheelGame && wheelGame && (
        <WheelGame
          game={wheelGame}
          onClose={() => setShowWheelGame(false)}
          onWin={handleWin}
        />
      )}

      {showCardFlipGame && cardFlipGame && (
        <CardFlipGame
          gameId={cardFlipGame.id}
          onClose={() => setShowCardFlipGame(false)}
        />
      )}
    </>
  );
}
