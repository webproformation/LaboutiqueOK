'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check } from 'lucide-react';

interface Attribute {
  id: string;
  name: string;
  slug: string;
  type: 'select' | 'color' | 'button' | 'text';
  order_by: number;
}

interface AttributeTerm {
  id: string;
  attribute_id: string;
  name: string;
  slug: string;
  value: string | null;
  color_code?: string | null;
  order_by: number;
}

export interface ProductAttribute {
  attribute_id: string;
  term_ids: string[];
}

interface ProductAttributesManagerProps {
  productId: string;
  value: ProductAttribute[];
  onChange: (attributes: ProductAttribute[]) => void;
}

export default function ProductAttributesManager({
  productId,
  value = [],
  onChange
}: ProductAttributesManagerProps) {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [terms, setTerms] = useState<Record<string, AttributeTerm[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttributes();
  }, []);

  const loadAttributes = async () => {
    try {
      const { data: attributesData } = await supabase
        .from('product_attributes')
        .select('*')
        .eq('is_visible', true)
        .order('order_by');

      setAttributes(attributesData || []);

      const termsData: Record<string, AttributeTerm[]> = {};
      for (const attr of attributesData || []) {
        const { data: termData } = await supabase
          .from('product_attribute_terms')
          .select('*')
          .eq('attribute_id', attr.id)
          .eq('is_active', true)
          .order('order_by');

        termsData[attr.id] = termData || [];
      }
      setTerms(termsData);
    } catch (error) {
      console.error('Error loading attributes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTermToggle = (attributeId: string, termId: string) => {
    const existingAttr = value.find(a => a.attribute_id === attributeId);

    if (existingAttr) {
      if (existingAttr.term_ids.includes(termId)) {
        const newTermIds = existingAttr.term_ids.filter(id => id !== termId);
        if (newTermIds.length === 0) {
          onChange(value.filter(a => a.attribute_id !== attributeId));
        } else {
          onChange(value.map(a => a.attribute_id === attributeId ? { ...a, term_ids: newTermIds } : a));
        }
      } else {
        onChange(value.map(a => a.attribute_id === attributeId ? { ...a, term_ids: [...a.term_ids, termId] } : a));
      }
    } else {
      onChange([...value, { attribute_id: attributeId, term_ids: [termId] }]);
    }
  };

  const isTermSelected = (attributeId: string, termId: string): boolean => {
    const attr = value.find(a => a.attribute_id === attributeId);
    return attr ? attr.term_ids.includes(termId) : false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-[#b8933d]" />
      </div>
    );
  }

  if (attributes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Aucun attribut disponible</p>
        <p className="text-sm">Créez des attributs dans la section configuration</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {attributes.map((attribute) => {
        const attributeTerms = terms[attribute.id] || [];

        if (attributeTerms.length === 0) return null;

        return (
          <div key={attribute.id} className="space-y-3">
            <Label className="text-base font-semibold">{attribute.name}</Label>

            {attribute.type === 'color' ? (
              <div className="flex flex-wrap gap-3">
                {attributeTerms.map((term) => {
                  const selected = isTermSelected(attribute.id, term.id);
                  const bgColor = term.color_code || term.value || '#CCCCCC';

                  return (
                    <button
                      key={term.id}
                      type="button"
                      onClick={() => handleTermToggle(attribute.id, term.id)}
                      className="relative group"
                      title={term.name}
                    >
                      <div
                        className={`w-14 h-14 rounded-full border-3 transition-all shadow-md ${
                          selected
                            ? 'border-[#C6A15B] ring-4 ring-[#C6A15B]/30 scale-110'
                            : 'border-gray-300 hover:border-gray-500'
                        }`}
                        style={{ backgroundColor: bgColor }}
                      >
                        {selected && (
                          <Check className="w-6 h-6 text-white absolute inset-0 m-auto" strokeWidth={3} />
                        )}
                      </div>
                      <p className="text-xs text-center mt-1">{term.name}</p>
                    </button>
                  );
                })}
              </div>
            ) : attribute.type === 'button' ? (
              <div className="flex flex-wrap gap-3">
                {attributeTerms.map((term) => {
                  const selected = isTermSelected(attribute.id, term.id);

                  return (
                    <Button
                      key={term.id}
                      type="button"
                      variant={selected ? 'default' : 'outline'}
                      size="lg"
                      onClick={() => handleTermToggle(attribute.id, term.id)}
                      className={selected ? 'bg-[#C6A15B] text-white hover:bg-[#b8933d]' : ''}
                    >
                      {term.name}
                      {selected && <Check className="ml-2 w-5 h-5" />}
                    </Button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {attributeTerms.map((term) => {
                  const selected = isTermSelected(attribute.id, term.id);

                  return (
                    <Badge
                      key={term.id}
                      variant={selected ? 'default' : 'outline'}
                      className={`cursor-pointer px-4 py-2 ${
                        selected ? 'bg-[#C6A15B] text-white hover:bg-[#b8933d]' : ''
                      }`}
                      onClick={() => handleTermToggle(attribute.id, term.id)}
                    >
                      {selected && <Check className="w-3 h-3 mr-1" />}
                      {term.name}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
