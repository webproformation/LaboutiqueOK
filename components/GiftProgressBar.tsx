"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Gift, Sparkles } from 'lucide-react';

interface GiftProgressBarProps {
  cartTotal: number;
  deliveryBatchId?: string | null;
}

export function GiftProgressBar({ cartTotal, deliveryBatchId }: GiftProgressBarProps) {
  const giftThresholds = [
    { amount: 50, gift: 'Un échantillon surprise' },
    { amount: 100, gift: 'Un produit cadeau premium' },
    { amount: 150, gift: 'Un coffret exclusif' },
  ];

  const currentThresholdIndex = giftThresholds.findIndex(t => cartTotal < t.amount);
  const currentThreshold = currentThresholdIndex >= 0 ? giftThresholds[currentThresholdIndex] : null;
  const previousThreshold = currentThresholdIndex > 0 ? giftThresholds[currentThresholdIndex - 1] : { amount: 0 };

  if (!currentThreshold) {
    return (
      <Card className="border-[#b8933d] bg-gradient-to-r from-[#b8933d]/10 to-[#d4a853]/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-[#b8933d]">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[#b8933d]">
                Félicitations ! Vous avez débloqué tous les cadeaux ! 🎉
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const remaining = currentThreshold.amount - cartTotal;
  const progress = ((cartTotal - previousThreshold.amount) / (currentThreshold.amount - previousThreshold.amount)) * 100;

  return (
    <Card className="border-[#b8933d] bg-gradient-to-r from-[#b8933d]/5 to-transparent">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-[#b8933d]" />
              <p className="font-semibold text-gray-900">Prochain cadeau</p>
            </div>
            <p className="text-sm font-medium text-gray-600">
              {cartTotal.toFixed(2)} € / {currentThreshold.amount} €
            </p>
          </div>

          <Progress value={progress} className="h-2" />

          <p className="text-sm text-gray-700">
            Plus que <span className="font-bold text-[#b8933d]">{remaining.toFixed(2)} €</span> pour débloquer :{' '}
            <span className="font-semibold">{currentThreshold.gift}</span> 🎁
          </p>

          {deliveryBatchId && (
            <p className="text-xs text-gray-500 italic">
              Ce cadeau sera ajouté à votre colis ouvert lors de la validation
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
