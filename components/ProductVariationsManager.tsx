"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { X, Plus, Image as ImageIcon } from 'lucide-react';
import WordPressMediaSelector from '@/components/WordPressMediaSelector';

interface ProductAttribute {
  name: string;
  options: string[];
  visible: boolean;
  variation: boolean;
}

export interface ProductVariation {
  id?: number;
  attributes: Record<string, string>;
  regular_price: string;
  sale_price: string;
  stock_quantity: number | null;
  manage_stock: boolean;
  image_id: number;
  image_url: string;
  sku: string;
  enabled: boolean;
}

interface ProductVariationsManagerProps {
  attributes: ProductAttribute[];
  variations: ProductVariation[];
  onChange: (variations: ProductVariation[]) => void;
}

export default function ProductVariationsManager({
  attributes,
  variations,
  onChange
}: ProductVariationsManagerProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const variationAttributes = attributes.filter(attr => attr.variation);

  const generateVariations = () => {
    if (variationAttributes.length === 0) {
      return;
    }

    const combinations: Record<string, string>[] = [];

    const generateCombinations = (index: number, current: Record<string, string>) => {
      if (index === variationAttributes.length) {
        combinations.push({ ...current });
        return;
      }

      const attr = variationAttributes[index];
      for (const option of attr.options) {
        current[attr.name] = option;
        generateCombinations(index + 1, current);
      }
    };

    generateCombinations(0, {});

    const newVariations = combinations.map(attrs => ({
      attributes: attrs,
      regular_price: '',
      sale_price: '',
      stock_quantity: 0,
      manage_stock: true,
      image_id: 0,
      image_url: '',
      sku: '',
      enabled: true,
    }));

    onChange(newVariations);
  };

  const handleUpdateVariation = (index: number, field: keyof ProductVariation, value: any) => {
    const newVariations = [...variations];
    newVariations[index] = { ...newVariations[index], [field]: value };
    onChange(newVariations);
  };

  const handleRemoveVariation = (index: number) => {
    const newVariations = variations.filter((_, i) => i !== index);
    onChange(newVariations);
  };

  const getVariationLabel = (variation: ProductVariation) => {
    if (!variation.attributes || typeof variation.attributes !== 'object') {
      return 'Variation sans attributs';
    }

    if (Array.isArray(variation.attributes)) {
      return variation.attributes
        .map(attr => `${attr.name}: ${attr.option}`)
        .join(' - ');
    }

    return Object.entries(variation.attributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(' - ');
  };

  if (variationAttributes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Aucun attribut configuré pour les variations.</p>
        <p className="text-sm mt-2">
          Ajoutez des attributs et activez "Utilisé pour les variations" pour créer des variantes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {variations.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            Générez automatiquement toutes les combinaisons possibles de variations
          </p>
          <Button type="button" onClick={generateVariations} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Générer les variations
          </Button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {variations.length} variation(s) créée(s)
            </p>
            <Button
              type="button"
              onClick={generateVariations}
              variant="outline"
              size="sm"
            >
              Régénérer les variations
            </Button>
          </div>

          <div className="space-y-3">
            {variations.map((variation, index) => (
              <Card key={index} className={!variation.enabled ? 'opacity-60' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Switch
                        checked={variation.enabled}
                        onCheckedChange={(checked) =>
                          handleUpdateVariation(index, 'enabled', checked)
                        }
                      />
                      <CardTitle
                        className="text-base cursor-pointer hover:text-blue-600"
                        onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                      >
                        {getVariationLabel(variation)}
                      </CardTitle>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveVariation(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>

                {expandedIndex === index && (
                  <CardContent className="pt-0 space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Image de la variation
                      </Label>
                      <WordPressMediaSelector
                        selectedImage={variation.image_url}
                        onSelect={(url, id) => {
                          handleUpdateVariation(index, 'image_url', url);
                          handleUpdateVariation(index, 'image_id', id);
                        }}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`sku-${index}`}>SKU</Label>
                      <Input
                        id={`sku-${index}`}
                        value={variation.sku || ''}
                        onChange={(e) => handleUpdateVariation(index, 'sku', e.target.value)}
                        placeholder="SKU unique pour cette variation"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`regular_price-${index}`}>Prix normal (€)</Label>
                        <Input
                          id={`regular_price-${index}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={variation.regular_price || ''}
                          onChange={(e) =>
                            handleUpdateVariation(index, 'regular_price', e.target.value)
                          }
                          placeholder="55.99"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`sale_price-${index}`}>Prix promo (€)</Label>
                        <Input
                          id={`sale_price-${index}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={variation.sale_price || ''}
                          onChange={(e) =>
                            handleUpdateVariation(index, 'sale_price', e.target.value)
                          }
                          placeholder="50.00"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={variation.manage_stock}
                          onCheckedChange={(checked) =>
                            handleUpdateVariation(index, 'manage_stock', checked)
                          }
                        />
                        <Label>Gérer le stock</Label>
                      </div>
                      {variation.manage_stock && (
                        <div>
                          <Label htmlFor={`stock-${index}`}>Quantité en stock</Label>
                          <Input
                            id={`stock-${index}`}
                            type="number"
                            value={variation.stock_quantity || ''}
                            onChange={(e) =>
                              handleUpdateVariation(
                                index,
                                'stock_quantity',
                                parseInt(e.target.value) || 0
                              )
                            }
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
