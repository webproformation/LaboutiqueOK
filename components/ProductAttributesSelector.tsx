"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface AttributeTerm {
  id: string;
  name: string;
  slug: string;
  color_code: string | null;
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

interface ProductAttributesSelectorProps {
  selectedTerms: Record<string, string[]>;
  onChange: (selectedTerms: Record<string, string[]>) => void;
}

export default function ProductAttributesSelector({
  selectedTerms,
  onChange,
}: ProductAttributesSelectorProps) {
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttributes();
  }, []);

  const loadAttributes = async () => {
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
          terms: (attr.product_attribute_terms || []).sort((a: any, b: any) =>
            (a.order_by || 0) - (b.order_by || 0)
          )
        }));
        setAttributes(formatted as any);
      }
    } catch (error) {
      console.error("Error loading attributes:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTerm = (attributeSlug: string, termId: string) => {
    const currentTerms = selectedTerms[attributeSlug] || [];
    const newTerms = currentTerms.includes(termId)
      ? currentTerms.filter(id => id !== termId)
      : [...currentTerms, termId];

    onChange({
      ...selectedTerms,
      [attributeSlug]: newTerms
    });
  };

  const isTermSelected = (attributeSlug: string, termId: string): boolean => {
    return (selectedTerms[attributeSlug] || []).includes(termId);
  };

  const getSelectedCount = (attributeSlug: string): number => {
    return (selectedTerms[attributeSlug] || []).length;
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">Chargement des attributs...</p>
      </div>
    );
  }

  if (attributes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
        <p className="text-sm">Aucun attribut disponible</p>
        <p className="text-xs mt-1">Ajoutez des attributs dans la section Attributs Produits</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {attributes.map(attribute => {
        const selectedCount = getSelectedCount(attribute.slug);

        return (
          <Card key={attribute.id} className="border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{attribute.name}</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Sélectionnez les {attribute.name.toLowerCase()} disponibles pour ce produit
                  </CardDescription>
                </div>
                {selectedCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {attribute.terms && attribute.terms.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {attribute.terms.map(term => {
                    const isSelected = isTermSelected(attribute.slug, term.id);

                    return (
                      <Button
                        key={term.id}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className={`
                          ${isSelected
                            ? 'bg-[#d4af37] hover:bg-[#b8933d] text-white border-[#d4af37]'
                            : 'hover:border-[#d4af37] hover:text-[#d4af37]'
                          }
                        `}
                        onClick={() => toggleTerm(attribute.slug, term.id)}
                      >
                        {isSelected && <Check className="h-3 w-3 mr-1" />}

                        {term.color_code && (
                          <span
                            className="inline-block w-4 h-4 rounded-full border border-gray-300 mr-2"
                            style={{ backgroundColor: term.color_code }}
                          />
                        )}

                        <span>{term.name}</span>

                        {term.value && term.value !== term.name && (
                          <span className="ml-1 text-xs opacity-70">
                            ({term.value})
                          </span>
                        )}
                      </Button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Aucun terme disponible pour cet attribut
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
