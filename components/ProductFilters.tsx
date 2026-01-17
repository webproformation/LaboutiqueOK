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

interface ProductFiltersProps {
  categorySlug?: string;
  onFiltersChange: (filters: FilterState) => void;
}

export interface FilterState {
  sizes: string[];
  colors: string[];
  comfort: string[];
  coupe: string[];
  live: boolean;
  nouveautes: boolean;
}

export function ProductFilters({ categorySlug, onFiltersChange }: ProductFiltersProps) {
  const { profile } = useAuth();
  const [filters, setFilters] = useState<FilterState>({
    sizes: [],
    colors: [],
    comfort: [],
    coupe: [],
    live: false,
    nouveautes: false,
  });

  const [colorOptions, setColorOptions] = useState<FilterOption[]>([]);
  const [confortOptions, setConfortOptions] = useState<FilterOption[]>([]);
  const [coupeOptions, setCoupeOptions] = useState<FilterOption[]>([]);
  
  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters]);

  const loadFilterOptions = async () => {
    try {
      // 1. On charge TOUS les attributs pour trouver les bons IDs sans deviner les slugs
      const { data: allAttributes } = await supabase
        .from('product_attributes')
        .select('id, name, slug');

      if (!allAttributes) return;

      // Identification dynamique des IDs d'attributs
      const colorAttr = allAttributes.find(a => 
        a.slug.includes('color') || 
        a.slug.includes('couleur') || 
        a.name.toLowerCase().includes('couleur')
      );
      
      const confortAttr = allAttributes.find(a => a.slug === 'confort' || a.name.toLowerCase() === 'confort');
      const coupeAttr = allAttributes.find(a => a.slug === 'coupe' || a.name.toLowerCase() === 'coupe');

      // 2. Chargement des termes pour chaque attribut trouvé
      
      // --- COULEURS ---
      if (colorAttr) {
        const { data: terms } = await supabase
          .from('product_attribute_terms')
          .select('id, name, slug, color_code')
          .eq('attribute_id', colorAttr.id)
          .order('name');
        
        if (terms) {
            // Dédoublonnage et nettoyage
            const uniqueTerms = Array.from(new Map(terms.map(item => [item.name, item])).values());
            setColorOptions(uniqueTerms);
        }
      }

      // --- CONFORT ---
      if (confortAttr) {
        const { data: terms } = await supabase
          .from('product_attribute_terms')
          .select('id, name, slug')
          .eq('attribute_id', confortAttr.id)
          .order('name');
        if (terms) setConfortOptions(terms);
      }

      // --- COUPE ---
      if (coupeAttr) {
        const { data: terms } = await supabase
          .from('product_attribute_terms')
          .select('id, name, slug')
          .eq('attribute_id', coupeAttr.id)
          .order('name');
        if (terms) setCoupeOptions(terms);
      }

    } catch (error) {
      console.error('Erreur chargement filtres:', error);
    }
  };

  const handleSizeToggle = (size: string) => {
    setFilters(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }));
  };

  const handleColorToggle = (colorName: string) => {
    setFilters(prev => ({
      ...prev,
      colors: prev.colors.includes(colorName)
        ? prev.colors.filter(c => c !== colorName)
        : [...prev.colors, colorName]
    }));
  };

  const handleComfortToggle = (name: string) => {
    setFilters(prev => ({
      ...prev,
      comfort: prev.comfort.includes(name)
        ? prev.comfort.filter(c => c !== name)
        : [...prev.comfort, name]
    }));
  };

  const handleCoupeToggle = (name: string) => {
    setFilters(prev => ({
      ...prev,
      coupe: prev.coupe.includes(name)
        ? prev.coupe.filter(c => c !== name)
        : [...prev.coupe, name]
    }));
  };

  const clearFilters = () => {
    setFilters({
      sizes: [],
      colors: [],
      comfort: [],
      coupe: [],
      live: false,
      nouveautes: false,
    });
  };

  const hasActiveFilters =
    filters.sizes.length > 0 ||
    filters.colors.length > 0 ||
    filters.comfort.length > 0 ||
    filters.coupe.length > 0 ||
    filters.live ||
    filters.nouveautes;

  return (
    <Card className="border-0 shadow-none sm:border sm:shadow-sm">
      <CardHeader className="px-0 sm:px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" /> Critères
          </CardTitle>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-[#D4AF37] flex items-center gap-1 transition-colors"
            >
              <X className="h-4 w-4" />
              Effacer
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 px-0 sm:px-6">
        
        {/* --- TAILLES --- */}
        {profile?.user_size && (
          <div className="bg-[#FFF9F0] p-3 rounded-lg border border-[#D4AF37]/20">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="my-size"
                checked={filters.sizes.includes(String(profile.user_size))}
                onCheckedChange={() => handleSizeToggle(String(profile.user_size))}
                className="data-[state=checked]:bg-[#D4AF37] data-[state=checked]:border-[#D4AF37]"
              />
              <Label htmlFor="my-size" className="text-sm font-semibold cursor-pointer text-[#b8933d]">
                Ma taille ({profile.user_size})
              </Label>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-900">Tailles</h3>
          <div className="grid grid-cols-4 gap-2">
            {['34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54', 'TU'].map(size => (
              <button
                key={size}
                onClick={() => handleSizeToggle(size)}
                className={`px-1 py-2 text-xs sm:text-sm rounded-md border transition-all ${
                  filters.sizes.includes(size)
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

        {/* --- COULEURS --- */}
        {colorOptions.length > 0 && (
          <>
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-900">Couleurs</h3>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map(option => {
                  const isSelected = filters.colors.includes(option.name);
                  // Utilisation du code couleur s'il existe, sinon gris clair
                  const bgColor = option.color_code || '#eee';
                  
                  return (
                    <div 
                      key={option.id} 
                      onClick={() => handleColorToggle(option.name)}
                      className={`cursor-pointer w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'border-[#D4AF37] scale-110 shadow-md ring-2 ring-[#D4AF37] ring-opacity-30' 
                          : 'border-transparent hover:scale-105 hover:shadow-sm'
                      }`}
                      style={{ backgroundColor: bgColor }}
                      title={option.name}
                    >
                      {/* Petit indicateur si sélectionné */}
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full shadow-sm" />}
                      {/* Affichage du nom si pas de couleur définie */}
                      {!option.color_code && <span className="text-[9px] text-black px-1 truncate w-full text-center">{option.name}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* --- CONFORT --- */}
        {confortOptions.length > 0 && (
          <>
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-900">Confort</h3>
              <div className="space-y-2">
                {confortOptions.map(option => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`comfort-${option.id}`}
                      checked={filters.comfort.includes(option.name)}
                      onCheckedChange={() => handleComfortToggle(option.name)}
                      className="data-[state=checked]:bg-[#D4AF37] data-[state=checked]:border-[#D4AF37]"
                    />
                    <Label htmlFor={`comfort-${option.id}`} className="text-sm cursor-pointer">
                      {option.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* --- COUPE --- */}
        {coupeOptions.length > 0 && (
          <>
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-900">Coupe</h3>
              <div className="space-y-2">
                {coupeOptions.map(option => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`coupe-${option.id}`}
                      checked={filters.coupe.includes(option.name)}
                      onCheckedChange={() => handleCoupeToggle(option.name)}
                      className="data-[state=checked]:bg-[#D4AF37] data-[state=checked]:border-[#D4AF37]"
                    />
                    <Label htmlFor={`coupe-${option.id}`} className="text-sm cursor-pointer">
                      {option.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* --- AUTRES --- */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-900">Autres</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="filter-live"
                checked={filters.live}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, live: !!checked }))}
                className="data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500"
              />
              <Label htmlFor="filter-live" className="text-sm cursor-pointer flex items-center gap-1">
                🎥 Vu en Live
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="filter-nouveautes"
                checked={filters.nouveautes}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, nouveautes: !!checked }))}
                className="data-[state=checked]:bg-[#D4AF37] data-[state=checked]:border-[#D4AF37]"
              />
              <Label htmlFor="filter-nouveautes" className="text-sm cursor-pointer">
                ✨ Nouveautés
              </Label>
            </div>
          </div>
        </div>

        {/* --- BADGES ACTIFS --- */}
        {hasActiveFilters && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="font-semibold text-xs text-gray-500 uppercase tracking-wide">Filtres actifs</h3>
              <div className="flex flex-wrap gap-2">
                {/* Badges pour chaque filtre actif */}
                {filters.sizes.map(s => <Badge key={s} variant="secondary" className="gap-1 cursor-pointer" onClick={() => handleSizeToggle(s)}>{s} <X className="h-3 w-3" /></Badge>)}
                {filters.colors.map(s => <Badge key={s} variant="secondary" className="gap-1 cursor-pointer" onClick={() => handleColorToggle(s)}>{s} <X className="h-3 w-3" /></Badge>)}
                {filters.comfort.map(s => <Badge key={s} variant="secondary" className="gap-1 cursor-pointer" onClick={() => handleComfortToggle(s)}>{s} <X className="h-3 w-3" /></Badge>)}
                {filters.coupe.map(s => <Badge key={s} variant="secondary" className="gap-1 cursor-pointer" onClick={() => handleCoupeToggle(s)}>{s} <X className="h-3 w-3" /></Badge>)}
                {filters.live && <Badge variant="secondary" className="gap-1 bg-pink-100 text-pink-700 cursor-pointer" onClick={() => setFilters(prev => ({...prev, live: false}))}>Live <X className="h-3 w-3" /></Badge>}
                {filters.nouveautes && <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800 cursor-pointer" onClick={() => setFilters(prev => ({...prev, nouveautes: false}))}>Nouveautés <X className="h-3 w-3" /></Badge>}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}