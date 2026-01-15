"use client";

import { useState, useEffect } from "react";
import { Gem, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

interface HiddenDiamondProps {
  productId: string;
  position: "title" | "image" | "description";
  selectedPosition: "title" | "image" | "description";
}

export function HiddenDiamond({ productId, position, selectedPosition }: HiddenDiamondProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [isVisible, setIsVisible] = useState(position === selectedPosition);
  const [hasFoundDiamond, setHasFoundDiamond] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (user && profile) {
      checkIfAlreadyFound();
    }
  }, [user, profile, productId]);

  const checkIfAlreadyFound = async () => {
    if (!user || !profile) return;

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("loyalty_euro_transactions")
      .select("id")
      .eq("user_id", profile.id)
      .eq("type", "diamond_found")
      .eq("reference_id", productId)
      .gte("created_at", today)
      .maybeSingle();

    if (!error && data) {
      setHasFoundDiamond(true);
      setIsVisible(false);
    }
  };

  const handleDiamondClick = async () => {
    if (!user || !profile) {
      toast.error("Connectez-vous pour collecter les diamants !");
      return;
    }

    if (hasFoundDiamond) {
      toast.info("Vous avez déjà trouvé ce diamant aujourd'hui !");
      return;
    }

    setIsAnimating(true);

    try {
      const { data, error } = await supabase.rpc('add_loyalty_gain', {
        p_user_id: profile.id,
        p_type: 'diamond_found',
        p_base_amount: 0.10,
        p_description: 'Diamant trouvé sur le produit'
      });

      if (error) {
        throw error;
      }

      if (data) {
        const result = typeof data === 'string' ? JSON.parse(data) : data;
        const finalAmount = (0.10 * result.multiplier).toFixed(2);
        const multiplierText = result.multiplier > 1 ? ` (x${result.multiplier})` : '';

        await refreshProfile();

        toast.success(`Félicitations ! Vous avez gagné ${finalAmount} € !${multiplierText}`, {
          icon: <Gem className="h-4 w-4 fill-amber-500 text-amber-500" />,
          duration: 5000,
        });

        setHasFoundDiamond(true);

        setTimeout(() => {
          setIsVisible(false);
        }, 1000);
      }
    } catch (error) {
      console.error("Error collecting diamond:", error);
      toast.error("Une erreur est survenue");
      setIsAnimating(false);
    }
  };

  if (!isVisible || position !== selectedPosition) {
    return null;
  }

  return (
    <Button
      onClick={handleDiamondClick}
      disabled={isAnimating}
      variant="ghost"
      size="sm"
      className={`relative inline-flex items-center gap-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-all ${
        isAnimating ? "animate-ping" : "animate-pulse"
      }`}
    >
      <Gem className="h-5 w-5 fill-amber-500" />
      <Sparkles className="h-4 w-4" />
      <span className="text-xs font-semibold">+0,10 €</span>
    </Button>
  );
}
