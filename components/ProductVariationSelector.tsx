"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Attribute {
  name: string;
  option: string;
}

interface Variation {
  id: number;
  attributes: Attribute[];
  price: string;
  regular_price: string;
  sale_price: string | null;
  stock_status: string;
  stock_quantity: number | null;
  image?: {
    src: string;
    alt: string;
  };
}

interface ProductVariationSelectorProps {
  attributes: Array<{
    name: string;
    options: string[];
  }>;
  variations: Variation[];
  onVariationChange: (variation: Variation | null) => void;
}

const sizeOrder = ["xs", "s", "m", "l", "xl", "xxl", "xxxl"];

export function ProductVariationSelector({
  attributes,
  variations,
  onVariationChange,
}: ProductVariationSelectorProps) {
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  const safeString = (value: any): string => {
    if (typeof value === 'object' && value !== null) {
      return value.name || JSON.stringify(value);
    }
    return String(value || '');
  };

  const sortOptions = (options: string[], attributeName: string) => {
    if (attributeName.toLowerCase().includes("taille") || attributeName.toLowerCase().includes("size")) {
      return [...options].sort((a, b) => {
        const aStr = safeString(a).toLowerCase();
        const bStr = safeString(b).toLowerCase();
        const aIndex = sizeOrder.indexOf(aStr);
        const bIndex = sizeOrder.indexOf(bStr);
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
    }
    return options;
  };

  const handleAttributeSelect = (attributeName: string, option: string) => {
    setSelectedAttributes((prev) => ({
      ...prev,
      [attributeName]: option,
    }));
  };

  const isOptionAvailable = (attributeName: string, option: string): boolean => {
    const optionStr = safeString(option);
    const potentialSelection = { ...selectedAttributes, [attributeName]: optionStr };
    const allAttributesSelected = attributes.every((attr) => potentialSelection[attr.name]);

    if (!allAttributesSelected) {
      return variations.some((variation) =>
        variation.attributes.some(
          (attr) =>
            attr.name === attributeName &&
            safeString(attr.option).toLowerCase() === optionStr.toLowerCase() &&
            variation.stock_status === "instock"
        )
      );
    }

    const matchingVariation = variations.find((variation) =>
      variation.attributes.every((attr) =>
        potentialSelection[attr.name]?.toLowerCase() === safeString(attr.option).toLowerCase()
      )
    );

    return matchingVariation ? matchingVariation.stock_status === "instock" : false;
  };

  useEffect(() => {
    const allSelected = attributes.every((attr) => selectedAttributes[attr.name]);

    if (allSelected) {
      const matchingVariation = variations.find((variation) =>
        variation.attributes.every((attr) =>
          selectedAttributes[attr.name]?.toLowerCase() === safeString(attr.option).toLowerCase()
        )
      );
      onVariationChange(matchingVariation || null);
    } else {
      const partialMatch = variations.find((variation) =>
        Object.entries(selectedAttributes).every(
          ([attrName, attrValue]) =>
            variation.attributes.some(
              (attr) =>
                attr.name === attrName &&
                safeString(attr.option).toLowerCase() === attrValue.toLowerCase()
            )
        )
      );
      onVariationChange(partialMatch || null);
    }
  }, [selectedAttributes, variations, attributes, onVariationChange]);

  const isColorAttribute = (name: string) => {
    return name.toLowerCase().includes("couleur") || name.toLowerCase().includes("color");
  };

  const getColorValue = (colorName: any): string => {
    const colorStr = safeString(colorName);
    const colorMap: Record<string, string> = {
      noir: "#000000",
      blanc: "#FFFFFF",
      rouge: "#DC2626",
      bleu: "#2563EB",
      vert: "#16A34A",
      jaune: "#EAB308",
      rose: "#EC4899",
      violet: "#9333EA",
      orange: "#F97316",
      gris: "#6B7280",
      beige: "#D4B896",
      marron: "#92400E",
    };

    const lowerName = colorStr.toLowerCase();
    for (const [key, value] of Object.entries(colorMap)) {
      if (lowerName.includes(key)) {
        return value;
      }
    }
    return "#9CA3AF";
  };

  return (
    <div className="space-y-6">
      {attributes.map((attribute) => (
        <div key={attribute.name} className="space-y-3">
          <Label className="text-base font-semibold">{attribute.name}</Label>

          {isColorAttribute(attribute.name) ? (
            <div className="flex flex-wrap gap-3">
              {sortOptions(attribute.options, attribute.name).map((option) => {
                const optionStr = safeString(option);
                const isSelected = selectedAttributes[attribute.name] === optionStr;
                const isAvailable = isOptionAvailable(attribute.name, option);

                return (
                  <button
                    key={optionStr}
                    onClick={() => handleAttributeSelect(attribute.name, optionStr)}
                    disabled={!isAvailable}
                    className={`relative w-12 h-12 rounded-full border-2 transition-all ${
                      isSelected
                        ? "border-[#b8933d] ring-2 ring-[#b8933d] ring-offset-2"
                        : "border-gray-300 hover:border-gray-400"
                    } ${!isAvailable ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                    title={optionStr}
                  >
                    <div
                      className="w-full h-full rounded-full"
                      style={{ backgroundColor: getColorValue(option) }}
                    />
                    {!isAvailable && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-0.5 bg-gray-400 rotate-45" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {sortOptions(attribute.options, attribute.name).map((option) => {
                const optionStr = safeString(option);
                const isSelected = selectedAttributes[attribute.name] === optionStr;
                const isAvailable = isOptionAvailable(attribute.name, option);

                return (
                  <Button
                    key={optionStr}
                    onClick={() => handleAttributeSelect(attribute.name, optionStr)}
                    disabled={!isAvailable}
                    variant={isSelected ? "default" : "outline"}
                    className={`min-w-[60px] ${
                      isSelected
                        ? "bg-[#b8933d] hover:bg-[#a07c2f] border-[#b8933d] text-white"
                        : "border-gray-300 hover:border-[#b8933d]"
                    } ${!isAvailable ? "opacity-50 line-through" : ""}`}
                  >
                    {optionStr}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
