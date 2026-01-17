'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Trophy, Frown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Fireworks } from '@/components/Fireworks';

interface WheelGameProps {
  game: {
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
  };
  onClose: () => void;
  onWin: (couponCode: string) => void;
}

export function WheelGame({ game, onClose, onWin }: WheelGameProps) {
  const { user } = useAuth();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [prize, setPrize] = useState<string | null>(null);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [remainingPlays, setRemainingPlays] = useState(game.max_plays_per_user);
  const [showFireworks, setShowFireworks] = useState(false);
  const [hasLost, setHasLost] = useState(false);
  const [hasSecondChance, setHasSecondChance] = useState(false);

  const segmentAngle = 360 / game.segments.length;

  useEffect(() => {
    checkUserPlays();
  }, []);

  const checkUserPlays = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('game_plays')
        .select('*')
        .eq('user_id', user.id)
        .eq('game_type', 'wheel')
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

    for (let i = 0; i < game.segments.length; i++) {
      cumulative += game.segments[i].probability;
      if (random <= cumulative) {
        return { index: i, segment: game.segments[i] };
      }
    }

    return { index: 0, segment: game.segments[0] };
  };

  const tryAgain = () => {
    setPrize(null);
    setHasLost(false);
    setHasSecondChance(false);
    setRotation(0);
  };

  const spin = async () => {
    if (spinning || hasPlayed || remainingPlays === 0) return;

    setSpinning(true);

    const { index, segment } = selectPrize();

    const targetAngle = index * segmentAngle;
    const spins = 5 + Math.random() * 3;
    const totalRotation = spins * 360 + (360 - targetAngle) + segmentAngle / 2;

    setRotation(rotation + totalRotation);

    setTimeout(async () => {
      setSpinning(false);
      setPrize(segment.coupon_code);

      const isLosingSegment = segment.label?.toLowerCase().includes('perdu') ||
                              segment.coupon_code?.toLowerCase().includes('perdu');

      if (isLosingSegment) {
        setHasLost(true);
        if (remainingPlays > 1 && !hasSecondChance) {
          setHasSecondChance(true);
        }
      } else {
        setShowFireworks(true);
        setTimeout(() => setShowFireworks(false), 3000);
      }

      if (user) {
        try {
          await supabase
            .from('game_plays')
            .insert([{
              user_id: user.id,
              game_type: 'wheel',
              game_id: game.id,
              prize_won: segment.coupon_code,
              coupon_id: segment.coupon_id,
            }]);

          if (!isLosingSegment && segment.coupon_code) {
            // Trouver le coupon correspondant au code
            const { data: coupon } = await supabase
              .from('coupons')
              .select('id')
              .eq('code', segment.coupon_code)
              .maybeSingle();

            if (coupon) {
              const { data: existingCoupon } = await supabase
                .from('user_coupons')
                .select('id')
                .eq('user_id', user.id)
                .eq('code', segment.coupon_code)
                .maybeSingle();

              if (!existingCoupon) {
                const validUntil = new Date();
                validUntil.setDate(validUntil.getDate() + 30);

                await supabase.from('user_coupons').insert({
                  user_id: user.id,
                  coupon_id: coupon.id,
                  code: segment.coupon_code,
                  source: 'wheel_game',
                  is_used: false,
                  valid_until: validUntil.toISOString(),
                });

                toast.success(`Coupon ${segment.coupon_code} ajouté à votre compte!`);
              }
            } else {
              console.error('Coupon type not found for code:', segment.coupon_code);
            }

            onWin(segment.coupon_code);
          }
          setRemainingPlays(prev => prev - 1);
        } catch (error) {
          console.error('Error saving game play:', error);
        }
      }
    }, 5000);
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
              <Trophy className="h-16 w-16 text-[#d4af37]" />
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

            <div className="relative mx-auto w-full max-w-sm aspect-square">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 z-20">
                <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-[#d4af37]" />
              </div>

              <div
                className="relative w-full h-full rounded-full overflow-hidden border-8 border-[#d4af37] shadow-2xl"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                  backgroundColor: game.wheel_design.backgroundColor,
                }}
              >
                {game.segments.map((segment, index) => {
                  const angle = segmentAngle;
                  const rotation = index * angle;

                  return (
                    <div
                      key={index}
                      className="absolute inset-0 origin-center"
                      style={{
                        transform: `rotate(${rotation}deg)`,
                        clipPath: `polygon(50% 50%, 50% 0%, ${50 + Math.tan((angle / 2) * Math.PI / 180) * 50}% 0%)`,
                      }}
                    >
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `conic-gradient(from ${rotation}deg, ${segment.color} 0deg, ${segment.color} ${angle}deg, transparent ${angle}deg)`,
                        }}
                      />
                      <div
                        className="absolute top-[20%] left-1/2 -translate-x-1/2 text-center max-w-[80px]"
                        style={{
                          transform: `rotate(${angle / 2}deg)`,
                        }}
                      >
                        <p className="text-white font-bold text-xs drop-shadow-lg leading-tight break-words">
                          {segment.label || segment.coupon_code}
                        </p>
                      </div>
                    </div>
                  );
                })}

                <div className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8933d] border-4 border-white shadow-xl flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>

            {prize && !spinning && hasLost && (
              <div className="animate-bounce-in space-y-3 p-4 bg-gradient-to-br from-red-900/20 to-transparent rounded-xl border border-red-500">
                <Frown className="h-12 w-12 text-red-500 mx-auto" />
                <div className="text-white">
                  <h3 className="text-xl font-bold mb-2">Dommage...</h3>
                  <p className="text-base mb-2">Vous avez perdu cette fois</p>
                  <div className="bg-white/10 rounded-lg p-3 border-2 border-red-500">
                    <p className="text-lg font-bold text-red-400">{prize}</p>
                  </div>
                  {hasSecondChance && (
                    <p className="text-sm text-white/70 mt-3">
                      Mais vous avez encore une chance !
                    </p>
                  )}
                </div>
              </div>
            )}

            {prize && !spinning && !hasLost && (
              <div className="animate-bounce-in space-y-3 p-4 bg-gradient-to-br from-[#d4af37]/20 to-transparent rounded-xl border border-[#d4af37]">
                <Trophy className="h-12 w-12 text-[#d4af37] mx-auto animate-pulse" />
                <div className="text-white">
                  <h3 className="text-xl font-bold mb-2">Félicitations!</h3>
                  <p className="text-base mb-2">Vous avez gagné :</p>
                  <div className="bg-white/10 rounded-lg p-3 border-2 border-[#d4af37]">
                    <p className="text-lg font-bold text-[#d4af37]">{prize}</p>
                  </div>
                  <p className="text-sm text-white/70 mt-3">
                    Le code promo a été ajouté à votre compte
                  </p>
                </div>
              </div>
            )}

            {!prize && (
              <Button
                onClick={spin}
                disabled={spinning || hasPlayed || remainingPlays === 0}
                className="w-full bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d] text-white font-bold text-lg py-6 disabled:opacity-50"
              >
                {spinning ? (
                  <>
                    <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                    La roue tourne...
                  </>
                ) : (
                  <>
                    <Trophy className="h-5 w-5 mr-2" />
                    Faire tourner la roue
                  </>
                )}
              </Button>
            )}

            {prize && !spinning && hasLost && hasSecondChance && (
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

            {prize && !spinning && (!hasLost || !hasSecondChance) && (
              <Button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d] text-white font-semibold py-3"
              >
                Fermer
              </Button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(-50px);
          }
          50% {
            transform: scale(1.05) translateY(10px);
          }
          70% {
            transform: scale(0.9) translateY(-5px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out;
        }
      `}</style>
    </>
  );
}
