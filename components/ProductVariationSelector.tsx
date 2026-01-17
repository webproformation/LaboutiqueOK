"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Attribute {
  name: string;
  options: string[];
  colorCodes?: string[];
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

// CORRECTION ICI : "export function" (pas "export default")
export function ProductVariationSelector({
  attributes,
  variations,
  onVariationChange,
  initialSelectedAttributes,
}: ProductVariationSelectorProps) {
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>(
    initialSelectedAttributes || {}
  );

  useEffect(() => {
    if (initialSelectedAttributes) {
      setSelectedAttributes(initialSelectedAttributes);
    }
  }, [initialSelectedAttributes]);

  const handleSelect = (attributeName: string, option: string) => {
    const newAttributes = { ...selectedAttributes, [attributeName]: option };
    setSelectedAttributes(newAttributes);

    const matchingVariation = variations.find((variation) =>
      variation.attributes.every(
        (attr) => newAttributes[attr.name] === attr.option
      )
    );

    if (matchingVariation) {
      onVariationChange(matchingVariation);
    } else {
      onVariationChange(null);
    }
  };

  const isOptionAvailable = (attributeName: string, option: string) => {
    return variations.some((v) =>
      v.attributes.some((a) => a.name === attributeName && a.option === option)
    );
  };

  return (
    <div className="space-y-4">
      {attributes.map((attr) => (
        <div key={attr.name} className="space-y-3">
          <Label className="text-sm font-semibold text-gray-700">
            {attr.name}: <span className="text-gray-900 font-normal">{selectedAttributes[attr.name]}</span>
          </Label>
          <div className="flex flex-wrap gap-2">
            {attr.options.map((option, index) => {
              const isSelected = selectedAttributes[attr.name] === option;
              const isAvailable = isOptionAvailable(attr.name, option);
              const colorCode = attr.colorCodes?.[index];

              if (attr.name.toLowerCase().includes("couleur") && colorCode) {
                return (
                  <button
                    key={option}
                    onClick={() => handleSelect(attr.name, option)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all relative focus:outline-none focus:ring-2 focus:ring-[#b8933d] focus:ring-offset-2",
                      isSelected ? "border-[#b8933d] scale-110" : "border-gray-200 hover:border-gray-300",
                      !isAvailable && "opacity-50 cursor-not-allowed"
                    )}
                    style={{ backgroundColor: colorCode }}
                    disabled={!isAvailable}
                    title={option}
                  />
                );
              }

              return (
                <button
                  key={option}
                  onClick={() => handleSelect(attr.name, option)}
                  disabled={!isAvailable}
                  className={cn(
                    "px-4 py-2 text-sm border rounded-lg transition-all",
                    isSelected
                      ? "border-[#b8933d] bg-[#b8933d] text-white shadow-md"
                      : "border-gray-200 bg-white text-gray-700 hover:border-[#b8933d] hover:text-[#b8933d]",
                    !isAvailable && "opacity-50 cursor-not-allowed bg-gray-50 text-gray-400"
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}