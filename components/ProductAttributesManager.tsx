"use client";

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader as Loader2, Check, CircleAlert as AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';

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
  order_by: number;
}

interface ProductAttribute {
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
  value = [], // Protection: valeur par défaut
  onChange
}: ProductAttributesManagerProps) {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [terms, setTerms] = useState<Record<string, AttributeTerm[]>>({});
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      loadAttributes();
    }
  }, [mounted]);

  const loadAttributes = async () => {
    if (!supabase) {
      console.error('[AttributesManager] No Supabase client');
      setError('Client Supabase non disponible');
      setLoading(false);
      return;
    }

    try {
      setError(null);

      // Charger les attributs
      const { data: attributesData, error: attrError } = await supabase
        .from('product_attributes')
        .select('*')
        .eq('is_visible', true)
        .order('order_by', { ascending: true });

      if (attrError) {
        console.error('[AttributesManager] Error loading attributes:', attrError);
        // Ne pas throw, juste logger
        setError('Impossible de charger les attributs');
        setAttributes([]);
        setTerms({});
        setLoading(false);
        return;
      }

      // Protection: si pas de données ou tableau vide
      if (!attributesData || attributesData.length === 0) {
        console.log('[AttributesManager] No attributes found in database');
        setAttributes([]);
        setTerms({});
        setLoading(false);
        return;
      }

      setAttributes(attributesData);

      // Charger les termes pour chaque attribut
      const termsData: Record<string, AttributeTerm[]> = {};

      for (const attr of attributesData) {
        try {
          const { data: termData, error: termError } = await supabase
            .from('product_attribute_terms')
            .select('*')
            .eq('attribute_id', attr.id)
            .eq('is_active', true)
            .order('order_by', { ascending: true });

          if (!termError && termData && termData.length > 0) {
            termsData[attr.id] = termData;
          } else {
            // Pas de termes pour cet attribut
            termsData[attr.id] = [];
          }
        } catch (termErr) {
          console.error(`[AttributesManager] Error loading terms for ${attr.name}:`, termErr);
          termsData[attr.id] = [];
        }
      }

      setTerms(termsData);
    } catch (error) {
      console.error('[AttributesManager] Critical error:', error);
      setError('Erreur lors du chargement des attributs');
      setAttributes([]);
      setTerms({});
    } finally {
      setLoading(false);
    }
  };

  const handleTermToggle = (attributeId: string, termId: string) => {
    // Protection: s'assurer que value est un tableau
    const safeValue = Array.isArray(value) ? value : [];
    const existingAttr = safeValue.find(a => a.attribute_id === attributeId);

    if (existingAttr) {
      // Si le terme est déjà sélectionné, le retirer
      if (existingAttr.term_ids.includes(termId)) {
        const newTermIds = existingAttr.term_ids.filter(id => id !== termId);

        // Si plus de termes, retirer l'attribut complètement
        if (newTermIds.length === 0) {
          onChange(safeValue.filter(a => a.attribute_id !== attributeId));
        } else {
          onChange(
            safeValue.map(a =>
              a.attribute_id === attributeId
                ? { ...a, term_ids: newTermIds }
                : a
            )
          );
        }
      } else {
        // Ajouter le terme
        onChange(
          safeValue.map(a =>
            a.attribute_id === attributeId
              ? { ...a, term_ids: [...a.term_ids, termId] }
              : a
          )
        );
      }
    } else {
      // Créer un nouvel attribut avec ce terme
      onChange([...safeValue, { attribute_id: attributeId, term_ids: [termId] }]);
    }
  };

  const isTermSelected = (attributeId: string, termId: string): boolean => {
    // Protection: s'assurer que value est un tableau
    const safeValue = Array.isArray(value) ? value : [];
    const attr = safeValue.find(a => a.attribute_id === attributeId);
    return attr ? attr.term_ids.includes(termId) : false;
  };

  // Protection hydration
  if (!mounted) return null;

  // Affichage pendant le chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-gray-500">Chargement des attributs...</span>
      </div>
    );
  }

  // Affichage si erreur critique
  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-700 mb-2">{error}</p>
        <p className="text-xs text-gray-500 mb-4">
          Les attributs ne sont pas disponibles pour le moment.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={loadAttributes}
        >
          Réessayer
        </Button>
      </div>
    );
  }

  // Affichage si aucun attribut configuré
  if (attributes.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
        <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-600 mb-1">Aucun attribut disponible</p>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          Les attributs (Couleur, Taille, etc.) doivent être créés dans la base de données Supabase
          (tables <code className="bg-gray-200 px-1 rounded">product_attributes</code> et{' '}
          <code className="bg-gray-200 px-1 rounded">product_attribute_terms</code>).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {attributes.map((attribute) => {
        const attributeTerms = terms[attribute.id] || [];

        if (attributeTerms.length === 0) {
          // Afficher l'attribut mais indiquer qu'il n'a pas de termes
          return (
            <div key={attribute.id} className="space-y-3">
              <Label className="text-base font-semibold">{attribute.name}</Label>
              <div className="text-sm text-gray-500 italic border border-dashed border-gray-300 rounded p-3 bg-gray-50">
                Aucun terme disponible pour cet attribut
              </div>
            </div>
          );
        }

        return (
          <div key={attribute.id} className="space-y-3">
            <Label className="text-base font-semibold">{attribute.name}</Label>

            {/* AFFICHAGE EN FONCTION DU TYPE */}
            {attribute.type === 'color' ? (
              // Pastilles colorées pour les couleurs
              <div className="flex flex-wrap gap-2">
                {attributeTerms.map((term) => {
                  const selected = isTermSelected(attribute.id, term.id);
                  const bgColor = term.value || '#CCCCCC';

                  return (
                    <button
                      key={term.id}
                      type="button"
                      onClick={() => handleTermToggle(attribute.id, term.id)}
                      className="relative group"
                      title={term.name}
                    >
                      <div
                        className={`w-12 h-12 rounded-full border-2 transition-all ${
                          selected
                            ? 'border-blue-600 ring-2 ring-blue-200'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: bgColor }}
                      >
                        {selected && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white drop-shadow-md" />
                          </div>
                        )}
                      </div>
                      <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        {term.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : attribute.type === 'button' ? (
              // Chips larges pour les tailles (optimisé mobile)
              <div className="flex flex-wrap gap-2">
                {attributeTerms.map((term) => {
                  const selected = isTermSelected(attribute.id, term.id);

                  return (
                    <Button
                      key={term.id}
                      type="button"
                      variant={selected ? 'default' : 'outline'}
                      size="lg"
                      onClick={() => handleTermToggle(attribute.id, term.id)}
                      className={`min-w-[80px] font-semibold ${
                        selected
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {term.name}
                    </Button>
                  );
                })}
              </div>
            ) : (
              // Badges pour les autres types
              <div className="flex flex-wrap gap-2">
                {attributeTerms.map((term) => {
                  const selected = isTermSelected(attribute.id, term.id);

                  return (
                    <Badge
                      key={term.id}
                      variant={selected ? 'default' : 'outline'}
                      className="cursor-pointer px-4 py-2 text-sm"
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

      {/* Résumé des sélections */}
      {Array.isArray(value) && value.length > 0 && (
        <div className="pt-4 border-t">
          <p className="text-sm text-gray-600 mb-2">Sélection actuelle:</p>
          <div className="flex flex-wrap gap-2">
            {value.map((attr) => {
              const attribute = attributes.find(a => a.id === attr.attribute_id);
              if (!attribute) return null;

              const selectedTerms = attr.term_ids
                .map(termId => terms[attr.attribute_id]?.find(t => t.id === termId))
                .filter(Boolean);

              if (selectedTerms.length === 0) return null;

              return (
                <div key={attr.attribute_id} className="text-xs text-gray-700">
                  <strong>{attribute.name}:</strong>{' '}
                  {selectedTerms.map(t => t?.name).join(', ')}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
