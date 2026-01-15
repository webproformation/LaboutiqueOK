'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Gift, Frown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Fireworks } from '@/components/Fireworks';

interface ScratchCardGameProps {
  game: {
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
  };
  onClose: () => void;
  onWin: (couponCode: string) => void;
}

export function ScratchCardGame({ game, onClose, onWin }: ScratchCardGameProps) {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [prize, setPrize] = useState<string | null>(null);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [remainingPlays, setRemainingPlays] = useState(game.max_plays_per_user);
  const [showFireworks, setShowFireworks] = useState(false);
  const [hasLost, setHasLost] = useState(false);
  const [hasSecondChance, setHasSecondChance] = useState(false);

  useEffect(() => {
    checkUserPlays();
  }, []);

  useEffect(() => {
    if (canvasRef.current && !isRevealed) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 400;
      canvas.height = 300;

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, game.card_design.scratchColor);
      gradient.addColorStop(0.5, '#f5d0a9');
      gradient.addColorStop(1, game.card_design.scratchColor);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.textAlign = 'center';
      ctx.fillText('GRATTEZ ICI', canvas.width / 2, canvas.height / 2);
    }
  }, [game, isRevealed]);

  const checkUserPlays = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('game_plays')
        .select('*')
        .eq('user_id', user.id)
        .eq('game_type', 'scratch_card')
        .eq('game_id', game.id);

      if (error) throw error;

      const plays = data?.length || 0;
      const remaining = Math.max(0, game.max_plays_per_user - plays);
      setRemainingPlays(remaining);

      if (remaining === 0) {
        setHasPlayed(true);
        toast.info('Vous avez déjà utilisé toutes vos tentatives pour ce jeu');
      }
    } catch (error) {
      console.error('Error checking plays:', error);
    }
  };

  const selectPrize = () => {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const prize of game.prizes) {
      cumulative += prize.probability;
      if (random <= cumulative) {
        return prize.coupon_code;
      }
    }

    return game.prizes[0]?.coupon_code || null;
  };

  const scratch = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || isRevealed || hasPlayed) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 40;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fill();

    checkProgress();
  };

  const checkProgress = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparent = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] < 128) {
        transparent++;
      }
    }

    const progress = (transparent / (pixels.length / 4)) * 100;

    if (progress > 50 && !isRevealed) {
      revealPrize();
    }
  };

  const tryAgain = () => {
    setPrize(null);
    setIsRevealed(false);
    setHasLost(false);
    setHasSecondChance(false);

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const canvas = canvasRef.current;
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, game.card_design.scratchColor);
        gradient.addColorStop(0.5, '#f5d0a9');
        gradient.addColorStop(1, game.card_design.scratchColor);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.textAlign = 'center';
        ctx.fillText('GRATTEZ ICI', canvas.width / 2, canvas.height / 2);
      }
    }
  };

  const revealPrize = async () => {
    const selectedPrize = selectPrize();
    setPrize(selectedPrize);
    setIsRevealed(true);

    const isLosingPrize = selectedPrize?.toLowerCase().includes('perdu');

    if (isLosingPrize) {
      setHasLost(true);
      if (remainingPlays > 1 && !hasSecondChance) {
        setHasSecondChance(true);
      }
    } else {
      setShowFireworks(true);
      setTimeout(() => setShowFireworks(false), 3000);
    }

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    if (user && selectedPrize) {
      const coupon = game.prizes.find(p => p.coupon_code === selectedPrize);
      try {
        await supabase
          .from('game_plays')
          .insert([{
            user_id: user.id,
            game_type: 'scratch_card',
            game_id: game.id,
            prize_won: selectedPrize,
            coupon_id: coupon?.coupon_id || null,
          }]);

        if (!isLosingPrize && selectedPrize) {
          // Trouver le coupon correspondant au code
          const { data: coupon } = await supabase
            .from('coupons')
            .select('id')
            .eq('code', selectedPrize)
            .maybeSingle();

          if (coupon) {
            const { data: existingCoupon } = await supabase
              .from('user_coupons')
              .select('id')
              .eq('user_id', user.id)
              .eq('code', selectedPrize)
              .maybeSingle();

            if (!existingCoupon) {
              const validUntil = new Date();
              validUntil.setDate(validUntil.getDate() + 30);

              await supabase.from('user_coupons').insert({
                user_id: user.id,
                coupon_id: coupon.id,
                code: selectedPrize,
                source: 'scratch_card_game',
                is_used: false,
                valid_until: validUntil.toISOString(),
              });

              toast.success(`Coupon ${selectedPrize} ajouté à votre compte!`);
            }

            onWin(selectedPrize);
          } else {
            console.error('Coupon type not found for code:', selectedPrize);
          }
        }
      } catch (error) {
        console.error('Error saving game play:', error);
      }
    }
  };

  if (hasPlayed && remainingPlays === 0) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <div
          className="relative bg-gradient-to-br from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] rounded-2xl p-8 max-w-md w-full border-2 border-[#d4af37] shadow-2xl"
          style={{
            boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)',
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Gift className="h-16 w-16 text-[#d4af37]" />
            </div>
            <h3 className="text-2xl font-bold text-white">Déjà joué</h3>
            <p className="text-white/80">
              Vous avez déjà utilisé toutes vos tentatives pour ce jeu.
            </p>
            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d]"
            >
              Fermer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Fireworks active={showFireworks} />
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
        <div
          className="relative bg-gradient-to-br from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] rounded-2xl p-6 max-w-2xl w-full border-2 border-[#d4af37] shadow-2xl my-4 max-h-[95vh] overflow-y-auto"
          style={{
            boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)',
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Sparkles className="h-10 w-10 text-[#d4af37] animate-pulse" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{game.name}</h2>
              <p className="text-white/70 text-sm">{game.description}</p>
              <p className="text-sm text-[#d4af37] mt-1">
                Tentatives restantes: {remainingPlays}
              </p>
            </div>

            <div className="relative">
              <div
                className="w-full aspect-[4/3] max-h-[300px] rounded-xl flex items-center justify-center text-center p-6 relative overflow-hidden"
                style={{ backgroundColor: game.card_design.backgroundColor }}
              >
                {!isRevealed ? (
                  <>
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full cursor-pointer"
                      onMouseDown={() => setIsScratching(true)}
                      onMouseUp={() => setIsScratching(false)}
                      onMouseMove={(e) => isScratching && scratch(e)}
                      onMouseLeave={() => setIsScratching(false)}
                      onTouchStart={() => setIsScratching(true)}
                      onTouchEnd={() => setIsScratching(false)}
                      onTouchMove={(e) => isScratching && scratch(e)}
                    />
                    <div className="relative z-10 pointer-events-none">
                      <p className="text-white/30 text-base font-semibold">
                        Grattez pour découvrir votre prix
                      </p>
                    </div>
                  </>
                ) : hasLost ? (
                  <div className="animate-bounce-in space-y-3">
                    <Frown className="h-16 w-16 text-red-500 mx-auto" />
                    <div className="text-white">
                      <h3 className="text-2xl font-bold mb-2">Dommage...</h3>
                      <p className="text-lg mb-2">Vous avez perdu cette fois</p>
                      <div className="bg-white/10 rounded-lg p-3 border-2 border-red-500">
                        <p className="text-xl font-bold text-red-400">{prize}</p>
                      </div>
                      {hasSecondChance && (
                        <p className="text-sm text-white/70 mt-3">
                          Mais vous avez encore une chance !
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="animate-bounce-in space-y-3">
                    <Gift className="h-16 w-16 text-[#d4af37] mx-auto animate-pulse" />
                    <div className="text-white">
                      <h3 className="text-2xl font-bold mb-2">Félicitations!</h3>
                      <p className="text-lg mb-2">Vous avez gagné :</p>
                      <div className="bg-white/10 rounded-lg p-3 border-2 border-[#d4af37]">
                        <p className="text-xl font-bold text-[#d4af37]">{prize}</p>
                      </div>
                      <p className="text-sm text-white/70 mt-3">
                        Le code promo a été ajouté à votre compte
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {isRevealed && hasLost && hasSecondChance && (
              <div className="flex gap-2">
                <Button
                  onClick={tryAgain}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold py-3"
                >
                  Tenter ma chance
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Abandonner
                </Button>
              </div>
            )}

            {isRevealed && (!hasLost || !hasSecondChance) && (
              <Button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d] text-white font-semibold py-3"
              >
                Fermer
              </Button>
            )}

            {!isRevealed && (
              <p className="text-white/50 text-xs">
                Utilisez votre souris ou votre doigt pour gratter la carte
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
