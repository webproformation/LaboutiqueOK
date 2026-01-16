'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import { toast } from 'sonner';

interface ColorTerm {
  id: string;
  name: string;
  slug: string;
  color_code: string | null;
  parent_id?: string | null;
}

interface ColorFamily {
  id: string;
  name: string;
  color_code: string | null;
  children: ColorTerm[];
}

interface ColorSwatchSelectorProps {
  selectedMainColor?: string;
  selectedSecondaryColors?: string[];
  onMainColorSelect: (colorName: string, colorId: string) => void;
  onSecondaryColorToggle?: (colorName: string, colorId: string, selected: boolean) => void;
  showSecondaryColors?: boolean;
}

export default function ColorSwatchSelector({
  selectedMainColor,
  selectedSecondaryColors = [],
  onMainColorSelect,
  onSecondaryColorToggle,
  showSecondaryColors = true,
}: ColorSwatchSelectorProps) {
  const [colorFamilies, setColorFamilies] = useState<ColorFamily[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFamily, setSelectedFamily] = useState<ColorFamily | null>(null);

  useEffect(() => {
    loadColorFamilies();
  }, []);

  useEffect(() => {
    if (selectedMainColor && colorFamilies.length > 0) {
      const family = colorFamilies.find(f => f.name === selectedMainColor);
      if (family) {
        setSelectedFamily(family);
      }
    }
  }, [selectedMainColor, colorFamilies]);

  const loadColorFamilies = async () => {
    try {
      const { data: colorAttr, error: attrError } = await supabase
        .from('product_attributes')
        .select('id')
        .or('slug.eq.couleur,slug.ilike.%couleur%,name.ilike.%couleur%')
        .maybeSingle();

      if (attrError) throw attrError;

      if (!colorAttr) {
        toast.error('Attribut Couleur introuvable');
        return;
      }

      const { data: allTerms, error: termsError } = await supabase
        .from('product_attribute_terms')
        .select('id, name, slug, color_code, parent_id')
        .eq('attribute_id', colorAttr.id)
        .order('order_by');

      if (termsError) throw termsError;

      if (allTerms) {
        console.log('[ColorSwatchSelector] All terms loaded:', allTerms.length);
        console.log('[ColorSwatchSelector] Sample term:', allTerms[0]);

        const validTerms = allTerms.filter(t => t.name && t.name.trim());
        console.log('[ColorSwatchSelector] Valid terms:', validTerms.length);

        const parentTerms = validTerms.filter(t => !t.parent_id);
        const childTerms = validTerms.filter(t => t.parent_id);
        console.log('[ColorSwatchSelector] Parent terms (parent_id = null):', parentTerms.length);
        console.log('[ColorSwatchSelector] Child terms (parent_id != null):', childTerms.length);

        console.log('[ColorSwatchSelector] Parent terms list:', parentTerms.map(p => p.name));

        const grisTerms = validTerms.filter(t => t.name.toLowerCase().includes('gris'));
        if (grisTerms.length > 0) {
          console.log('[ColorSwatchSelector] GRIS ANALYSIS:');
          grisTerms.forEach(t => {
            console.log(`  - ${t.name}: parent_id = ${t.parent_id || 'NULL'} => ${t.parent_id ? 'CHILD (nuance)' : 'PARENT (main grid)'}`);
          });
        }

        const families: ColorFamily[] = parentTerms.map(parent => {
          const children = validTerms.filter(child => child.parent_id === parent.id);
          console.log(`[ColorSwatchSelector] Family "${parent.name}" has ${children.length} children`);
          return {
            id: parent.id,
            name: parent.name,
            color_code: parent.color_code,
            children
          };
        });

        console.log('[ColorSwatchSelector] Total families created:', families.length);
        setColorFamilies(families);
      }
    } catch (error) {
      console.error('Error loading color families:', error);
      toast.error('Erreur lors du chargement des couleurs');
    } finally {
      setLoading(false);
    }
  };

  const handleMainColorClick = (family: ColorFamily) => {
    if (selectedMainColor === family.name) {
      setSelectedFamily(null);
      onMainColorSelect('', '');
      if (onSecondaryColorToggle) {
        selectedSecondaryColors.forEach(colorName => {
          onSecondaryColorToggle(colorName, '', false);
        });
      }
    } else {
      setSelectedFamily(family);
      onMainColorSelect(family.name, family.id);
    }
  };

  const handleSecondaryColorClick = (color: ColorTerm) => {
    if (!onSecondaryColorToggle) return;

    const isSelected = selectedSecondaryColors.includes(color.name);
    onSecondaryColorToggle(color.name, color.id, !isSelected);
  };

  const getContrastColor = (hexColor: string | null): string => {
    if (!hexColor) return '#000000';

    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };

  if (loading) {
    return (
      <Card className="bg-white">
        <CardContent className="py-8">
          <p className="text-center text-gray-500">Chargement des couleurs...</p>
        </CardContent>
      </Card>
    );
  }

  if (colorFamilies.length > 0) {
    console.log('[ColorSwatchSelector RENDER] Colors to display in main grid:', colorFamilies.map(f => f.name));
    console.log('[ColorSwatchSelector RENDER] Number of colors in main grid:', colorFamilies.length);

    const grisColors = colorFamilies.filter(f => f.name.toLowerCase().includes('gris'));
    if (grisColors.length > 0) {
      console.log('[ColorSwatchSelector RENDER] Gris colors in main grid:', grisColors.map(f => f.name));
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-[#d4af37]">Couleur Principale *</CardTitle>
          <CardDescription>
            Sélectionnez la famille de couleur principale du produit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {colorFamilies.map((family) => {
              const isSelected = selectedMainColor === family.name;
              const bgColor = family.color_code || '#CCCCCC';
              const textColor = getContrastColor(bgColor);

              return (
                <button
                  key={family.id}
                  type="button"
                  onClick={() => handleMainColorClick(family)}
                  className={`
                    relative flex flex-col items-center justify-center
                    p-3 rounded-lg transition-all
                    ${isSelected
                      ? 'ring-4 ring-[#d4af37] ring-offset-2 shadow-lg'
                      : 'ring-2 ring-gray-200 hover:ring-gray-300 hover:shadow-md'
                    }
                  `}
                  style={{ backgroundColor: bgColor }}
                >
                  {isSelected && (
                    <div
                      className="absolute top-1 right-1 rounded-full p-0.5"
                      style={{ backgroundColor: textColor }}
                    >
                      <Check
                        className="w-3 h-3"
                        style={{ color: bgColor }}
                      />
                    </div>
                  )}
                  <span
                    className="text-xs font-medium text-center mt-auto"
                    style={{ color: textColor }}
                  >
                    {family.name}
                  </span>
                  {family.children.length > 0 && (
                    <span
                      className="text-[10px] opacity-75"
                      style={{ color: textColor }}
                    >
                      ({family.children.length} nuances)
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {colorFamilies.length === 0 && (
            <p className="text-center text-gray-500 py-4">
              Aucune couleur disponible. Créez des attributs de couleur dans la gestion des attributs.
            </p>
          )}
        </CardContent>
      </Card>

      {showSecondaryColors && selectedFamily && (
        <Card className="bg-white border-2 border-amber-200">
          <CardHeader>
            <CardTitle className="text-[#d4af37] flex items-center gap-2">
              Nuances de {selectedFamily.name}
              <span className="text-sm font-normal text-gray-500">
                (Optionnel - pour les variations)
              </span>
            </CardTitle>
            <CardDescription>
              Sélectionnez les nuances disponibles pour ce produit. Chaque nuance créera automatiquement une variation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {(() => {
                const parentAsShade: ColorTerm = {
                  id: selectedFamily.id,
                  name: selectedFamily.name,
                  slug: selectedFamily.name.toLowerCase().replace(/\s+/g, '-'),
                  color_code: selectedFamily.color_code,
                  parent_id: null
                };
                const allShades = [parentAsShade, ...selectedFamily.children];

                return allShades.map((shade) => {
                const isSelected = selectedSecondaryColors.includes(shade.name);
                const bgColor = shade.color_code || '#CCCCCC';
                const textColor = getContrastColor(bgColor);

                return (
                  <button
                    key={shade.id}
                    type="button"
                    onClick={() => handleSecondaryColorClick(shade)}
                    className={`
                      relative flex flex-col items-center justify-center
                      p-3 rounded-lg transition-all
                      ${isSelected
                        ? 'ring-4 ring-green-500 ring-offset-2 shadow-lg'
                        : 'ring-2 ring-gray-200 hover:ring-gray-300 hover:shadow-md'
                      }
                    `}
                    style={{ backgroundColor: bgColor }}
                  >
                    {isSelected && (
                      <div
                        className="absolute top-1 right-1 rounded-full p-0.5"
                        style={{ backgroundColor: textColor }}
                      >
                        <Check
                          className="w-3 h-3"
                          style={{ color: bgColor }}
                        />
                      </div>
                    )}
                    <span
                      className="text-xs font-medium text-center"
                      style={{ color: textColor }}
                    >
                      {shade.name}
                    </span>
                  </button>
                );
              });
              })()}
            </div>

            {selectedSecondaryColors.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-900 font-medium">
                  ✓ {selectedSecondaryColors.length} nuance(s) sélectionnée(s)
                </p>
                <p className="text-xs text-green-700 mt-1">
                  {selectedSecondaryColors.length} variation(s) seront créées automatiquement
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
