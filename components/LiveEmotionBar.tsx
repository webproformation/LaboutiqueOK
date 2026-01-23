'use client';

import { useEffect, useState } from 'react';
import { Heart, Flame, Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface LiveEmotionBarProps {
  liveStreamId: string;
}

export function LiveEmotionBar({ liveStreamId }: LiveEmotionBarProps) {
  const { user } = useAuth();
  const [cooldown, setCooldown] = useState(false);

  // Écouter les émotions des autres en temps réel
  useEffect(() => {
    const channel = supabase
      .channel('public:live_emotions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_emotions',
          filter: `live_stream_id=eq.${liveStreamId}`,
        },
        (payload) => {
          // Quand une émotion arrive (de moi ou d'un autre), on lance l'animation
          createParticle(payload.new.emotion_type);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [liveStreamId]);

  async function sendEmotion(type: 'heart' | 'fire' | 'star') {
    if (cooldown) return;
    
    // Animation locale immédiate (pour que ça soit réactif)
    setCooldown(true);
    setTimeout(() => setCooldown(false), 800);

    // On envoie à la base de données (si connecté ou non)
    await supabase.from('live_emotions').insert({
      live_stream_id: liveStreamId,
      user_id: user?.id || null, // Autorise les anonymes si la base le permet
      emotion_type: type
    });
  }

  function createParticle(type: string) {
    const container = document.getElementById('emotion-particles');
    if (!container) return;

    const particle = document.createElement('div');
    particle.className = 'emotion-particle fixed pointer-events-none z-[100] text-4xl animate-float-up';
    
    const icons: any = { heart: '❤️', fire: '🔥', star: '⭐', confetti: '🎉' };
    particle.textContent = icons[type] || '✨';
    
    // Position aléatoire en bas de l'écran
    particle.style.left = `${10 + Math.random() * 80}%`;
    particle.style.bottom = '0px';
    
    container.appendChild(particle);

    // Nettoyage après l'animation
    setTimeout(() => particle.remove(), 3000);
  }

  return (
    <>
      <div id="emotion-particles" className="fixed inset-0 pointer-events-none overflow-hidden" />
      <style jsx global>{`
        @keyframes float-up {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          10% { opacity: 1; transform: translateY(-20px) scale(1.2); }
          100% { transform: translateY(-80vh) scale(1); opacity: 0; }
        }
        .animate-float-up { animation: float-up 3s ease-out forwards; }
      `}</style>

      <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full p-1.5 border border-white/10 shadow-lg">
        <Button size="icon" onClick={() => sendEmotion('heart')} disabled={cooldown} className="rounded-full bg-pink-500/80 hover:bg-pink-600 w-8 h-8">
          <Heart className="w-4 h-4 text-white fill-white" />
        </Button>
        <Button size="icon" onClick={() => sendEmotion('fire')} disabled={cooldown} className="rounded-full bg-orange-500/80 hover:bg-orange-600 w-8 h-8">
          <Flame className="w-4 h-4 text-white fill-white" />
        </Button>
        <Button size="icon" onClick={() => sendEmotion('star')} disabled={cooldown} className="rounded-full bg-yellow-500/80 hover:bg-yellow-600 w-8 h-8">
          <Star className="w-4 h-4 text-white fill-white" />
        </Button>
      </div>
    </>
  );
}