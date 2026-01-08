"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ProductMediaSelector } from "@/components/product-media-selector";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

interface AttributeTerm {
  id: string;
  name: string;
  slug: string;
  color_code: string | null;
  value: string;
}

interface ProductAttribute {
  id: string;
  name: string;
  slug: string;
  type: string;
  terms?: AttributeTerm[];
}

interface ColorTerm {
  id: string;
  name: string;
  color_code: string | null;
}

interface SizeTerm {
  id: string;
  name: string;
  value: string;
}

interface Variation {
  color_id: string;
  color_name: string;
  color_code: string | null;
  size_id?: string;
  size_name?: string;
  image_url: string | null;
  sku: string;
  regular_price: number | null;
  sale_price: number | null;
}

interface ProductVariationsManagerProps {
  colorTerms: ColorTerm[];
  sizeTerms?: SizeTerm[];
  initialVariations?: Variation[];
  onChange: (variations: Variation[]) => void;
}

export default function ProductVariationsManager({
  colorTerms,
  sizeTerms = [],
  initialVariations = [],
  onChange,
}: ProductVariationsManagerProps) {
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [variations, setVariations] = useState<Variation[]>(initialVariations);
  const [expandedVariationKey, setExpandedVariationKey] = useState<string | null>(null);
  const [allAttributes, setAllAttributes] = useState<ProductAttribute[]>([]);
  const [selectedAttributeTerms, setSelectedAttributeTerms] = useState<Record<string, string[]>>({});

  useEffect(() => {
    loadAllAttributes();
  }, []);

  useEffect(() => {
    if (initialVariations.length > 0) {
      const colors = new Set<string>();
      const sizes = new Set<string>();
      initialVariations.forEach(v => {
        colors.add(v.color_id);
        if (v.size_id) sizes.add(v.size_id);
      });
      setSelectedColors(Array.from(colors));
      setSelectedSizes(Array.from(sizes));
    }
  }, []);

  const loadAllAttributes = async () => {
    try {
      const { data: attrs, error } = await supabase
        .from("product_attributes")
        .select(`
          *,
          product_attribute_terms (
            id,
            name,
            slug,
            value,
            color_code,
            order_by,
            attribute_id
          )
        `)
        .eq("is_visible", true)
        .order("order_by");

      if (error) throw error;

      if (attrs) {
        const formatted = attrs.map(attr => ({
          ...attr,
          terms: attr.product_attribute_terms || []
        }));
        setAllAttributes(formatted as any);
      }
    } catch (error) {
      console.error("Error loading all attributes:", error);
    }
  };

  const toggleAttributeTerm = (attributeSlug: string, termId: string) => {
    setSelectedAttributeTerms(prev => {
      const currentTerms = prev[attributeSlug] || [];
      const newTerms = currentTerms.includes(termId)
        ? currentTerms.filter(id => id !== termId)
        : [...currentTerms, termId];

      return {
        ...prev,
        [attributeSlug]: newTerms
      };
    });
  };

  const generateVariations = (colors: string[], sizes: string[]) => {
    const newVariations: Variation[] = [];

    if (colors.length === 0) {
      setVariations([]);
      onChange([]);
      return;
    }

    if (sizes.length === 0) {
      colors.forEach(colorId => {
        const colorTerm = colorTerms.find(c => c.id === colorId);
        if (!colorTerm) return;

        const existingVar = variations.find(v => v.color_id === colorId && !v.size_id);

        newVariations.push(existingVar || {
          color_id: colorId,
          color_name: colorTerm.name,
          color_code: colorTerm.color_code,
          image_url: null,
          sku: `VAR-${colorTerm.name.toLowerCase()}`,
          regular_price: null,
          sale_price: null,
        });
      });
    } else {
      colors.forEach(colorId => {
        const colorTerm = colorTerms.find(c => c.id === colorId);
        if (!colorTerm) return;

        sizes.forEach(sizeId => {
          const sizeTerm = sizeTerms.find(s => s.id === sizeId);
          if (!sizeTerm) return;

          const existingVar = variations.find(v => v.color_id === colorId && v.size_id === sizeId);

          newVariations.push(existingVar || {
            color_id: colorId,
            color_name: colorTerm.name,
            color_code: colorTerm.color_code,
            size_id: sizeId,
            size_name: sizeTerm.name,
            image_url: null,
            sku: `VAR-${colorTerm.name.toLowerCase()}-${sizeTerm.name.toLowerCase()}`,
            regular_price: null,
            sale_price: null,
          });
        });
      });
    }

    setVariations(newVariations);
    onChange(newVariations);
  };

  const toggleColor = (colorId: string) => {
    const newColors = selectedColors.includes(colorId)
      ? selectedColors.filter(id => id !== colorId)
      : [...selectedColors, colorId];

    setSelectedColors(newColors);
    generateVariations(newColors, selectedSizes);
  };

  const toggleSize = (sizeId: string) => {
    const newSizes = selectedSizes.includes(sizeId)
      ? selectedSizes.filter(id => id !== sizeId)
      : [...selectedSizes, sizeId];

    setSelectedSizes(newSizes);
    generateVariations(selectedColors, newSizes);
  };

  const updateVariation = (index: number, field: keyof Variation, value: any) => {
    const newVariations = [...variations];
    newVariations[index] = {
      ...newVariations[index],
      [field]: value,
    };
    setVariations(newVariations);
    onChange(newVariations);
  };

  const getVariationKey = (variation: Variation) => {
    return variation.size_id
      ? `${variation.color_id}-${variation.size_id}`
      : variation.color_id;
  };

  const getVariationLabel = (variation: Variation) => {
    return variation.size_name
      ? `${variation.color_name} - ${variation.size_name}`
      : variation.color_name;
  };

  const toggleExpanded = (key: string) => {
    setExpandedVariationKey(expandedVariationKey === key ? null : key);
  };

  return (
    <div className="space-y-6">
      {/* Section pour les couleurs */}
      <div className="space-y-4">
        <div>
          <Label className="text-lg font-semibold text-gray-900 mb-3 block">
            Couleurs (pour variations de produit)
          </Label>
          <p className="text-sm text-gray-600 mb-4">
            Sélectionnez les couleurs disponibles pour ce produit
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {colorTerms.map((colorTerm) => {
              const isSelected = selectedColors.includes(colorTerm.id);
              return (
                <button
                  key={colorTerm.id}
                  type="button"
                  onClick={() => toggleColor(colorTerm.id)}
                  className={`flex items-center justify-between gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
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
                  {isSelected && <Check className="h-5 w-5 text-[#d4af37] flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {sizeTerms.length > 0 && (
          <div>
            <Label className="text-lg font-semibold text-gray-900 mb-3 block">
              Tailles (pour variations de produit)
            </Label>
            <p className="text-sm text-gray-600 mb-4">
              Sélectionnez les tailles disponibles (optionnel)
            </p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {sizeTerms.map((sizeTerm) => {
                const isSelected = selectedSizes.includes(sizeTerm.id);
                return (
                  <button
                    key={sizeTerm.id}
                    type="button"
                    onClick={() => toggleSize(sizeTerm.id)}
                    className={`px-4 py-3 rounded-lg border-2 transition-all text-center ${
                      isSelected
                        ? "border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37] font-semibold"
                        : "border-gray-300 hover:border-[#d4af37] bg-white"
                    }`}
                  >
                    {sizeTerm.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {variations.length > 0 && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>{variations.length}</strong> variation(s) générée(s) automatiquement
            </p>
          </div>

          <div className="space-y-3">
            {variations.map((variation, index) => {
              const variationKey = getVariationKey(variation);
              const isExpanded = expandedVariationKey === variationKey;

              return (
                <Card key={variationKey} className="border-l-4 border-l-[#d4af37]">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full border-2 border-gray-300"
                          style={{ backgroundColor: variation.color_code || "#gray" }}
                        />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getVariationLabel(variation)}
                        </h3>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExpanded(variationKey)}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                        <div>
                          <Label>Image de la variation</Label>
                          <ProductMediaSelector
                            currentImageUrl={variation.image_url || ""}
                            onSelect={(url) => updateVariation(index, "image_url", url)}
                          />
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label>Référence (UGS)</Label>
                            <Input
                              value={variation.sku}
                              onChange={(e) => updateVariation(index, "sku", e.target.value)}
                              placeholder="SKU-001"
                            />
                          </div>

                          <div>
                            <Label>Prix régulier (€)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={variation.regular_price || ""}
                              onChange={(e) =>
                                updateVariation(index, "regular_price", e.target.value ? parseFloat(e.target.value) : null)
                              }
                              placeholder="0.00"
                            />
                          </div>

                          <div>
                            <Label>Prix promo (€)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={variation.sale_price || ""}
                              onChange={(e) =>
                                updateVariation(index, "sale_price", e.target.value ? parseFloat(e.target.value) : null)
                              }
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
