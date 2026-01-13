'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Gift, Sparkles } from 'lucide-react';

interface LiveProgressBarProps {
  liveStreamId: string;
  viewerGoal: number;
  onChestUnlocked?: () => void;
}

export function LiveProgressBar({ liveStreamId, viewerGoal, onChestUnlocked }: LiveProgressBarProps) {
  const [currentViewers, setCurrentViewers] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    loadViewerCount();

    const channel = supabase
      .channel(`progress_${liveStreamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_viewers',
          filter: `live_stream_id=eq.${liveStreamId}`,
        },
        () => {
          loadViewerCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [liveStreamId]);

  async function loadViewerCount() {
    const { count } = await supabase
      .from('live_viewers')
      .select('*', { count: 'exact', head: true })
      .eq('live_stream_id', liveStreamId)
      .eq('is_active', true);

    const viewers = count || 0;
    setCurrentViewers(viewers);

    if (viewers >= viewerGoal && !isUnlocked) {
      setIsUnlocked(true);
      onChestUnlocked?.();

      await supabase
        .from('live_streams')
        .update({
          chest_unlocked: true,
          chest_unlocked_at: new Date().toISOString()
        })
        .eq('id', liveStreamId);
    }
  }

  const progress = Math.min((currentViewers / viewerGoal) * 100, 100);
  const remaining = Math.max(viewerGoal - currentViewers, 0);
  const isNearGoal = progress >= 80;

  return (
    <div className="bg-gradient-to-r from-[#1a1a1a] to-[#2a2a2a] rounded-xl p-6 shadow-2xl border-2 border-[#D4AF37]/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#b8933d] ${isNearGoal ? 'animate-pulse' : ''}`}>
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">La Jauge Vivante</h3>
            <p className="text-gray-400 text-sm">
              {isUnlocked ? (
                <span className="text-green-400 font-semibold">🎉 Coffre Déverrouillé !</span>
              ) : (
                <span>Encore <span className="text-[#D4AF37] font-bold">{remaining}</span> Copinettes pour déverrouiller le Coffre de Morgane ! 🎁</span>
              )}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[#D4AF37] font-bold text-2xl">{currentViewers}</div>
          <div className="text-gray-400 text-sm">/ {viewerGoal}</div>
        </div>
      </div>

      <div className="relative h-8 bg-black/50 rounded-full overflow-hidden border-2 border-[#D4AF37]/40">
        <div
          className={`h-full bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] transition-all duration-1000 ease-out relative ${
            isNearGoal ? 'animate-pulse' : ''
          }`}
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>

          {isNearGoal && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white animate-bounce" />
            </div>
          )}
        </div>

        {isUnlocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white font-bold text-lg drop-shadow-lg animate-bounce">
              ✨ DÉBLOQUÉ ! ✨
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 text-center text-xs text-gray-500">
        {Math.round(progress)}% complété
      </div>
    </div>
  );
}
