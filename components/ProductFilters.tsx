'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { X, Filter } from 'lucide-react';

interface FilterOption {
  id: string;
  name: string;
  slug: string;
  color_code?: string;
}

export interface FilterState {
  mySize: boolean; // Nouveau champ dédié
  sizes: string[];
  colors: string[];
  comfort: string[];
  coupe: string[];
  live: boolean;
  nouveautes: boolean;
}

interface ProductFiltersProps {
  categorySlug?: string;
  activeFilters: FilterState;
  availableTerms: Set<string>; // Nouvelle prop : liste des termes présents dans les produits
  onFiltersChange: (filters: FilterState) => void;
}

const FALLBACK_COLORS: Record<string, string> = {
  'blanc': '#FFFFFF', 'noir': '#000000', 'gris': '#808080', 'beige': '#F5F5DC',
  'marron': '#8B4513', 'rouge': '#FF0000', 'orange': '#FFA500', 'jaune': '#FFFF00',
  'vert': '#008000', 'bleu': '#0000FF', 'violet': '#800080', 'rose': '#FFC0CB',
  'or': '#FFD700', 'argent': '#C0C0C0', 'kaki': '#556B2F', 'marine': '#000080',
  'ciel': '#87CEEB', 'bordeaux': '#800000', 'fushia': '#FF00FF', 'camel': '#C19A6B',
  'multicolore': 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)',
  'métallisé': 'linear-gradient(to right, #C0C0C0, #808080)',
};

const MAIN_COLORS_WHITELIST = [
  'jaune', 'noir', 'blanc', 'orange', 'rouge', 'violet', 'gris', 'bleu', 
  'vert', 'marron', 'beige', 'multicolore', 'métallisé', 'autre', 'rose', 'or', 'argent'
];

export function ProductFilters({ categorySlug, activeFilters, availableTerms, onFiltersChange }: ProductFiltersProps) {
  const { profile } = useAuth();
  
  const [colorOptions, setColorOptions] = useState<FilterOption[]>([]);
  const [confortOptions, setConfortOptions] = useState<FilterOption[]>([]);
  const [coupeOptions, setCoupeOptions] = useState<FilterOption[]>([]);
  
  // Tailles standards à afficher
  const allSizes = ['34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54', 'TU'];
  
  // On filtre les tailles pour n'afficher que celles disponibles
  const visibleSizes = allSizes.filter(size => availableTerms.has(size.toLowerCase()));

  useEffect(() => {
    loadFilterOptions();
  }, [availableTerms]); // Recharger si les termes disponibles changent

  const loadFilterOptions = async () => {
    try {
      const { data: attributes } = await supabase.from('product_attributes').select('id, name, slug');
      if (!attributes) return;

      const confortAttr = attributes.find(a => a.slug.includes('confort') || a.name.toLowerCase().includes('confort'));
      const coupeAttr = attributes.find(a => a.slug.includes('coupe') || a.name.toLowerCase().includes('coupe'));

      const { data: allTerms } = await supabase.from('product_attribute_terms').select('id, name, slug, color_code, attribute_id').order('name');

      if (allTerms) {
        // --- COULEURS ---
        // 1. Filtrer par whitelist (Couleurs principales)
        // 2. Filtrer par disponibilité (Est-ce que cette couleur existe dans les produits ?)
        const potentialColors = allTerms.filter(t => 
          (t.color_code !== null || MAIN_COLORS_WHITELIST.includes(t.name.toLowerCase())) &&
          MAIN_COLORS_WHITELIST.includes(t.name.toLowerCase())
        );

        // On ne garde que celles qui sont dans availableTerms (soit par nom, soit par ID)
        const activeColors = potentialColors.filter(t => 
          availableTerms.has(t.name.toLowerCase()) || availableTerms.has(String(t.id))
        );

        const uniqueColors = Array.from(new Map(activeColors.map(item => [item.name, item])).values());
        
        setColorOptions(uniqueColors.map(c => ({
          ...c,
          color_code: c.color_code || FALLBACK_COLORS[c.slug.toLowerCase()] || FALLBACK_COLORS[c.name.toLowerCase()]
        })));

        // --- CONFORT ---
        if (confortAttr) {
          const opts = allTerms.filter(t => t.attribute_id === confortAttr.id);
          setConfortOptions(opts.filter(t => availableTerms.has(t.name.toLowerCase()) || availableTerms.has(String(t.id))));
        }

        // --- COUPE ---
        if (coupeAttr) {
          const opts = allTerms.filter(t => t.attribute_id === coupeAttr.id);
          setCoupeOptions(opts.filter(t => availableTerms.has(t.name.toLowerCase()) || availableTerms.has(String(t.id))));
        }
      }
    } catch (error) {
      console.error('Erreur chargement filtres:', error);
    }
  };

  const toggleFilter = (type: keyof FilterState, value: any) => {
    const newFilters = { ...activeFilters };
    if (type === 'live' || type === 'nouveautes' || type === 'mySize') {
      newFilters[type] = value;
    } else {
      const list = newFilters[type] as string[];
      newFilters[type] = list.includes(value) ? list.filter(v => v !== value) : [...list, value];
    }
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange({ mySize: false, sizes: [], colors: [], comfort: [], coupe: [], live: false, nouveautes: false });
  };

  const hasActiveFilters = activeFilters.mySize || Object.values(activeFilters).some(val => Array.isArray(val) ? val.length > 0 : val === true);

  return (
    <Card className="border-0 shadow-none sm:border sm:shadow-sm">
      <CardHeader className="px-0 sm:px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2"><Filter className="h-4 w-4" /> Critères</CardTitle>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-[#D4AF37] flex items-center gap-1">
              <X className="h-4 w-4" /> Effacer
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 px-0 sm:px-6">
        
        {/* FILTRE A MA TAILLE */}
        {profile?.user_size && (
          <div className="bg-[#FFF9F0] p-3 rounded-lg border border-[#D4AF37]/20 mb-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="my-size-toggle" 
                checked={activeFilters.mySize} 
                onCheckedChange={(c) => toggleFilter('mySize', !!c)} 
                className="data-[state=checked]:bg-[#D4AF37] border-[#D4AF37]" 
              />
              <Label htmlFor="my-size-toggle" className="text-sm font-semibold cursor-pointer text-[#b8933d]">
                À ma taille ({profile.user_size})
              </Label>
            </div>
          </div>
        )}

        {/* TAILLES */}
        {visibleSizes.length > 0 && (
          <>
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-900">Tailles</h3>
              <div className="grid grid-cols-4 gap-2">
                {visibleSizes.map(size => (
                  <button
                    key={size}
                    onClick={() => toggleFilter('sizes', size)}
                    className={`px-1 py-2 text-xs sm:text-sm rounded-md border transition-all ${
                      activeFilters.sizes.includes(size)
                        ? 'bg-[#D4AF37] text-white border-[#D4AF37] font-bold shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-[#D4AF37] hover:text-[#D4AF37]'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* COULEURS */}
        {colorOptions.length > 0 && (
          <>
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-900">Couleurs Principales</h3>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map(option => {
                  const isSelected = activeFilters.colors.includes(option.name);
                  
                  return (
                    <div 
                      key={option.id} 
                      onClick={() => toggleFilter('colors', option.name)}
                      className={`cursor-pointer w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'border-[#D4AF37] scale-110 shadow-md ring-2 ring-[#D4AF37] ring-opacity-30' 
                          : 'border-transparent hover:scale-105 shadow-sm'
                      }`}
                      style={{ background: option.color_code }}
                      title={option.name}
                    >
                      {isSelected && !option.slug.includes('multi') && <div className="w-2 h-2 bg-white rounded-full shadow-sm" />}
                    </div>
                  );
                })}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* CONFORT & COUPE */}
        {[ { title: 'Confort', opts: confortOptions, key: 'comfort' }, { title: 'Coupe', opts: coupeOptions, key: 'coupe' } ].map(group => group.opts.length > 0 && (
          <div key={group.key} className="space-y-3">
            <h3 className="font-semibold text-sm text-gray-900">{group.title}</h3>
            <div className="space-y-2">
              {group.opts.map(opt => (
                <div key={opt.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`${group.key}-${opt.id}`} 
                    checked={(activeFilters as any)[group.key].includes(opt.name)} 
                    onCheckedChange={() => toggleFilter(group.key as any, opt.name)} 
                    className="data-[state=checked]:bg-[#D4AF37] border-[#D4AF37]" 
                  />
                  <Label htmlFor={`${group.key}-${opt.id}`} className="text-sm cursor-pointer">{opt.name}</Label>
                </div>
              ))}
            </div>
            <Separator />
          </div>
        ))}

        {/* AUTRES */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-900">Autres</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="filter-live" checked={activeFilters.live} onCheckedChange={(c) => toggleFilter('live', !!c)} className="data-[state=checked]:bg-pink-500 border-pink-500" />
              <Label htmlFor="filter-live" className="text-sm cursor-pointer">🎥 Vu en Live</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="filter-nouveautes" checked={activeFilters.nouveautes} onCheckedChange={(c) => toggleFilter('nouveautes', !!c)} className="data-[state=checked]:bg-[#D4AF37] border-[#D4AF37]" />
              <Label htmlFor="filter-nouveautes" className="text-sm cursor-pointer">✨ Nouveautés</Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}