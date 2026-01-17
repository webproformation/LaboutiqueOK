"use client";

import { useState } from "react";
import { Gem } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface HiddenDiamondProps {
  productId: string;
  position: "title" | "image" | "description";
  selectedPosition: "title" | "image" | "description";
}

// CORRECTION ICI : "export function" (pas "export default")
export function HiddenDiamond({ productId, position, selectedPosition }: HiddenDiamondProps) {
  const [showDialog, setShowDialog] = useState(false);

  // Si ce n'est pas la bonne position, on n'affiche rien (c'est le jeu !)
  if (position !== selectedPosition) return null;

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="opacity-10 hover:opacity-100 transition-opacity duration-500 cursor-pointer p-1"
        title="Vous avez trouvé un diamant caché !"
      >
        <Gem className="w-4 h-4 text-[#b8933d]" />
      </button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#b8933d] flex flex-col items-center gap-2">
              <Gem className="w-12 h-12" />
              BRAVO !
            </DialogTitle>
            <DialogDescription className="text-lg pt-4 text-gray-800">
              Vous avez trouvé le diamant caché ! 💎
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600 mb-4">
              Voici votre code promo exclusif valable 24h :
            </p>
            <div className="bg-[#FFF9F0] border-2 border-[#b8933d] border-dashed rounded-xl p-4 text-xl font-mono font-bold text-[#b8933d] tracking-widest select-all">
              DIAMANT-SECRET
            </div>
          </div>
          <Button onClick={() => setShowDialog(false)} className="bg-[#b8933d] hover:bg-[#a07c2f] text-white">
            Génial, merci !
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}