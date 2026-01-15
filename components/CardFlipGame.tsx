'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Gift, Frown } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

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
  total_winners: number;
}

interface CouponData {
  code: string;
  discount_type: string;
  discount_value: number;
}

export function CardFlipGame({ gameId, onClose }: CardFlipGameProps) {
  const { user } = useAuth();
  const [game, setGame] = useState<GameData | null>(null);
  const [coupon, setCoupon] = useState<CouponData | null>(null);
  const [cards, setCards] = useState<number[]>([0, 1, 2]);
  const [flippedCard, setFlippedCard] = useState<number | null>(null);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [winningCard, setWinningCard] = useState<number | null>(null);
  const [hasWon, setHasWon] = useState<boolean | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [canPlay, setCanPlay] = useState(true);
  const [playsCount, setPlaysCount] = useState(0);

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
        .select('code, discount_type, discount_value')
        .eq('id', gameData.coupon_id)
        .maybeSingle();

      if (couponData) {
        setCoupon(couponData);
      }
    }
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

  const handleCardClick = async (cardIndex: number) => {
    if (!user) {
      toast.error('Vous devez être connecté pour jouer');
      return;
    }

    if (isPlaying || selectedCard !== null || !canPlay) return;

    setIsPlaying(true);
    setSelectedCard(cardIndex);

    const winning = Math.floor(Math.random() * 3);
    setWinningCard(winning);

    const won = cardIndex === winning;
    setHasWon(won);

    setTimeout(async () => {
      setFlippedCard(cardIndex);

      const supabase = createClient();

      let couponCode = null;
      if (won && coupon) {
        couponCode = coupon.code;

        try {
          const { data: { session } } = await supabase.auth.getSession();

          if (!session?.access_token) {
            toast.error('Session expirée, veuillez vous reconnecter');
            return;
          }

          const response = await fetch('/api/games/claim-reward', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              game_type: 'card_flip_game',
              game_id: gameId,
              coupon_code: coupon.code,
              has_won: true,
            }),
          });

          const result = await response.json();

          if (response.ok && result.success) {
            if (result.already_owned) {
              toast.info(`Vous possédez déjà ce coupon : ${coupon.code}`);
            } else {
              toast.success(`Coupon ${coupon.code} ajouté à votre compte!`);
            }
          } else {
            console.error('Error claiming reward:', result);
            toast.error('Erreur lors de l\'attribution du coupon');
          }
        } catch (error) {
          console.error('Error claiming reward:', error);
          toast.error('Erreur lors de l\'attribution du coupon');
        }
      }

      await supabase.from('card_flip_game_plays').insert({
        game_id: gameId,
        user_id: user.id,
        has_won: won,
        coupon_code: couponCode,
      });

      if (game) {
        await supabase
          .from('card_flip_games')
          .update({ total_winners: (game.total_winners || 0) + (won ? 1 : 0) })
          .eq('id', gameId);
      }

      setTimeout(() => {
        if (won) {
          toast.success(`Félicitations ! Vous avez gagné le coupon : ${coupon?.code}`, {
            duration: 5000,
          });
        } else {
          toast.error('Dommage ! Vous avez perdu cette fois-ci.');
        }
      }, 1500);

      checkUserPlays();
    }, 600);
  };

  const getCouponText = () => {
    if (!coupon) return '';
    if (coupon.discount_type === 'percentage') {
      return `-${coupon.discount_value}%`;
    }
    return `-${(Number(coupon.discount_value) || 0).toFixed(2)}€`;
  };

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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{game.name}</h2>
            {game.description && (
              <p className="text-gray-600 mb-4">{game.description}</p>
            )}
            {coupon && (
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#b8933d] to-[#d4af37] text-white px-4 py-2 rounded-full">
                <Gift className="h-4 w-4" />
                <span className="font-semibold">À gagner : {getCouponText()}</span>
              </div>
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
              <Button onClick={onClose} className="mt-4">
                Fermer
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-4 text-sm text-gray-600">
                {selectedCard === null ? (
                  <p>Choisissez une carte !</p>
                ) : (
                  <p>Découvrez votre résultat...</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                {cards.map((cardIndex) => (
                  <button
                    key={cardIndex}
                    onClick={() => handleCardClick(cardIndex)}
                    disabled={isPlaying || selectedCard !== null || !user}
                    className={`relative aspect-[2/3] rounded-xl transition-all duration-500 transform ${
                      selectedCard === cardIndex && flippedCard === cardIndex
                        ? 'scale-105'
                        : ''
                    }`}
                    style={{ perspective: '1000px' }}
                  >
                    <div
                      className={`relative w-full h-full transition-transform duration-600 ${
                        flippedCard === cardIndex ? '[transform:rotateY(180deg)]' : ''
                      }`}
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      <div
                        className="absolute w-full h-full bg-gradient-to-br from-[#b8933d] to-[#d4af37] rounded-xl flex items-center justify-center shadow-lg"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <div className="text-white text-4xl">?</div>
                      </div>

                      <div
                        className="absolute w-full h-full rounded-xl flex items-center justify-center shadow-lg"
                        style={{
                          backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                          background:
                            hasWon && selectedCard === cardIndex
                              ? 'linear-gradient(135deg, #10b981, #059669)'
                              : 'linear-gradient(135deg, #ef4444, #dc2626)',
                        }}
                      >
                        {hasWon && selectedCard === cardIndex ? (
                          <Gift className="h-12 w-12 text-white" />
                        ) : selectedCard === cardIndex ? (
                          <Frown className="h-12 w-12 text-white" />
                        ) : (
                          <div className="text-white text-4xl">?</div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {!user && (
                <p className="text-center text-sm text-orange-600 mb-4">
                  Connectez-vous pour jouer !
                </p>
              )}

              <div className="text-center text-xs text-gray-500">
                Parties restantes : {game.max_plays_per_user - playsCount} / {game.max_plays_per_user}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
