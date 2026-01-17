"use client";

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

interface WishlistButtonProps {
  productId: string;
  variant?: "default" | "outline" | "ghost" | "icon";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

// CORRECTION : export function (Nommée)
export function WishlistButton({ 
  productId, 
  variant = "outline", 
  size = "icon", 
  className 
}: WishlistButtonProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);

  const toggleWishlist = () => {
    // Simulation simple pour l'interface (la vraie logique backend viendra plus tard)
    setIsWishlisted(!isWishlisted);
    if (!isWishlisted) {
      toast.success("Ajouté à vos favoris ❤️");
    } else {
      toast.info("Retiré des favoris");
    }
  };

  return (
    <Button
      variant={variant === "icon" ? "outline" : variant}
      size={size}
      onClick={toggleWishlist}
      className={cn(
        "transition-colors",
        isWishlisted 
          ? "bg-pink-50 border-pink-200 text-pink-500 hover:text-pink-600 hover:bg-pink-100" 
          : "hover:text-pink-500 hover:border-pink-200 hover:bg-pink-50",
        className
      )}
      aria-label="Ajouter aux favoris"
    >
      <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
    </Button>
  );
}