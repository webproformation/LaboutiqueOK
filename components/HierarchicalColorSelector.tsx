"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ColorTerm {
  id: string;
  name: string;
  slug: string;
  color_code: string | null;
  color_family: string | null;
  value: string;
  order_by: number;
}

interface HierarchicalColorSelectorProps {
  terms: ColorTerm[];
  selectedTermIds: string[];
  onToggle: (termId: string, value: string, name: string) => void;
}

const COLOR_FAMILY_ORDER = [
  "Blanc",
  "Noir",
  "Gris",
  "Beige",
  "Marron",
  "Rouge",
  "Rose",
  "Orange",
  "Jaune",
  "Vert",
  "Bleu",
  "Violet",
  "Multicolore",
  "Métallisé",
  "Autre"
];

export function HierarchicalColorSelector({
  terms,
  selectedTermIds,
  onToggle,
}: HierarchicalColorSelectorProps) {
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(new Set());

  // Regrouper les couleurs par famille
  const colorsByFamily = terms.reduce((acc, term) => {
    const family = term.color_family || "Autre";
    if (!acc[family]) {
      acc[family] = [];
    }
    acc[family].push(term);
    return acc;
  }, {} as Record<string, ColorTerm[]>);

  // Trier les familles selon l'ordre défini
  const sortedFamilies = Object.keys(colorsByFamily).sort((a, b) => {
    const indexA = COLOR_FAMILY_ORDER.indexOf(a);
    const indexB = COLOR_FAMILY_ORDER.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const toggleFamily = (family: string) => {
    setExpandedFamilies(prev => {
      const next = new Set(prev);
      if (next.has(family)) {
        next.delete(family);
      } else {
        next.add(family);
      }
      return next;
    });
  };

  const getFamilySelectedCount = (family: string) => {
    const familyTerms = colorsByFamily[family];
    return familyTerms.filter(term => selectedTermIds.includes(term.id)).length;
  };

  return (
    <div className="space-y-2">
      <Label className="text-lg font-semibold text-gray-900 mb-3 block">
        Couleur
      </Label>
      <p className="text-sm text-gray-600 mb-4">
        Cliquez sur une famille de couleur pour voir les nuances disponibles
      </p>

      <div className="space-y-2">
        {sortedFamilies.map((family) => {
          const isExpanded = expandedFamilies.has(family);
          const familyTerms = colorsByFamily[family];
          const selectedCount = getFamilySelectedCount(family);
          const firstColor = familyTerms[0]?.color_code;

          return (
            <div key={family} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* En-tête de la famille */}
              <button
                type="button"
                onClick={() => toggleFamily(family)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {firstColor && (
                    <div
                      className="w-8 h-8 rounded-full border-2 border-gray-300 flex-shrink-0"
                      style={{ backgroundColor: firstColor }}
                    />
                  )}
                  <span className="font-semibold text-gray-900">{family}</span>
                  {selectedCount > 0 && (
                    <span className="px-2 py-1 bg-[#D4AF37] text-white text-xs font-bold rounded-full">
                      {selectedCount}
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </button>

              {/* Nuances de la famille */}
              {isExpanded && (
                <div className="p-4 bg-white grid grid-cols-2 gap-3">
                  {familyTerms.map((term) => {
                    const isSelected = selectedTermIds.includes(term.id);

                    return (
                      <button
                        key={term.id}
                        type="button"
                        onClick={() => onToggle(term.id, term.value, term.name)}
                        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                          isSelected
                            ? "border-[#d4af37] bg-[#d4af37]/10 font-semibold"
                            : "border-gray-300 hover:border-[#d4af37] bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {term.color_code && (
                            <div
                              className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0"
                              style={{ backgroundColor: term.color_code }}
                            />
                          )}
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {term.name}
                          </span>
                        </div>
                        {isSelected && <Check className="h-5 w-5 text-[#d4af37] flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
