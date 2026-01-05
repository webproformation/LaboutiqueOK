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
}

const diamondPositions = ["title", "image", "description"];

export function HiddenDiamond({ productId, position }: HiddenDiamondProps) {
  const { user, profile } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [hasFoundDiamond, setHasFoundDiamond] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<string>(position);

  useEffect(() => {
    const randomPosition = diamondPositions[Math.floor(Math.random() * diamondPositions.length)];
    setCurrentPosition(randomPosition);

    if (randomPosition === position) {
      setIsVisible(true);
    }
  }, [position]);

  useEffect(() => {
    if (user && profile) {
      checkIfAlreadyFound();
    }
  }, [user, profile, productId]);

  const checkIfAlreadyFound = async () => {
    if (!user || !profile) return;

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("loyalty_transactions")
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
      const { error: transactionError } = await supabase
        .from("loyalty_transactions")
        .insert({
          user_id: profile.id,
          amount: 0.10,
          type: "diamond_found",
          description: `Diamant trouvé sur le produit`,
          reference_id: productId,
        });

      if (transactionError) {
        if (transactionError.code === "23505") {
          toast.info("Vous avez déjà trouvé ce diamant aujourd'hui !");
          setHasFoundDiamond(true);
          setIsVisible(false);
          return;
        }
        throw transactionError;
      }

      const { error: settingsError } = await supabase.rpc("increment_diamonds_found");

      if (settingsError) {
        console.error("Error updating settings:", settingsError);
      }

      toast.success("Félicitations ! Vous avez gagné 0,10 € !", {
        icon: <Gem className="h-4 w-4 fill-amber-500 text-amber-500" />,
        duration: 5000,
      });

      setHasFoundDiamond(true);

      setTimeout(() => {
        setIsVisible(false);
      }, 1000);
    } catch (error) {
      console.error("Error collecting diamond:", error);
      toast.error("Une erreur est survenue");
      setIsAnimating(false);
    }
  };

  if (!isVisible || currentPosition !== position) {
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
