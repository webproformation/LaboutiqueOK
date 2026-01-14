"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ProductMediaSelector } from "@/components/product-media-selector";
import { Check, ChevronDown, ChevronUp, Info } from "lucide-react";
import { HierarchicalColorSelector } from "@/components/HierarchicalColorSelector";

interface AttributeTerm {
  id: string;
  name: string;
  slug: string;
  color_code: string | null;
  color_family: string | null;
  value: string;
  attribute_id: string;
}

interface ProductAttribute {
  id: string;
  name: string;
  slug: string;
  type: string;
  terms?: AttributeTerm[];
}

interface Variation {
  attributes: Record<string, {id: string; name: string; color_code?: string | null}>;
  image_url: string | null;
  sku: string;
  regular_price: number | null;
  sale_price: number | null;
  stock_quantity: number | null;
  size_min: number | null;
  size_max: number | null;
}

interface ProductVariationsManagerProps {
  initialVariations?: any[];
  onChange: (variations: Variation[]) => void;
}

export default function ProductVariationsManager({
  initialVariations = [],
  onChange,
}: ProductVariationsManagerProps) {
  const [allAttributes, setAllAttributes] = useState<ProductAttribute[]>([]);
  const [selectedAttributeTerms, setSelectedAttributeTerms] = useState<Record<string, string[]>>({});
  const [variations, setVariations] = useState<Variation[]>([]);
  const [expandedVariationKey, setExpandedVariationKey] = useState<string | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);

  useEffect(() => {
    loadAllAttributes();
  }, []);

  useEffect(() => {
    if (initialVariations && initialVariations.length > 0) {
      setIsLoadingInitial(true);
      loadInitialVariations();
    }
  }, [JSON.stringify(initialVariations)]);

  useEffect(() => {
    if (!isLoadingInitial) {
      generateVariations();
    }
  }, [selectedAttributeTerms, allAttributes]);

  const loadInitialVariations = () => {
    if (initialVariations && initialVariations.length > 0) {
      const formattedVariations = initialVariations.map(v => ({
        attributes: v.attributes || {},
        image_url: v.image_url || null,
        sku: v.sku || "",
        regular_price: v.regular_price || null,
        sale_price: v.sale_price || null,
        stock_quantity: v.stock_quantity || null,
        size_min: v.size_min || null,
        size_max: v.size_max || null,
      }));
      setVariations(formattedVariations);

      const attributeTermsMap: Record<string, Set<string>> = {};

      initialVariations.forEach(variation => {
        if (variation.attributes) {
          Object.entries(variation.attributes).forEach(([attrSlug, attrData]: [string, any]) => {
            if (!attributeTermsMap[attrSlug]) {
              attributeTermsMap[attrSlug] = new Set();
            }
            if (attrData && attrData.id) {
              attributeTermsMap[attrSlug].add(attrData.id);
            }
          });
        }
      });

      const selectedTerms: Record<string, string[]> = {};
      Object.entries(attributeTermsMap).forEach(([slug, termIds]) => {
        selectedTerms[slug] = Array.from(termIds);
      });

      setSelectedAttributeTerms(selectedTerms);

      setTimeout(() => {
        setIsLoadingInitial(false);
      }, 100);
    }
  };

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
            color_family,
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
          terms: (attr.product_attribute_terms || []).sort((a: any, b: any) => (a.order_by || 0) - (b.order_by || 0))
        }));
        setAllAttributes(formatted as any);
      }
    } catch (error) {
      console.error("Error loading all attributes:", error);
    }
  };

  const toggleAttributeTerm = (attributeSlug: string, termId: string, termValue: string, termName: string) => {
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

    const attribute = allAttributes.find(a => a.slug === attributeSlug);
    const isSizeAttribute = attribute?.slug === 'taille' || attribute?.slug === 'size';

    if (isSizeAttribute) {
      const numericValue = parseInt(termValue);

      if (!isNaN(numericValue)) {
        setTimeout(() => {
          setVariations(prevVariations => {
            const updatedVariations = prevVariations.map(v => {
              const hasThisTerm = v.attributes[attributeSlug]?.id === termId;
              if (hasThisTerm && v.size_min === null && v.size_max === null) {
                return {
                  ...v,
                  size_min: numericValue,
                  size_max: numericValue
                };
              }
              return v;
            });
            onChange(updatedVariations);
            return updatedVariations;
          });
        }, 100);
      }
    }
  };

  const generateVariations = () => {
    const attributesWithSelections = Object.entries(selectedAttributeTerms).filter(
      ([_, termIds]) => termIds.length > 0
    );

    if (attributesWithSelections.length === 0) {
      setVariations([]);
      onChange([]);
      return;
    }

    const combinations: Array<Array<{attrSlug: string; termId: string}>> = [[]];

    attributesWithSelections.forEach(([attrSlug, termIds]) => {
      const newCombinations: Array<Array<{attrSlug: string; termId: string}>> = [];
      combinations.forEach(combo => {
        termIds.forEach(termId => {
          newCombinations.push([...combo, {attrSlug, termId}]);
        });
      });
      combinations.length = 0;
      combinations.push(...newCombinations);
    });

    const newVariations: Variation[] = combinations.map(combo => {
      const attributes: Record<string, {id: string; name: string; color_code?: string | null}> = {};
      let skuParts: string[] = [];

      combo.forEach(({attrSlug, termId}) => {
        const attr = allAttributes.find(a => a.slug === attrSlug);
        const term = attr?.terms?.find(t => t.id === termId);
        if (attr && term) {
          attributes[attrSlug] = {
            id: termId,
            name: term.name,
            color_code: term.color_code || null
          };
          skuParts.push(term.slug);
        }
      });

      const variationKey = combo.map(c => c.termId).sort().join('-');
      const existingVar = variations.find(v => {
        const existingKey = Object.values(v.attributes).map(a => a.id).sort().join('-');
        return existingKey === variationKey;
      });

      return existingVar || {
        attributes,
        image_url: null,
        sku: `VAR-${skuParts.join('-')}`,
        regular_price: null,
        sale_price: null,
        stock_quantity: null,
        size_min: null,
        size_max: null,
      };
    });

    setVariations(newVariations);
    onChange(newVariations);
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
    return Object.values(variation.attributes).map(a => a.id).sort().join('-');
  };

  const getVariationLabel = (variation: Variation) => {
    return Object.values(variation.attributes).map(a => a.name).join(' - ');
  };

  const toggleExpanded = (key: string) => {
    setExpandedVariationKey(expandedVariationKey === key ? null : key);
  };

  const getColorForAttribute = (attrSlug: string, attributes: Variation['attributes']) => {
    const attrData = attributes[attrSlug];
    return attrData?.color_code || null;
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-semibold mb-1">Tous les produits ont des variations</p>
          <p>Sélectionnez les attributs (couleur, taille, etc.) pour générer automatiquement toutes les combinaisons possibles. Les champs image, prix, etc. des variations sont optionnels.</p>
        </div>
      </div>

      <div className="space-y-6">
        {allAttributes.map((attribute) => {
          const isColorAttribute = attribute.type === 'color' || attribute.slug.includes('couleur');

          return (
            <div key={attribute.id} className="space-y-4">
              {isColorAttribute && attribute.terms && attribute.terms.length > 0 ? (
                <HierarchicalColorSelector
                  terms={attribute.terms as any}
                  selectedTermIds={selectedAttributeTerms[attribute.slug] || []}
                  onToggle={(termId, termValue, termName) =>
                    toggleAttributeTerm(attribute.slug, termId, termValue, termName)
                  }
                />
              ) : (
                <div>
                  <Label className="text-lg font-semibold text-gray-900 mb-2 block">
                    {attribute.name}
                  </Label>
                  <p className="text-sm text-gray-600 mb-4">
                    Sélectionnez les {attribute.name.toLowerCase()} disponibles pour ce produit
                  </p>

                  <div className="grid gap-2 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
                    {attribute.terms?.map((term) => {
                      const isSelected = (selectedAttributeTerms[attribute.slug] || []).includes(term.id);
                      const hasColorCode = term.color_code !== null;

                      return (
                        <button
                          key={term.id}
                          type="button"
                          onClick={() => toggleAttributeTerm(attribute.slug, term.id, term.value, term.name)}
                          className={`flex items-center ${hasColorCode ? 'justify-between' : 'justify-center'} gap-2 px-2 md:px-4 py-2 md:py-3 rounded-lg border-2 transition-all min-w-0 ${
                            isSelected
                              ? "border-[#d4af37] bg-[#d4af37]/10 font-semibold"
                              : "border-gray-300 hover:border-[#d4af37] bg-white"
                          }`}
                        >
                          {hasColorCode && (
                            <div
                              className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-gray-300 flex-shrink-0"
                              style={{ backgroundColor: term.color_code || undefined }}
                            />
                          )}
                          <span className="text-xs md:text-sm font-medium text-gray-900 truncate flex-1 text-left min-w-0">
                            {term.name}
                          </span>
                          {isSelected && <Check className="h-4 w-4 md:h-5 md:w-5 text-[#d4af37] flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {variations.length > 0 && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>{variations.length}</strong> variation(s) générée(s) automatiquement à partir des attributs sélectionnés
            </p>
            <p className="text-xs text-blue-800 mt-1">
              Les champs image, prix, stock sont optionnels. Si non renseignés, les infos du produit de base seront utilisées.
            </p>
          </div>

          <div className="space-y-3">
            {variations.map((variation, index) => {
              const variationKey = getVariationKey(variation);
              const isExpanded = expandedVariationKey === variationKey;
              const firstColorAttr = Object.entries(variation.attributes).find(([_, v]) => v.color_code)?.[1];

              return (
                <Card key={variationKey} className="border-l-4 border-l-[#d4af37]">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        {firstColorAttr?.color_code && (
                          <div
                            className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-gray-300 flex-shrink-0"
                            style={{ backgroundColor: firstColorAttr.color_code }}
                          />
                        )}
                        <h3 className="text-sm md:text-lg font-semibold text-gray-900 truncate min-w-0">
                          {getVariationLabel(variation)}
                        </h3>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExpanded(variationKey)}
                        className="flex-shrink-0"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                        <div>
                          <Label>Image de la variation (optionnel)</Label>
                          <p className="text-xs text-gray-500 mb-2">Cette image apparaîtra dans la galerie du produit</p>
                          <ProductMediaSelector
                            currentImageUrl={variation.image_url || ""}
                            onSelect={(url) => updateVariation(index, "image_url", url)}
                          />
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label>Référence (UGS) (optionnel)</Label>
                            <Input
                              value={variation.sku}
                              onChange={(e) => updateVariation(index, "sku", e.target.value)}
                              placeholder="SKU-001"
                            />
                          </div>

                          <div>
                            <Label>Prix régulier (€) (optionnel)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={variation.regular_price || ""}
                              onChange={(e) =>
                                updateVariation(index, "regular_price", e.target.value ? parseFloat(e.target.value) : null)
                              }
                              placeholder="Utilisera le prix du produit"
                            />
                          </div>

                          <div>
                            <Label>Prix promo (€) (optionnel)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={variation.sale_price || ""}
                              onChange={(e) =>
                                updateVariation(index, "sale_price", e.target.value ? parseFloat(e.target.value) : null)
                              }
                              placeholder="Utilisera le prix promo du produit"
                            />
                          </div>

                          <div>
                            <Label>Stock (optionnel)</Label>
                            <Input
                              type="number"
                              value={variation.stock_quantity || ""}
                              onChange={(e) =>
                                updateVariation(index, "stock_quantity", e.target.value ? parseInt(e.target.value) : null)
                              }
                              placeholder="Utilisera le stock du produit"
                            />
                          </div>

                          <div>
                            <Label className="mb-2 flex items-center gap-2">
                              <span>Intervalle de tailles (pour badge Match)</span>
                              <Info className="h-4 w-4 text-gray-400" />
                            </Label>
                            <p className="text-xs text-gray-500 mb-3">
                              {(() => {
                                const tailleAttr = Object.entries(variation.attributes).find(([slug]) => slug === 'taille' || slug === 'size');
                                const tailleName = tailleAttr?.[1]?.name;
                                const isTailleUnique = tailleName?.toLowerCase().includes('unique');

                                if (isTailleUnique) {
                                  return "Taille Unique : Indiquez de quelle taille à quelle taille ce produit convient (ex: du 38 au 44)";
                                }

                                const tailleValue = parseInt(tailleAttr?.[1]?.name || '0');
                                if (!isNaN(tailleValue) && tailleValue > 0) {
                                  return `Taille ${tailleValue} : Les valeurs ont été pré-remplies automatiquement. Modifiez si nécessaire.`;
                                }

                                return "Définissez l'intervalle de tailles pour afficher le badge Match aux clientes";
                              })()}
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs text-gray-600">De (taille min)</Label>
                                <Input
                                  type="number"
                                  value={variation.size_min || ""}
                                  onChange={(e) =>
                                    updateVariation(index, "size_min", e.target.value ? parseInt(e.target.value) : null)
                                  }
                                  placeholder="Ex: 38"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600">À (taille max)</Label>
                                <Input
                                  type="number"
                                  value={variation.size_max || ""}
                                  onChange={(e) =>
                                    updateVariation(index, "size_max", e.target.value ? parseInt(e.target.value) : null)
                                  }
                                  placeholder="Ex: 42"
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            {variation.size_min && variation.size_max && (
                              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                Convient aux tailles {variation.size_min} à {variation.size_max}
                              </p>
                            )}
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
