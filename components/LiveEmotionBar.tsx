'use client';

import { useState } from 'react';
import { Heart, Flame, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface LiveEmotionBarProps {
  liveStreamId: string;
  onEmotionSent?: (type: string) => void;
}

export function LiveEmotionBar({ liveStreamId, onEmotionSent }: LiveEmotionBarProps) {
  const { user } = useAuth();
  const [cooldown, setCooldown] = useState(false);

  async function sendEmotion(type: 'heart' | 'fire' | 'star') {
    if (!user) {
      toast.error('Connectez-vous pour envoyer des émotions');
      return;
    }

    if (cooldown) return;

    setCooldown(true);
    setTimeout(() => setCooldown(false), 1000);

    const { error } = await supabase
      .from('live_emotions')
      .insert({
        live_stream_id: liveStreamId,
        user_id: user.id,
        emotion_type: type
      });

    if (error) {
      console.error('Error sending emotion:', error);
      return;
    }

    onEmotionSent?.(type);
    createParticle(type);
  }

  function createParticle(type: string) {
    const container = document.getElementById('emotion-particles');
    if (!container) return;

    const particle = document.createElement('div');
    particle.className = 'emotion-particle';

    const icons = {
      heart: '❤️',
      fire: '🔥',
      star: '⭐'
    };

    particle.textContent = icons[type as keyof typeof icons];
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDuration = `${2 + Math.random() * 2}s`;

    container.appendChild(particle);

    setTimeout(() => particle.remove(), 4000);
  }

  return (
    <>
      <div id="emotion-particles" className="fixed inset-0 pointer-events-none z-50" />

      <div className="flex items-center gap-3 bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur-sm rounded-full p-2 border-2 border-pink-400/30">
        <Button
          size="icon"
          onClick={() => sendEmotion('heart')}
          disabled={cooldown}
          className="rounded-full bg-gradient-to-br from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 transition-all duration-300 transform hover:scale-110 disabled:opacity-50"
        >
          <Heart className="w-5 h-5 fill-white" />
        </Button>

        <Button
          size="icon"
          onClick={() => sendEmotion('fire')}
          disabled={cooldown}
          className="rounded-full bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 transition-all duration-300 transform hover:scale-110 disabled:opacity-50"
        >
          <Flame className="w-5 h-5 fill-white" />
        </Button>

        <Button
          size="icon"
          onClick={() => sendEmotion('star')}
          disabled={cooldown}
          className="rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 transform hover:scale-110 disabled:opacity-50"
        >
          <Star className="w-5 h-5 fill-white" />
        </Button>
      </div>
    </>
  );
}
