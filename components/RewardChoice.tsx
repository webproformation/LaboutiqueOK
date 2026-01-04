"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Truck, Package } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface Reward {
  id: string;
  name: string;
  description: string;
  type: string;
  icon: any;
}

interface RewardChoiceProps {
  unlockedRewardId: string;
  onRewardSelected: (rewardType: string) => Promise<void>;
}

export default function RewardChoice({ unlockedRewardId, onRewardSelected }: RewardChoiceProps) {
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [confirming, setConfirming] = useState(false);

  const rewards: Reward[] = [
    {
      id: '1',
      name: 'Livraison Offerte',
      description: 'Profitez de la livraison gratuite sur votre prochaine commande',
      type: 'free_delivery',
      icon: Truck,
    },
    {
      id: '2',
      name: 'Produit Maison Gratuit',
      description: 'Recevez un produit maison offert avec votre commande',
      type: 'free_product',
      icon: Gift,
    },
    {
      id: '3',
      name: 'Frais de Port Offerts',
      description: 'Vos frais de port sont offerts sur la prochaine commande',
      type: 'free_delivery',
      icon: Package,
    },
  ];

  const handleCardClick = async (index: number) => {
    if (isRevealing || selectedCard !== null) return;

    setSelectedCard(index);
    setIsRevealing(true);

    setTimeout(() => {
      setSelectedReward(rewards[index]);
      setIsRevealing(false);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }, 1000);
  };

  const handleConfirm = async () => {
    if (!selectedReward) return;

    setConfirming(true);
    try {
      await onRewardSelected(selectedReward.type);
      toast.success('Félicitations ! Votre récompense a été ajoutée à vos coupons');
    } catch (error) {
      toast.error('Erreur lors de la sélection de la récompense');
    } finally {
      setConfirming(false);
    }
  };

  if (selectedReward) {
    const Icon = selectedReward.icon;
    return (
      <div className="text-center py-8">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#b8933d] flex items-center justify-center animate-bounce">
          <Icon className="h-12 w-12 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {selectedReward.name}
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {selectedReward.description}
        </p>
        <Button
          onClick={handleConfirm}
          disabled={confirming}
          size="lg"
          className="bg-[#D4AF37] hover:bg-[#b8933d] text-white"
        >
          {confirming ? 'Confirmation...' : 'Confirmer mon choix'}
        </Button>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Choisissez votre cadeau
        </h3>
        <p className="text-gray-600">
          Cliquez sur une carte pour découvrir votre récompense
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {rewards.map((reward, index) => (
          <Card
            key={reward.id}
            className={`cursor-pointer transition-all duration-300 transform hover:scale-105 ${
              selectedCard === index
                ? 'ring-4 ring-[#D4AF37] shadow-xl'
                : 'hover:shadow-lg'
            } ${selectedCard !== null && selectedCard !== index ? 'opacity-50' : ''}`}
            onClick={() => handleCardClick(index)}
          >
            <CardContent className="pt-6">
              <div className="relative h-48 flex items-center justify-center">
                {selectedCard === index && isRevealing ? (
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#D4AF37]"></div>
                ) : (
                  <div
                    className={`w-32 h-32 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#b8933d] flex items-center justify-center transition-all duration-500 ${
                      selectedCard === index ? 'scale-110' : ''
                    }`}
                  >
                    <Gift className="h-16 w-16 text-white" />
                  </div>
                )}
              </div>
              <p className="text-center text-sm font-medium text-gray-600 mt-4">
                {selectedCard === null ? 'Cliquez pour révéler' : selectedCard === index ? 'Révélation...' : '?'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
