'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface AttributeTerm {
  id: string;
  name: string;
  slug: string;
  value: string;
}

interface ProductAttribute {
  id: string;
  name: string;
  slug: string;
  type: string;
  terms: AttributeTerm[];
}

interface GeneralAttributesSelectorProps {
  selectedAttributes: Record<string, string[]>;
  onAttributesChange: (attributes: Record<string, string[]>) => void;
}

export default function GeneralAttributesSelector({
  selectedAttributes,
  onAttributesChange,
}: GeneralAttributesSelectorProps) {
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttributes();
  }, []);

  const loadAttributes = async () => {
    try {
      const { data: attributesData, error: attrError } = await supabase
        .from('product_attributes')
        .select('*')
        .not('slug', 'ilike', '%couleur%')
        .not('slug', 'ilike', '%color%')
        .order('name');

      if (attrError) throw attrError;

      if (attributesData) {
        const attributesWithTerms = await Promise.all(
          attributesData.map(async (attr) => {
            const { data: termsData, error: termsError } = await supabase
              .from('product_attribute_terms')
              .select('id, name, slug, value')
              .eq('attribute_id', attr.id)
              .is('parent_id', null)
              .order('order_by');

            if (termsError) {
              console.error(`Error loading terms for ${attr.name}:`, termsError);
              return { ...attr, terms: [] };
            }

            return { ...attr, terms: termsData || [] };
          })
        );

        setAttributes(attributesWithTerms.filter(attr => attr.terms.length > 0));
      }
    } catch (error) {
      console.error('Error loading attributes:', error);
      toast.error('Erreur lors du chargement des attributs');
    } finally {
      setLoading(false);
    }
  };

  const handleTermToggle = (attributeId: string, termName: string) => {
    const currentTerms = selectedAttributes[attributeId] || [];
    const newTerms = currentTerms.includes(termName)
      ? currentTerms.filter(t => t !== termName)
      : [...currentTerms, termName];

    const newAttributes = { ...selectedAttributes };
    if (newTerms.length === 0) {
      delete newAttributes[attributeId];
    } else {
      newAttributes[attributeId] = newTerms;
    }

    onAttributesChange(newAttributes);
  };

  const getSelectedCount = () => {
    return Object.keys(selectedAttributes).length;
  };

  const getTotalSelectedTerms = () => {
    return Object.values(selectedAttributes).reduce((sum, terms) => sum + terms.length, 0);
  };

  if (loading) {
    return (
      <Card className="bg-white">
        <CardContent className="py-8">
          <p className="text-center text-gray-500">Chargement des attributs...</p>
        </CardContent>
      </Card>
    );
  }

  if (attributes.length === 0) {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-[#d4af37]">Attributs du Produit</CardTitle>
          <CardDescription>
            Aucun attribut disponible. Créez des attributs dans la gestion des attributs.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-[#d4af37]">Attributs du Produit</CardTitle>
        <CardDescription>
          Sélectionnez les caractéristiques qui décrivent ce produit (matière, coupe, saison, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {attributes.map((attribute) => {
          const selectedTermsForAttr = selectedAttributes[attribute.id] || [];

          return (
            <div key={attribute.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold text-gray-900">
                  {attribute.name}
                  {selectedTermsForAttr.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedTermsForAttr.length}
                    </Badge>
                  )}
                </Label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {attribute.terms.map((term) => {
                  const isSelected = selectedTermsForAttr.includes(term.name);

                  return (
                    <div
                      key={term.id}
                      className={`
                        flex items-center space-x-2 p-3 rounded-lg border-2 transition-all cursor-pointer
                        ${isSelected
                          ? 'border-[#d4af37] bg-amber-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                      onClick={() => handleTermToggle(attribute.id, term.name)}
                    >
                      <Checkbox
                        id={`term-${term.id}`}
                        checked={isSelected}
                        onCheckedChange={() => handleTermToggle(attribute.id, term.name)}
                      />
                      <Label
                        htmlFor={`term-${term.id}`}
                        className="cursor-pointer text-sm flex-1"
                      >
                        {term.name}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {getTotalSelectedTerms() > 0 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-900 font-medium">
              {getTotalSelectedTerms()} attribut(s) sélectionné(s) dans {getSelectedCount()} catégorie(s)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
