"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Sparkles, Trophy, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase-client';
import confetti from 'canvas-confetti';

interface Prize {
  id: string;
  code: string;
  type: string;
  value: number;
  description: string;
  valid_until: string;
}

interface ScratchCard {
  id: number;
  isRevealed: boolean;
  isWinner: boolean;
  prize?: Prize;
}

export default function ScratchCardGame({
  onClose,
  winProbability = 30
}: {
  onClose: () => void;
  winProbability?: number;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [cards, setCards] = useState<ScratchCard[]>([
    { id: 1, isRevealed: false, isWinner: false },
    { id: 2, isRevealed: false, isWinner: false },
    { id: 3, isRevealed: false, isWinner: false },
  ]);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [gameResult, setGameResult] = useState<'win' | 'lose' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [winningPrize, setWinningPrize] = useState<Prize | null>(null);
  const [isSecondChance, setIsSecondChance] = useState(false);
  const [showSecondChanceScreen, setShowSecondChanceScreen] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    let storedSessionId = localStorage.getItem('scratch_game_session_id');
    if (!storedSessionId) {
      storedSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('scratch_game_session_id', storedSessionId);
    }
    setSessionId(storedSessionId);
  }, []);

  useEffect(() => {
    if (showSecondChanceScreen) {
      confetti({
        particleCount: 200,
        spread: 160,
        origin: { y: 0.5 },
        colors: ['#b8933d', '#d4af37', '#c9a961', '#8b7355', '#bfa568']
      });

      const interval = setInterval(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 250);

      setTimeout(() => clearInterval(interval), 3000);
    }
  }, [showSecondChanceScreen]);

  const getRandomPrize = async (): Promise<Prize | null> => {
    const { data: prizes, error } = await supabase
      .from('coupon_types')
      .select('*')
      .eq('is_active', true);

    if (!prizes || prizes.length === 0) return null;

    const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];
    return randomPrize as Prize;
  };

  const resetGame = () => {
    setCards([
      { id: 1, isRevealed: false, isWinner: false },
      { id: 2, isRevealed: false, isWinner: false },
      { id: 3, isRevealed: false, isWinner: false },
    ]);
    setSelectedCard(null);
    setGameResult(null);
    setIsLoading(false);
    setWinningPrize(null);
    setShowSecondChanceScreen(false);
  };

  const handleSecondChance = () => {
    setIsSecondChance(true);
    resetGame();
  };

  const handleCardClick = async (cardId: number) => {
    if (selectedCard !== null || isLoading) return;

    setIsLoading(true);
    setSelectedCard(cardId);

    const isWinner = Math.random() * 100 < winProbability;
    const prize = isWinner ? await getRandomPrize() : null;
    const actualWinner = isWinner && prize !== null;

    setTimeout(async () => {
      const updatedCards = cards.map(card => ({
        ...card,
        isRevealed: true,
        isWinner: card.id === cardId && actualWinner,
        prize: card.id === cardId && actualWinner ? (prize || undefined) : undefined,
      }));

      setCards(updatedCards);
      setGameResult(actualWinner ? 'win' : 'lose');

      if (user) {
        await supabase.from('scratch_game_plays').insert({
          user_id: user.id,
          result: actualWinner ? 'win' : 'lose',
        });

        if (actualWinner && prize) {
          setWinningPrize(prize);

          const uniqueCode = `${prize.code}-${user.id.substring(0, 8)}-${Date.now()}`;

          await supabase
            .from('user_coupons')
            .insert({
              user_id: user.id,
              coupon_type_id: prize.id,
              code: uniqueCode,
              source: 'scratch_game',
              valid_until: prize.valid_until || '2026-02-01 23:59:59+00',
            });

          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      } else {
        await supabase.from('pending_prizes').insert({
          session_id: sessionId,
          prize_type_id: prize?.id || null,
          result: actualWinner ? 'win' : 'lose',
        });

        if (actualWinner && prize) {
          setWinningPrize(prize);
          localStorage.setItem('pending_prize', JSON.stringify({
            prize,
            sessionId
          }));

          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }

      if (!actualWinner && !isSecondChance) {
        setTimeout(() => {
          setShowSecondChanceScreen(true);
        }, 2000);
      }

      setIsLoading(false);
    }, 1000);
  };


  if (showSecondChanceScreen) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl p-6 md:p-12 relative bg-gradient-to-br from-white via-amber-50 to-stone-100 border-2 border-[#b8933d]/30">
          <div className="text-center">
            <Sparkles className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 text-[#b8933d] animate-pulse" />
            <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-[#b8933d] via-[#d4af37] to-[#c9a961] bg-clip-text text-transparent mb-3 md:mb-4">
              2ème CHANCE !
            </h2>
            <p className="text-lg md:text-2xl text-gray-800 mb-4 md:mb-6">Vous avez droit à une nouvelle tentative !</p>
            <p className="text-base md:text-lg text-gray-700 mb-6 md:mb-8">La chance va tourner, retentez votre chance maintenant !</p>
            <Button
              onClick={handleSecondChance}
              size="lg"
              className="text-base md:text-xl px-8 md:px-12 py-4 md:py-6 bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#a07c2f] hover:to-[#b8933d]"
            >
              <Sparkles className="mr-2 w-5 h-5" />
              Jouer ma 2ème chance !
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 md:p-4 overflow-y-auto">
      <Card className="w-full max-w-4xl p-4 md:p-8 relative bg-gradient-to-br from-white via-amber-50 to-stone-100 my-auto border-2 border-[#b8933d]/20">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 md:top-4 md:right-4 text-gray-600 hover:text-black z-10"
        >
          <X className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        <div className="text-center mb-4 md:mb-8">
          <div className="flex items-center justify-center mb-3 md:mb-4">
            <Sparkles className="w-8 h-8 md:w-12 md:h-12 text-[#b8933d] animate-pulse" />
            <Gift className="w-10 h-10 md:w-16 md:h-16 text-[#b8933d] mx-2 md:mx-4" />
            <Sparkles className="w-8 h-8 md:w-12 md:h-12 text-[#b8933d] animate-pulse" />
          </div>
          <h2 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-[#b8933d] via-[#d4af37] to-[#c9a961] bg-clip-text text-transparent mb-1 md:mb-2">
            Jeu Concours
          </h2>
          <p className="text-sm md:text-lg text-gray-800">Choisissez une carte et tentez de gagner !</p>
          {gameResult === null && (
            <p className="text-xs md:text-sm text-gray-600 mt-1 md:mt-2">Bonne chance !</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 md:gap-6 mb-4 md:mb-8 max-w-2xl mx-auto">
          {cards.map((card) => (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`relative aspect-[2/3] cursor-pointer transform transition-all duration-500 ${
                selectedCard === card.id ? 'scale-105' : ''
              } ${selectedCard !== null && selectedCard !== card.id ? 'scale-95 opacity-50' : ''} ${
                card.isRevealed ? 'animate-flip' : 'hover:scale-105 active:scale-95'
              }`}
              style={{
                transformStyle: 'preserve-3d',
              }}
            >
              {!card.isRevealed ? (
                <div className="absolute inset-0 bg-gradient-to-br from-[#b8933d] via-[#d4af37] to-[#c9a961] rounded-lg md:rounded-2xl shadow-xl md:shadow-2xl flex items-center justify-center border-2 md:border-4 border-white">
                  <div className="text-center text-white">
                    <Gift className="w-8 h-8 md:w-16 md:h-16 mx-auto mb-2 md:mb-4 animate-bounce" />
                    <p className="text-xl md:text-2xl font-bold">?</p>
                  </div>
                </div>
              ) : (
                <div
                  className={`absolute inset-0 rounded-lg md:rounded-2xl shadow-xl md:shadow-2xl flex items-center justify-center border-2 md:border-4 p-2 md:p-6 ${
                    card.isWinner
                      ? 'bg-gradient-to-br from-[#d4af37] via-[#f4d03f] to-[#c9a961] border-[#b8933d]'
                      : 'bg-gradient-to-br from-stone-400 to-stone-500 border-stone-300'
                  }`}
                >
                  <div className="text-center text-white">
                    {card.isWinner && card.prize ? (
                      <>
                        <Trophy className="w-8 h-8 md:w-16 md:h-16 mx-auto mb-2 md:mb-4 animate-bounce" />
                        <p className="text-sm md:text-xl font-bold mb-1 md:mb-2">Gagné !</p>
                        <p className="text-xs md:text-lg leading-tight">{card.prize.description}</p>
                        {card.prize.type === 'discount_amount' && (
                          <p className="text-lg md:text-3xl font-bold mt-1 md:mt-2">{card.prize.value}€</p>
                        )}
                      </>
                    ) : (
                      <>
                        <X className="w-8 h-8 md:w-16 md:h-16 mx-auto mb-2 md:mb-4" />
                        <p className="text-sm md:text-xl font-bold">Perdu</p>
                        <p className="text-xs md:text-sm mt-1 md:mt-2 px-1">Retentez votre chance</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {gameResult && (
          <div className="text-center space-y-3 md:space-y-4">
            {gameResult === 'win' && winningPrize && !user && (
              <div className="bg-amber-50 border-2 border-[#b8933d] rounded-lg p-4 md:p-6">
                <h3 className="text-xl md:text-2xl font-bold text-[#8b7355] mb-2">Félicitations !</h3>
                <p className="text-sm md:text-base text-gray-800 mb-2">
                  Vous avez gagné : <span className="font-bold text-[#b8933d]">{winningPrize.description}</span>
                </p>
                <p className="text-xs md:text-sm text-gray-700 mb-3 md:mb-4">
                  Connectez-vous ou créez un compte pour récupérer votre gain
                </p>
                <div className="flex flex-col sm:flex-row gap-2 md:gap-3 justify-center">
                  <Button
                    onClick={() => router.push('/auth/login?prize_pending=true')}
                    className="bg-[#b8933d] hover:bg-[#a07c2f] w-full sm:w-auto"
                  >
                    Se connecter
                  </Button>
                  <Button
                    onClick={() => router.push('/auth/register?prize_pending=true')}
                    variant="outline"
                    className="w-full sm:w-auto border-[#b8933d] text-[#b8933d] hover:bg-amber-50"
                  >
                    Créer un compte
                  </Button>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Votre gain est valable 24h
                </p>
              </div>
            )}
            {gameResult === 'win' && winningPrize && user && (
              <div className="bg-amber-50 border-2 border-[#b8933d] rounded-lg p-4 md:p-6">
                <h3 className="text-xl md:text-2xl font-bold text-[#8b7355] mb-2">Félicitations !</h3>
                <p className="text-sm md:text-base text-gray-800 mb-2">
                  Vous avez gagné : <span className="font-bold text-[#b8933d]">{winningPrize.description}</span>
                </p>
                <p className="text-xs md:text-sm text-gray-700">
                  Votre coupon est disponible dans votre compte, section "Mes Coupons"
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  Valable jusqu'au 01/02/2026 - Non cumulable avec d'autres réductions
                </p>
              </div>
            )}
            {gameResult === 'lose' && isSecondChance && (
              <div className="bg-stone-100 border-2 border-stone-400 rounded-lg p-4 md:p-6">
                <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">Dommage !</h3>
                <p className="text-sm md:text-base text-gray-700">
                  Ce n'est pas grave, d'autres opportunités vous attendent !
                </p>
              </div>
            )}
            {(gameResult === 'win' || (gameResult === 'lose' && isSecondChance)) && user && (
              <Button onClick={onClose} size="lg" className="mt-3 md:mt-4 w-full sm:w-auto bg-[#b8933d] hover:bg-[#a07c2f]">
                Fermer
              </Button>
            )}
          </div>
        )}

        <style jsx>{`
          @keyframes flip {
            0% {
              transform: rotateY(0deg);
            }
            50% {
              transform: rotateY(90deg);
            }
            100% {
              transform: rotateY(0deg);
            }
          }

          .animate-flip {
            animation: flip 0.6s ease-in-out;
          }
        `}</style>
      </Card>
    </div>
  );
}
