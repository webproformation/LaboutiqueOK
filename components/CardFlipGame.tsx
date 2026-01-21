'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Gift, Frown, Sparkles, Trophy } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import confetti from 'canvas-confetti';
import Link from 'next/link';

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

    // Appel API pour déterminer le résultat
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

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
        <Card className="w-full max-w-lg p-8 bg-black border-2 border-[#D4AF37]">
          <div className="text-center text-[#D4AF37] animate-pulse">Chargement du casino...</div>
        </Card>
      </div>
    );
  }

  if (!game) return null;

  const maxPlays = game.max_plays_per_user;
  const remainingPlays = Math.max(0, maxPlays - playsCount);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      {/* Conteneur Principal : Fond Noir + Bordure Dorée */}
      <Card className="w-full max-w-2xl bg-black border-4 border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.2)] overflow-hidden relative rounded-xl">
        
        {/* Bouton Fermer */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute right-2 top-2 z-20 text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-white transition-colors"
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Effets de lueur d'arrière-plan */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />

        {/* En-tête : Textes Dorés imposés */}
        <div className="text-center pt-10 pb-4 px-4 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-[#D4AF37] uppercase tracking-wider mb-2 drop-shadow-md">
            Grand jeu de Janvier !
          </h2>
          <p className="text-[#D4AF37]/90 text-lg font-medium">
            Cliquez sur la carte de votre choix et tentez de gagner <span className="text-white font-bold">90% de réduction</span> !!!
          </p>
        </div>

        {/* Bandeau : Gradient Doré */}
        <div className="bg-gradient-to-r from-[#b8933d] via-[#F2F2E8] to-[#b8933d] py-3 shadow-md relative z-10 mb-6">
          <p className="text-black font-bold text-center text-lg flex items-center justify-center gap-2 uppercase tracking-wide">
             🎴 Choisissez une carte pour tenter votre chance !
          </p>
        </div>

        <CardContent className="pb-8 px-8 relative z-10">
          
          {/* CAS 1 : Utilisateur non connecté -> Affiche le bouton doré */}
          {!user ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-6 animate-in fade-in duration-500">
               <div className="relative">
                <div className="absolute inset-0 bg-[#D4AF37] blur-lg opacity-20 rounded-full"></div>
                <Trophy className="h-16 w-16 text-[#D4AF37] relative z-10 animate-pulse" />
              </div>
              
              <Button 
                asChild 
                className="bg-gradient-to-r from-[#b8933d] to-[#D4AF37] hover:from-[#9a7a2f] hover:to-[#b8933d] text-white text-xl font-bold py-8 px-10 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)] border-2 border-[#F2F2E8]/30 transition-all hover:scale-105 duration-300 cursor-pointer"
              >
                <Link href="/auth/login" onClick={onClose}>
                  🔒 Connectez-vous pour jouer !
                </Link>
              </Button>
              <p className="text-gray-400 text-sm">Créez un compte gratuitement pour participer</p>
            </div>
          ) : (
            /* CAS 2 : Utilisateur connecté */
            <>
              {!canPlay ? (
                /* Limite atteinte */
                <div className="text-center py-8">
                  <Frown className="h-16 w-16 mx-auto text-[#D4AF37] mb-4 opacity-80" />
                  <p className="text-xl font-bold text-white mb-2">
                    Limite de parties atteinte
                  </p>
                  <p className="text-[#D4AF37]/80">
                     Vous avez joué vos {game.max_plays_per_user} parties.
                  </p>
                  <Button onClick={onClose} variant="outline" className="mt-6 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black">
                    Fermer le jeu
                  </Button>
                </div>
              ) : (
                /* Jeu actif : Grille de cartes */
                <div className="grid grid-cols-3 gap-4 md:gap-6 mb-8 perspective-container max-w-md mx-auto">
                  {cards.map((cardIndex) => (
                    <button
                      key={cardIndex}
                      onClick={() => handleCardClick(cardIndex)}
                      disabled={isPlaying || selectedCard !== null}
                      className={`relative aspect-[2/3] rounded-xl transition-all duration-300 ${
                        selectedCard === cardIndex
                          ? 'scale-110 z-20 shadow-[0_0_30px_#D4AF37]'
                          : 'hover:scale-105 hover:shadow-[0_0_15px_#D4AF37]'
                      } ${isPlaying || selectedCard !== null ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div
                        className={`relative w-full h-full preserve-3d transition-transform duration-700 ${
                          flippedCard === cardIndex ? '[transform:rotateY(180deg)]' : ''
                        }`}
                      >
                        {/* Face avant (Dos de la carte) - Gradient Or */}
                        <div className="absolute w-full h-full bg-gradient-to-br from-[#b8933d] via-[#d4af37] to-[#b8933d] rounded-xl flex items-center justify-center shadow-xl backface-hidden border-2 border-[#F2F2E8]/40">
                          <div className="text-center">
                            <div className="text-white text-5xl font-bold opacity-90 drop-shadow-lg">?</div>
                          </div>
                        </div>

                        {/* Face arrière (Résultat) */}
                        <div
                          className={`absolute w-full h-full rounded-xl flex items-center justify-center shadow-xl backface-hidden border-2 border-white [transform:rotateY(180deg)] ${
                            hasWon && selectedCard === cardIndex
                              ? 'bg-gradient-to-br from-green-600 to-green-800'
                              : selectedCard === cardIndex
                              ? 'bg-gradient-to-br from-red-600 to-red-800'
                              : 'bg-gray-800'
                          }`}
                        >
                          {hasWon && selectedCard === cardIndex ? (
                            <div className="text-center animate-bounce">
                              <Gift className="h-10 w-10 text-white mx-auto mb-1" />
                              <div className="text-white text-lg font-bold">GAGNÉ !</div>
                            </div>
                          ) : selectedCard === cardIndex ? (
                            <div className="text-center">
                              <Frown className="h-10 w-10 text-white mx-auto mb-1" />
                              <div className="text-white text-base font-bold">PERDU</div>
                            </div>
                          ) : (
                            <div className="text-white text-4xl">?</div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Compteur de parties - Style demandé */}
              <div className="text-center mt-2">
                <div className="inline-block bg-neutral-900/80 border border-[#D4AF37]/30 px-6 py-2 rounded-full backdrop-blur-sm">
                  <p className="text-white font-mono text-lg">
                    Parties restantes : <span className="text-[#D4AF37] font-bold text-xl">{remainingPlays}</span> <span className="text-gray-500">/</span> {maxPlays}
                  </p>
                </div>
              </div>
            </>
          )}

        </CardContent>
      </Card>
    </div>
  );
}