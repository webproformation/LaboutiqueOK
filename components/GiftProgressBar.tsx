"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Gift, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface GiftProgressBarProps {
  cartTotal?: number;
  deliveryBatchId?: string | null;
  compact?: boolean;
}

interface GiftStatus {
  gift_unlocked: boolean;
  threshold_amount: number;
  remaining_amount: number;
  message: string;
  gift_name?: string;
  gift_description?: string;
  gift_threshold_id?: string;
}

export default function GiftProgressBar({
  cartTotal = 0,
  deliveryBatchId = null,
  compact = false,
}: GiftProgressBarProps) {
  const { user } = useAuth();
  const [giftStatus, setGiftStatus] = useState<GiftStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cumulativeAmount, setCumulativeAmount] = useState(0);

  useEffect(() => {
    fetchGiftStatus();
  }, [user, cartTotal, deliveryBatchId]);

  const fetchGiftStatus = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      let cumulative = cartTotal;

      if (user?.id && deliveryBatchId) {
        const { data: ordersData } = await supabase
          .from("orders")
          .select("total")
          .eq("user_id", user.id)
          .eq("delivery_batch_id", deliveryBatchId)
          .not("status", "in", '("cancelled","failed","refunded")');

        if (ordersData) {
          const ordersTotal = ordersData.reduce(
            (sum, order) => sum + parseFloat(order.total || "0"),
            0
          );
          cumulative += ordersTotal;
        }
      }

      setCumulativeAmount(cumulative);

      const { data: thresholdData } = await supabase
        .from("gift_thresholds")
        .select("*")
        .eq("is_active", true)
        .order("threshold_amount", { ascending: true })
        .limit(1)
        .single();

      if (thresholdData) {
        const remaining = Math.max(0, thresholdData.threshold_amount - cumulative);
        const unlocked = cumulative >= thresholdData.threshold_amount;

        let message = unlocked
          ? thresholdData.display_message_after
          : thresholdData.display_message_before.replace(
              "{amount}",
              remaining.toFixed(2)
            );

        setGiftStatus({
          gift_unlocked: unlocked,
          threshold_amount: thresholdData.threshold_amount,
          remaining_amount: remaining,
          message,
          gift_name: thresholdData.gift_name,
          gift_description: thresholdData.gift_description,
          gift_threshold_id: thresholdData.id,
        });
      }
    } catch (error) {
      console.error("Error fetching gift status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !giftStatus) {
    return null;
  }

  const progressPercentage = Math.min(
    100,
    (cumulativeAmount / giftStatus.threshold_amount) * 100
  );

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 rounded-lg border border-[#D4AF37]/20">
        {giftStatus.gift_unlocked ? (
          <>
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <p className="text-sm font-medium text-[#D4AF37]">
              {giftStatus.message}
            </p>
          </>
        ) : (
          <>
            <Gift className="h-5 w-5 text-[#D4AF37] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1 truncate">
                {giftStatus.message}
              </p>
              <Progress value={progressPercentage} className="h-1.5" />
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border-[#D4AF37]/30">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div
            className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
              giftStatus.gift_unlocked
                ? "bg-gradient-to-br from-[#D4AF37] to-[#B8941F]"
                : "bg-[#D4AF37]/10"
            }`}
          >
            {giftStatus.gift_unlocked ? (
              <Sparkles className="h-6 w-6 text-white" />
            ) : (
              <Gift className="h-6 w-6 text-[#D4AF37]" />
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  {giftStatus.gift_name || "Cadeau Surprise"}
                  {giftStatus.gift_unlocked && (
                    <Badge className="bg-green-500">Débloqué</Badge>
                  )}
                </h3>
                {giftStatus.gift_description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {giftStatus.gift_description}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-bold text-[#D4AF37]">
                  {cumulativeAmount.toFixed(2)}€
                </div>
                <div className="text-xs text-muted-foreground">
                  sur {giftStatus.threshold_amount.toFixed(2)}€
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Progress
                value={progressPercentage}
                className="h-3"
              />
              <p
                className={`text-sm font-medium ${
                  giftStatus.gift_unlocked
                    ? "text-green-600"
                    : "text-muted-foreground"
                }`}
              >
                {giftStatus.message}
              </p>
            </div>

            {deliveryBatchId && cartTotal > 0 && (
              <div className="pt-2 border-t border-dashed">
                <p className="text-xs text-muted-foreground">
                  Ce montant inclut vos commandes précédentes du colis en cours
                  (
                  {(cumulativeAmount - cartTotal).toFixed(2)}€) + votre panier
                  actuel ({cartTotal.toFixed(2)}€)
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
