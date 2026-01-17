"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Gift, Sparkles } from 'lucide-react';

interface GiftProgressBarProps {
  cartTotal: number;
  deliveryBatchId?: string | null;
}

export function GiftProgressBar({ cartTotal, deliveryBatchId }: GiftProgressBarProps) {
  const GIFT_THRESHOLD = 69;
  const GIFT_NAME = 'Cadeau Surprise de Morgane';

  if (cartTotal >= GIFT_THRESHOLD) {
    return (
      <Card className="border-[#b8933d] bg-gradient-to-r from-[#b8933d]/10 to-[#d4a853]/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-[#b8933d]">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[#b8933d]">
                Félicitations ! Vous avez débloqué le {GIFT_NAME} ! 🎉
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Cumulable avec l'option "Colis ouvert"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const remaining = GIFT_THRESHOLD - cartTotal;
  const progress = (cartTotal / GIFT_THRESHOLD) * 100;

  return (
    <Card className="border-[#b8933d] bg-gradient-to-r from-[#b8933d]/5 to-transparent">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-[#b8933d]" />
              <p className="font-semibold text-gray-900">Cadeau offert à {GIFT_THRESHOLD}€</p>
            </div>
            <p className="text-sm font-medium text-gray-600">
              {cartTotal.toFixed(2)} € / {GIFT_THRESHOLD} €
            </p>
          </div>

          <Progress value={progress} className="h-2" />

          <p className="text-sm text-gray-700">
            Plus que <span className="font-bold text-[#b8933d]">{remaining.toFixed(2)} €</span> pour débloquer :{' '}
            <span className="font-semibold">{GIFT_NAME}</span> 🎁
          </p>

          <p className="text-xs text-gray-500 italic mt-1">
            {deliveryBatchId
              ? 'Ce cadeau sera ajouté à votre colis ouvert (cumulable)'
              : 'Cumulable avec l\'option "Colis ouvert"'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
