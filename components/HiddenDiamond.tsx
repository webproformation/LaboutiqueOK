'use client';

import { useState, useEffect } from 'react';
import { Gem, Sparkles, PartyPopper } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/context/AuthContext';

interface HiddenDiamondProps {
  diamondId: string;
  pageUrl?: string;
  inline?: boolean;
}

export default function HiddenDiamond({ diamondId, pageUrl, inline = false }: HiddenDiamondProps) {
  const { user } = useAuth();
  const [isFound, setIsFound] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [reward, setReward] = useState(0);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    checkDiamondStatus();
  }, [diamondId, user]);

  const checkDiamondStatus = async () => {
    if (!user) {
      setIsVisible(true);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('diamond_finds')
        .select('id')
        .eq('user_id', user.id)
        .eq('diamond_id', diamondId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setIsFound(true);
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    } catch (error) {
      console.error('Error checking diamond status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = async () => {
    if (!user) {
      alert('Connecte-toi pour gagner des récompenses !');
      return;
    }

    if (isFound || isAnimating) return;

    setIsAnimating(true);

    try {
      const { data, error } = await supabase.rpc('award_diamond_find_bonus', {
        p_user_id: user.id,
        p_diamond_id: diamondId
      });

      if (error) throw error;

      if (data.success) {
        setReward(data.amount);
        setLoyaltyPoints(data.loyalty_points || 0);
        setMessage(data.message);
        setIsFound(true);
        setIsVisible(false);

        fireConfetti();

        setTimeout(() => {
          setShowDialog(true);
        }, 500);
      }
    } catch (error) {
      console.error('Error claiming diamond:', error);
      setIsAnimating(false);
    }
  };

  const fireConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
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
  };

  if (isLoading || !isVisible || isFound) return null;

  return (
    <>
      <button
        onClick={handleClick}
        className={`${inline ? 'relative inline-flex items-center justify-center' : 'absolute top-2 right-2'} z-30 cursor-pointer hover:scale-125 transition-all duration-300 ${
          isAnimating ? 'scale-150 opacity-0' : 'animate-pulse'
        }`}
        aria-label="Diamant caché"
        style={{
          filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))',
        }}
      >
        <Gem className="w-6 h-6 text-blue-500" fill="currentColor" />
        <Sparkles className="w-3 h-3 text-yellow-400 absolute -top-1 -right-1 animate-spin" />
      </button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
              <PartyPopper className="h-8 w-8 text-yellow-500" />
              FÉLICITATIONS !
              <PartyPopper className="h-8 w-8 text-yellow-500" />
            </DialogTitle>
            <DialogDescription className="text-center text-lg mt-2">
              Vous avez trouvé un diamant caché !
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8 space-y-6">
            <div className="relative inline-block">
              <Gem className="w-24 h-24 mx-auto text-blue-500 animate-bounce" fill="currentColor" />
              <div className="absolute inset-0 animate-ping">
                <Gem className="w-24 h-24 text-blue-400 opacity-75" fill="currentColor" />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-lg font-semibold text-gray-700">{message}</p>

              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg p-4 space-y-2">
                <p className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  +{reward} €
                </p>
                <p className="text-sm text-gray-600">Ajoutés à votre cagnotte !</p>
              </div>

              {loyaltyPoints > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg p-3">
                  <p className="text-2xl font-bold text-purple-600">
                    +{loyaltyPoints} points
                  </p>
                  <p className="text-xs text-gray-600">Points de fidélité</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <span>Continuez à explorer pour trouver plus de diamants !</span>
              <Sparkles className="h-4 w-4 text-yellow-500" />
            </div>
          </div>
          <Button
            onClick={() => setShowDialog(false)}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg py-6"
          >
            <PartyPopper className="mr-2 h-5 w-5" />
            Super ! Merci !
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}