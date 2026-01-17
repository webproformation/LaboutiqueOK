'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Gift, Frown, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import confetti from 'canvas-confetti';

interface CardFlipGameProps {
  gameId: string;
  onClose: () => void;
}

interface GameData {
  id: string;
  name: string;
  description: string;
  coupon_id: string;
  max_plays_per_user: number;
  win_probability: number;
}

interface CouponData {
  id: string;
  code: string;
  name: string;
  discount_type: string;
  discount_value: number;
}

export function CardFlipGame({ gameId, onClose }: CardFlipGameProps) {
  const { user } = useAuth();
  const [game, setGame] = useState<GameData | null>(null);
  const [coupon, setCoupon] = useState<CouponData | null>(null);
  const [cards] = useState<number[]>([0, 1, 2]);
  const [flippedCard, setFlippedCard] = useState<number | null>(null);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [hasWon, setHasWon] = useState<boolean | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [canPlay, setCanPlay] = useState(true);
  const [playsCount, setPlaysCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGameData();
    checkUserPlays();
  }, [gameId, user]);

  const loadGameData = async () => {
    const supabase = createClient();

    const { data: gameData, error: gameError } = await supabase
      .from('card_flip_games')
      .select('*')
      .eq('id', gameId)
      .maybeSingle();

    if (gameError || !gameData) {
      toast.error('Impossible de charger le jeu');
      onClose();
      return;
    }

    setGame(gameData);

    if (gameData.coupon_id) {
      const { data: couponData } = await supabase
        .from('coupons')
        .select('id, code, name, discount_type, discount_value')
        .eq('id', gameData.coupon_id)
        .maybeSingle();

      if (couponData) {
        setCoupon(couponData);
      }
    }

    setLoading(false);
  };

  const checkUserPlays = async () => {
    if (!user) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from('card_flip_game_plays')
      .select('*')
      .eq('game_id', gameId)
      .eq('user_id', user.id);

    if (!error && data) {
      setPlaysCount(data.length);
      if (game && data.length >= game.max_plays_per_user) {
        setCanPlay(false);
      }
    }
  };

  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 10000,
    };

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ['#D4AF37', '#FFD700', '#FFA500'],
    });

    fire(0.2, {
      spread: 60,
      colors: ['#D4AF37', '#FFD700', '#FFA500'],
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
      colors: ['#D4AF37', '#FFD700', '#FFA500'],
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
      colors: ['#D4AF37', '#FFD700', '#FFA500'],
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
      colors: ['#D4AF37', '#FFD700', '#FFA500'],
    });
  };

  const handleCardClick = async (cardIndex: number) => {
    if (!user) {
      toast.error('Vous devez être connecté pour jouer');
      return;
    }

    if (isPlaying || selectedCard !== null || !canPlay) return;

    setIsPlaying(true);
    setSelectedCard(cardIndex);

    // Animation de retournement
    setTimeout(() => {
      setFlippedCard(cardIndex);
    }, 300);

    // Appel API pour déterminer le résultat (tirage au sort côté serveur)
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch('/api/games/claim-reward', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          game_type: 'card_flip',
          game_id: gameId,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const won = result.has_won;
        setHasWon(won);

        setTimeout(() => {
          if (won) {
            triggerConfetti();

            if (result.already_owned) {
              toast.success('Gagné ! Vous possédez déjà ce coupon.', {
                duration: 5000,
              });
            } else {
              const couponValue = result.coupon?.discount_type === 'percentage'
                ? `-${result.coupon.discount_value}%`
                : `-${Number(result.coupon?.discount_value || 0).toFixed(2)}€`;

              toast.success(
                `🎉 Félicitations ! Vous avez gagné ${couponValue} !`,
                { duration: 6000 }
              );
            }
          } else {
            toast.error('Dommage ! Vous avez perdu cette fois-ci.', {
              description: 'Retentez votre chance si vous avez des parties restantes !',
              duration: 4000,
            });
          }
        }, 1000);
      } else {
        if (result.max_reached) {
          setCanPlay(false);
          toast.warning('Nombre maximum de parties atteint');
        } else {
          toast.error(result.error || 'Erreur lors du jeu');
        }
        setIsPlaying(false);
        setSelectedCard(null);
        setFlippedCard(null);
      }

      checkUserPlays();
    } catch (error) {
      console.error('Error playing game:', error);
      toast.error('Erreur lors du jeu');
      setIsPlaying(false);
      setSelectedCard(null);
      setFlippedCard(null);
    }
  };

  const getCouponText = () => {
    if (!coupon) return '';
    if (coupon.discount_type === 'percentage') {
      return `-${coupon.discount_value}%`;
    }
    return `-${(Number(coupon.discount_value) || 0).toFixed(2)}€`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
        <Card className="w-full max-w-lg p-8">
          <div className="text-center">Chargement...</div>
        </Card>
      </div>
    );
  }

  if (!game) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute right-2 top-2 z-10"
        >
          <X className="h-4 w-4" />
        </Button>

        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-6 w-6 text-[#D4AF37]" />
              <h2 className="text-2xl font-bold text-gray-900">{game.name}</h2>
              <Sparkles className="h-6 w-6 text-[#D4AF37]" />
            </div>
            {game.description && (
              <p className="text-gray-600 mb-4">{game.description}</p>
            )}
            {coupon && (
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#b8933d] to-[#d4af37] text-white px-6 py-3 rounded-full shadow-lg">
                <Gift className="h-5 w-5" />
                <span className="font-bold text-lg">À gagner : {getCouponText()}</span>
              </div>
            )}
            {game.win_probability && (
              <p className="text-sm text-gray-500 mt-3">
                Probabilité de gain : {game.win_probability}%
              </p>
            )}
          </div>

          {!canPlay ? (
            <div className="text-center py-8">
              <Frown className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-semibold text-gray-700">
                Vous avez déjà joué le maximum de fois
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {playsCount} / {game.max_plays_per_user} parties jouées
              </p>
              <Button onClick={onClose} className="mt-4 bg-[#D4AF37] hover:bg-[#B8933D]">
                Fermer
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                {selectedCard === null ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 font-medium">
                      🎴 Choisissez une carte pour tenter votre chance !
                    </p>
                  </div>
                ) : (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-purple-800 font-medium">
                      ✨ Découvrez votre résultat...
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-6 mb-6 perspective-container">
                {cards.map((cardIndex) => (
                  <button
                    key={cardIndex}
                    onClick={() => handleCardClick(cardIndex)}
                    disabled={isPlaying || selectedCard !== null || !user}
                    className={`relative aspect-[2/3] rounded-2xl transition-all duration-300 ${
                      selectedCard === cardIndex
                        ? 'scale-110 shadow-2xl'
                        : 'hover:scale-105 hover:shadow-xl'
                    } ${isPlaying || selectedCard !== null ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div
                      className={`relative w-full h-full preserve-3d transition-transform duration-700 ${
                        flippedCard === cardIndex ? '[transform:rotateY(180deg)]' : ''
                      }`}
                    >
                      {/* Face avant */}
                      <div className="absolute w-full h-full bg-gradient-to-br from-[#b8933d] via-[#d4af37] to-[#b8933d] rounded-2xl flex items-center justify-center shadow-xl backface-hidden border-4 border-white">
                        <div className="text-center">
                          <div className="text-white text-6xl font-bold mb-2">?</div>
                          <div className="text-white text-xs font-semibold opacity-80">
                            Carte {cardIndex + 1}
                          </div>
                        </div>
                      </div>

                      {/* Face arrière */}
                      <div
                        className={`absolute w-full h-full rounded-2xl flex items-center justify-center shadow-xl backface-hidden border-4 border-white [transform:rotateY(180deg)] ${
                          hasWon && selectedCard === cardIndex
                            ? 'bg-gradient-to-br from-green-400 via-green-500 to-green-600'
                            : selectedCard === cardIndex
                            ? 'bg-gradient-to-br from-red-400 via-red-500 to-red-600'
                            : 'bg-gradient-to-br from-gray-300 to-gray-400'
                        }`}
                      >
                        {hasWon && selectedCard === cardIndex ? (
                          <div className="text-center animate-bounce">
                            <Gift className="h-16 w-16 text-white mx-auto mb-2" />
                            <div className="text-white text-2xl font-bold">GAGNÉ !</div>
                          </div>
                        ) : selectedCard === cardIndex ? (
                          <div className="text-center">
                            <Frown className="h-16 w-16 text-white mx-auto mb-2" />
                            <div className="text-white text-xl font-bold">PERDU</div>
                          </div>
                        ) : (
                          <div className="text-white text-5xl">?</div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {!user && (
                <div className="text-center mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-orange-800 font-medium">
                    🔒 Connectez-vous pour jouer !
                  </p>
                </div>
              )}

              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 font-medium">
                  Parties restantes : <span className="text-[#D4AF37] font-bold">{game.max_plays_per_user - playsCount}</span> / {game.max_plays_per_user}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
