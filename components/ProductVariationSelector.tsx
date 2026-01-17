"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Attribute {
  name: string;
  options: string[];
  colorCodes?: string[]; // Important : ce tableau doit exister pour les couleurs
}

interface Variation {
  id: string;
  attributes: { name: string; option: string }[];
  stock_status: string;
  stock_quantity?: number;
}

interface ProductVariationSelectorProps {
  attributes: Attribute[];
  variations: Variation[];
  onVariationChange: (variation: any) => void;
  initialSelectedAttributes?: Record<string, string>;
}

export function ProductVariationSelector({
  attributes,
  variations,
  onVariationChange,
  initialSelectedAttributes,
}: ProductVariationSelectorProps) {
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>(
    initialSelectedAttributes || {}
  );

  // Met à jour la sélection si les props initiales changent
  useEffect(() => {
    if (initialSelectedAttributes) {
      setSelectedAttributes(initialSelectedAttributes);
    }
  }, [initialSelectedAttributes]);

  const handleSelect = (attributeName: string, option: string) => {
    const newAttributes = { ...selectedAttributes, [attributeName]: option };
    setSelectedAttributes(newAttributes);

    // Trouver la variation correspondante à la nouvelle combinaison
    const matchingVariation = variations.find((variation) =>
      variation.attributes.every(
        (attr) => newAttributes[attr.name] === attr.option
      )
    );

    if (matchingVariation) {
      onVariationChange(matchingVariation);
    } else {
      // Si la combinaison n'existe pas (ex: Taille L en Rose n'existe pas)
      onVariationChange(null);
    }
  };

  // Vérifie si une option est disponible (en stock dans au moins une combinaison)
  const isOptionAvailable = (attributeName: string, option: string) => {
    // Logique simplifiée : on regarde si cette option existe dans les variations
    // On pourrait affiner en vérifiant la compatibilité avec les autres sélections actuelles
    return variations.some((v) =>
      v.attributes.some((a) => a.name === attributeName && a.option === option)
    );
  };

  return (
    <div className="space-y-6">
      {attributes.map((attr) => {
        // Détection : est-ce un attribut de type "Couleur" ?
        const isColorAttribute = attr.name.toLowerCase().includes("couleur") || attr.name.toLowerCase().includes("color");

        return (
          <div key={attr.name} className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-bold text-gray-900">
                {attr.name} : <span className="font-normal text-gray-700 ml-2">{selectedAttributes[attr.name]}</span>
              </Label>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {attr.options.map((option, index) => {
                const isSelected = selectedAttributes[attr.name] === option;
                const isAvailable = isOptionAvailable(attr.name, option);
                // Récupération du code couleur s'il existe à cet index
                const colorCode = isColorAttribute && attr.colorCodes ? attr.colorCodes[index] : null;

                // --- RENDU PASTILLE COULEUR ---
                if (isColorAttribute && colorCode) {
                  return (
                    <button
                      key={option}
                      onClick={() => handleSelect(attr.name, option)}
                      disabled={!isAvailable}
                      title={option} // Affiche le nom de la couleur au survol
                      className={cn(
                        "w-10 h-10 rounded-full border-2 transition-all duration-200 relative flex items-center justify-center outline-none",
                        isSelected
                          ? "border-[#b8933d] scale-110 ring-2 ring-[#b8933d] ring-offset-2" // Style sélectionné : anneau doré
                          : "border-gray-200 hover:border-[#b8933d] hover:scale-105", // Style normal
                        !isAvailable && "opacity-40 cursor-not-allowed hover:scale-100 hover:border-gray-200" // Style désactivé
                      )}
                      style={{ backgroundColor: colorCode }} // Application de la couleur
                    >
                      {isSelected && (
                        // Petit check blanc (ou noir selon la luminosité) pour confirmer la sélection
                        <span className="text-white drop-shadow-md">
                            <Check className="w-5 h-5" />
                        </span>
                      )}
                      <span className="sr-only">{option}</span>
                    </button>
                  );
                }

                // --- RENDU BOUTON TEXTE STANDARD (Pour les Tailles, etc.) ---
                return (
                  <button
                    key={option}
                    onClick={() => handleSelect(attr.name, option)}
                    disabled={!isAvailable}
                    className={cn(
                      "px-4 py-2 text-sm font-medium border-2 rounded-lg transition-all duration-200 min-w-[3rem]",
                      isSelected
                        ? "border-[#b8933d] bg-[#b8933d] text-white shadow-sm" // Style sélectionné
                        : "border-gray-200 bg-white text-gray-700 hover:border-[#b8933d] hover:text-[#b8933d]", // Style normal
                      !isAvailable && "opacity-50 cursor-not-allowed bg-gray-50 text-gray-400 decoration-slate-400" // Style désactivé
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}