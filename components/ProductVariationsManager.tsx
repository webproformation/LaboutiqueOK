"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ProductMediaSelector } from "@/components/product-media-selector";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface ColorTerm {
  id: string;
  name: string;
  color_code: string | null;
}

interface Variation {
  color_id: string;
  color_name: string;
  color_code: string | null;
  image_url: string | null;
  sku: string;
  regular_price: number | null;
  sale_price: number | null;
}

interface ProductVariationsManagerProps {
  colorTerms: ColorTerm[];
  initialVariations?: Variation[];
  onChange: (variations: Variation[]) => void;
}

export default function ProductVariationsManager({
  colorTerms,
  initialVariations = [],
  onChange,
}: ProductVariationsManagerProps) {
  const [variations, setVariations] = useState<Record<string, Variation>>(
    () => {
      const variationsMap: Record<string, Variation> = {};
      initialVariations.forEach(v => {
        variationsMap[v.color_id] = v;
      });
      return variationsMap;
    }
  );
  const [expandedColorId, setExpandedColorId] = useState<string | null>(null);

  const toggleColorVariation = (colorTerm: ColorTerm) => {
    const isSelected = !!variations[colorTerm.id];

    if (isSelected) {
      const newVariations = { ...variations };
      delete newVariations[colorTerm.id];
      setVariations(newVariations);
      onChange(Object.values(newVariations));
      toast.success(`Variation ${colorTerm.name} supprimée`);
      if (expandedColorId === colorTerm.id) {
        setExpandedColorId(null);
      }
    } else {
      const newVariation: Variation = {
        color_id: colorTerm.id,
        color_name: colorTerm.name,
        color_code: colorTerm.color_code,
        image_url: null,
        sku: "",
        regular_price: null,
        sale_price: null,
      };
      const newVariations = {
        ...variations,
        [colorTerm.id]: newVariation,
      };
      setVariations(newVariations);
      onChange(Object.values(newVariations));
      setExpandedColorId(colorTerm.id);
      toast.success(`Variation ${colorTerm.name} ajoutée`);
    }
  };

  const updateVariation = (colorId: string, field: keyof Variation, value: any) => {
    const newVariations = {
      ...variations,
      [colorId]: {
        ...variations[colorId],
        [field]: value,
      },
    };
    setVariations(newVariations);
    onChange(Object.values(newVariations));
  };

  const toggleExpanded = (colorId: string) => {
    setExpandedColorId(expandedColorId === colorId ? null : colorId);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-lg font-semibold text-gray-900 mb-3 block">
          Couleurs & Variations
        </Label>
        <p className="text-sm text-gray-600 mb-4">
          Cliquez sur une couleur pour créer une variation. Cliquez à nouveau pour la supprimer.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {colorTerms.map((colorTerm) => {
            const isSelected = !!variations[colorTerm.id];
            const isExpanded = expandedColorId === colorTerm.id;

            return (
              <div key={colorTerm.id} className="space-y-2">
                <button
                  type="button"
                  onClick={() => toggleColorVariation(colorTerm)}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? "border-[#d4af37] bg-[#d4af37]/10"
                      : "border-gray-300 hover:border-[#d4af37] bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0"
                      style={{ backgroundColor: colorTerm.color_code || "#gray" }}
                    />
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {colorTerm.name}
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="h-5 w-5 text-[#d4af37] flex-shrink-0" />
                  )}
                </button>

                {isSelected && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toggleExpanded(colorTerm.id)}
                    className="w-full border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Réduire
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Configurer
                      </>
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {expandedColorId && variations[expandedColorId] && (
        <Card className="border-2 border-[#d4af37]/30 bg-gradient-to-br from-white to-[#d4af37]/5">
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[#d4af37]/30">
              <div
                className="w-8 h-8 rounded-full border-2 border-gray-300"
                style={{
                  backgroundColor: variations[expandedColorId].color_code || "#gray",
                }}
              />
              <h3 className="text-xl font-bold text-gray-900">
                Configuration : {variations[expandedColorId].color_name}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Image de la variation
                </Label>
                <ProductMediaSelector
                  currentImageUrl={variations[expandedColorId].image_url || ""}
                  onSelect={(url) => updateVariation(expandedColorId, "image_url", url)}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Référence (UGS)
                  </Label>
                  <Input
                    value={variations[expandedColorId].sku}
                    onChange={(e) => updateVariation(expandedColorId, "sku", e.target.value)}
                    placeholder="SKU-001"
                    className="bg-white"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Prix régulier (€)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={variations[expandedColorId].regular_price || ""}
                    onChange={(e) =>
                      updateVariation(
                        expandedColorId,
                        "regular_price",
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                    placeholder="0.00"
                    className="bg-white"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Prix promo (€)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={variations[expandedColorId].sale_price || ""}
                    onChange={(e) =>
                      updateVariation(
                        expandedColorId,
                        "sale_price",
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                    placeholder="0.00"
                    className="bg-white"
                  />
                  {variations[expandedColorId].regular_price &&
                    variations[expandedColorId].sale_price &&
                    variations[expandedColorId].sale_price! <
                      variations[expandedColorId].regular_price! && (
                      <p className="text-xs text-green-600 mt-1">
                        Économie de{" "}
                        {(
                          ((variations[expandedColorId].regular_price! -
                            variations[expandedColorId].sale_price!) /
                            variations[expandedColorId].regular_price!) *
                          100
                        ).toFixed(0)}
                        %
                      </p>
                    )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {Object.keys(variations).length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>{Object.keys(variations).length}</strong> variation(s) configurée(s).
            N'oubliez pas de sauvegarder le produit pour enregistrer vos modifications.
          </p>
        </div>
      )}
    </div>
  );
}
