'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import MediaLibrary from '@/components/MediaLibrary';
import { X, ImageIcon } from 'lucide-react';

interface VariationDetail {
  colorName: string;
  colorId: string;
  sku: string;
  regular_price: number | null;
  sale_price: number | null;
  stock_quantity: number | null;
  image_url: string | null;
}

interface VariationDetailsFormProps {
  selectedSecondaryColors: string[];
  secondaryColorIds: Record<string, string>;
  variations: VariationDetail[];
  onVariationUpdate: (colorName: string, field: keyof VariationDetail, value: any) => void;
  defaultRegularPrice?: number;
  defaultSalePrice?: number | null;
  defaultStock?: number;
}

export default function VariationDetailsForm({
  selectedSecondaryColors,
  secondaryColorIds,
  variations,
  onVariationUpdate,
  defaultRegularPrice = 0,
  defaultSalePrice = null,
  defaultStock = 0,
}: VariationDetailsFormProps) {
  const [activeVariation, setActiveVariation] = useState<string | null>(null);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [currentEditingColor, setCurrentEditingColor] = useState<string>('');

  useEffect(() => {
    console.log('[VariationDetailsForm] selectedSecondaryColors changed:', selectedSecondaryColors);
    console.log('[VariationDetailsForm] secondaryColorIds:', secondaryColorIds);
    console.log('[VariationDetailsForm] variations:', variations);

    if (selectedSecondaryColors.length === 1) {
      setActiveVariation(selectedSecondaryColors[0]);
    }
  }, [selectedSecondaryColors, secondaryColorIds, variations]);

  if (selectedSecondaryColors.length === 0) {
    console.log('[VariationDetailsForm] No secondary colors selected, not rendering');
    return null;
  }

  console.log('[VariationDetailsForm] Rendering with', selectedSecondaryColors.length, 'secondary colors');

  const getVariation = (colorName: string): VariationDetail => {
    const existing = variations.find(v => v.colorName === colorName);
    if (existing) return existing;

    return {
      colorName,
      colorId: secondaryColorIds[colorName] || '',
      sku: '',
      regular_price: defaultRegularPrice || null,
      sale_price: defaultSalePrice,
      stock_quantity: defaultStock || null,
      image_url: null,
    };
  };

  const handleFieldChange = (colorName: string, field: keyof VariationDetail, value: any) => {
    onVariationUpdate(colorName, field, value);
  };

  const handleImageSelect = (url: string) => {
    if (currentEditingColor) {
      handleFieldChange(currentEditingColor, 'image_url', url);
      setShowMediaLibrary(false);
      setCurrentEditingColor('');
    }
  };

  const openMediaLibrary = (colorName: string) => {
    setCurrentEditingColor(colorName);
    setShowMediaLibrary(true);
  };

  const removeImage = (colorName: string) => {
    handleFieldChange(colorName, 'image_url', null);
  };

  return (
    <>
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="text-purple-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Détails des Variations
          </CardTitle>
          <CardDescription className="text-purple-700">
            Configurez les détails spécifiques pour chaque nuance de couleur sélectionnée
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap mb-4">
            {selectedSecondaryColors.map(colorName => {
              const isActive = activeVariation === colorName;
              const variation = getVariation(colorName);
              const hasData = variation.sku || variation.image_url ||
                             variation.regular_price !== defaultRegularPrice ||
                             variation.stock_quantity !== defaultStock;

              return (
                <Button
                  key={colorName}
                  type="button"
                  variant={isActive ? "default" : "outline"}
                  onClick={() => setActiveVariation(colorName)}
                  className={`
                    relative
                    ${isActive
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-white hover:bg-purple-50 text-purple-900'
                    }
                    ${hasData ? 'ring-2 ring-green-500' : ''}
                  `}
                >
                  {colorName}
                  {hasData && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </Button>
              );
            })}
          </div>

          {activeVariation && (
            <div className="space-y-4 bg-white p-6 rounded-lg border-2 border-purple-300 shadow-md">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">
                Configuration : {activeVariation}
              </h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor={`var-image-${activeVariation}`} className="text-gray-900 font-medium">
                    Image de la Variation
                  </Label>
                  <div className="mt-2">
                    {getVariation(activeVariation).image_url ? (
                      <div className="relative inline-block">
                        <img
                          src={getVariation(activeVariation).image_url!}
                          alt={activeVariation}
                          className="w-32 h-32 object-cover rounded-lg border-2 border-purple-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(activeVariation)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => openMediaLibrary(activeVariation)}
                        className="border-dashed border-2 border-purple-300 hover:border-purple-500"
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Sélectionner une image
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`var-sku-${activeVariation}`} className="text-gray-900 font-medium">
                      SKU / UGS
                    </Label>
                    <Input
                      id={`var-sku-${activeVariation}`}
                      type="text"
                      value={getVariation(activeVariation).sku}
                      onChange={(e) => handleFieldChange(activeVariation, 'sku', e.target.value)}
                      placeholder="Ex: PULL-VERT-KAKI-M"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`var-stock-${activeVariation}`} className="text-gray-900 font-medium">
                      Stock Disponible *
                    </Label>
                    <Input
                      id={`var-stock-${activeVariation}`}
                      type="number"
                      min="0"
                      value={getVariation(activeVariation).stock_quantity || 0}
                      onChange={(e) => handleFieldChange(activeVariation, 'stock_quantity', parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`var-regular-${activeVariation}`} className="text-gray-900 font-medium">
                      Prix Régulier (€)
                      <span className="text-xs text-gray-500 ml-2">(Laisser vide = prix produit)</span>
                    </Label>
                    <Input
                      id={`var-regular-${activeVariation}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={getVariation(activeVariation).regular_price || ''}
                      onChange={(e) => handleFieldChange(
                        activeVariation,
                        'regular_price',
                        e.target.value ? parseFloat(e.target.value) : null
                      )}
                      placeholder={`${defaultRegularPrice}€`}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`var-sale-${activeVariation}`} className="text-gray-900 font-medium">
                      Prix Promo (€)
                      <span className="text-xs text-gray-500 ml-2">(Optionnel)</span>
                    </Label>
                    <Input
                      id={`var-sale-${activeVariation}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={getVariation(activeVariation).sale_price || ''}
                      onChange={(e) => handleFieldChange(
                        activeVariation,
                        'sale_price',
                        e.target.value ? parseFloat(e.target.value) : null
                      )}
                      placeholder="Prix en promotion"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded">
                  <p className="text-sm text-purple-900">
                    <strong>Aperçu :</strong> Cette variation sera créée avec les informations ci-dessus.
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedSecondaryColors.length > 1 && !activeVariation && (
            <div className="text-center text-gray-500 py-4">
              Sélectionnez une nuance ci-dessus pour configurer ses détails
            </div>
          )}
        </CardContent>
      </Card>

      {showMediaLibrary && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Sélectionner une image</h2>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowMediaLibrary(false);
                  setCurrentEditingColor('');
                }}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6">
              <MediaLibrary onSelect={handleImageSelect} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
