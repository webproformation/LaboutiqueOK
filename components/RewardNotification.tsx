'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import { Gift, Sparkles, TrendingUp, Trophy, Coins } from 'lucide-react';

interface RewardNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  type: 'daily_bonus' | 'wheel_game' | 'scratch_card' | 'hidden_diamond' | 'referral' | 'birthday' | 'other';
  message?: string;
  newBalance?: number;
}

const REWARD_CONFIG = {
  daily_bonus: {
    icon: Sparkles,
    title: 'Bonus de Connexion !',
    color: 'from-blue-500 to-cyan-500',
    iconColor: 'text-blue-500'
  },
  wheel_game: {
    icon: Trophy,
    title: 'Félicitations !',
    color: 'from-purple-500 to-pink-500',
    iconColor: 'text-purple-500'
  },
  scratch_card: {
    icon: Gift,
    title: 'Vous avez gagné !',
    color: 'from-orange-500 to-red-500',
    iconColor: 'text-orange-500'
  },
  hidden_diamond: {
    icon: Sparkles,
    title: 'Diamant Trouvé !',
    color: 'from-cyan-500 to-blue-500',
    iconColor: 'text-cyan-500'
  },
  referral: {
    icon: TrendingUp,
    title: 'Bonus Parrainage !',
    color: 'from-green-500 to-emerald-500',
    iconColor: 'text-green-500'
  },
  birthday: {
    icon: Gift,
    title: 'Joyeux Anniversaire !',
    color: 'from-pink-500 to-rose-500',
    iconColor: 'text-pink-500'
  },
  other: {
    icon: Coins,
    title: 'Récompense !',
    color: 'from-amber-500 to-yellow-500',
    iconColor: 'text-amber-500'
  }
};

export default function RewardNotification({
  isOpen,
  onClose,
  amount,
  type,
  message,
  newBalance
}: RewardNotificationProps) {
  const [animateAmount, setAnimateAmount] = useState(false);
  const config = REWARD_CONFIG[type];
  const Icon = config.icon;

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setAnimateAmount(true), 300);

      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      return () => clearInterval(interval);
    } else {
      setAnimateAmount(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md overflow-hidden border-0 p-0">
        <div className={`relative bg-gradient-to-br ${config.color} p-8 text-white`}>
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>

          <div className="relative z-10 flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-white/30 rounded-full blur-xl animate-pulse"></div>
              <div className="relative bg-white/20 backdrop-blur-sm rounded-full p-6 border-4 border-white/40">
                <Icon className="h-16 w-16 text-white animate-bounce" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight drop-shadow-lg">
                {config.title}
              </h2>
              {message && (
                <p className="text-lg text-white/90 font-medium">
                  {message}
                </p>
              )}
            </div>

            <div className={`transform transition-all duration-700 ${
              animateAmount ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
            }`}>
              <div className="bg-white/20 backdrop-blur-md rounded-2xl px-8 py-6 border-2 border-white/40 shadow-2xl">
                <div className="flex items-center justify-center gap-3">
                  <Coins className="h-10 w-10 text-yellow-300 animate-pulse" />
                  <span className="text-6xl font-bold text-white drop-shadow-lg">
                    +{amount.toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>

            {newBalance !== undefined && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3 border border-white/30">
                <p className="text-sm text-white/80">Nouveau solde de votre cagnotte</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {newBalance.toFixed(2)} €
                </p>
              </div>
            )}

            <Button
              onClick={onClose}
              size="lg"
              className="bg-white text-gray-900 hover:bg-white/90 font-semibold px-8 shadow-lg transform hover:scale-105 transition-transform"
            >
              Super !
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
