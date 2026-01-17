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
  count?: number;
}

interface ProductFiltersProps {
  categorySlug?: string;
  onFiltersChange: (filters: FilterState) => void;
}

export interface FilterState {
  sizes: number[];
  colorFamilies: string[];
  comfort: string[];
  coupe: string[];
  live: boolean;
  nouveautes: boolean;
}

export function ProductFilters({ categorySlug, onFiltersChange }: ProductFiltersProps) {
  const { profile } = useAuth();
  const [filters, setFilters] = useState<FilterState>({
    sizes: [],
    colorFamilies: [],
    comfort: [],
    coupe: [],
    live: false,
    nouveautes: false,
  });

  const [availableColorFamilies, setAvailableColorFamilies] = useState<string[]>([]);
  const [confortOptions, setConfortOptions] = useState<FilterOption[]>([]);
  const [coupeOptions, setCoupeOptions] = useState<FilterOption[]>([]);
  
  // On active tout par défaut, plus besoin de configuration base de données
  const enabledFilters = ['size', 'color', 'comfort', 'fit', 'live'];

  useEffect(() => {
    loadFilterOptions();
  }, []); // Chargement unique au montage

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters]);

  const loadFilterOptions = async () => {
    try {
      // 1. Charger les familles de couleurs
      const { data: colorData } = await supabase
        .from('product_attribute_terms')
        .select('color_family')
        .not('color_family', 'is', null)
        .order('color_family');

      if (colorData) {
        const uniqueFamilies = Array.from(new Set(
          colorData.map((item: any) => item.color_family).filter(Boolean)
        )) as string[];
        setAvailableColorFamilies(uniqueFamilies);
      }

      // 2. Charger les options "Confort"
      const { data: confortAttr } = await supabase
        .from('product_attributes')
        .select('id')
        .eq('slug', 'confort')
        .maybeSingle();

      if (confortAttr) {
        const { data: terms } = await supabase
          .from('product_attribute_terms')
          .select('id, name, slug')
          .eq('attribute_id', confortAttr.id)
          .order('name');
        if (terms) setConfortOptions(terms);
      }

      // 3. Charger les options "Coupe"
      const { data: coupeAttr } = await supabase
        .from('product_attributes')
        .select('id')
        .eq('slug', 'coupe')
        .maybeSingle();

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

  const handleSizeToggle = (size: number) => {
    setFilters(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }));
  };

  const handleColorFamilyToggle = (family: string) => {
    setFilters(prev => ({
      ...prev,
      colorFamilies: prev.colorFamilies.includes(family)
        ? prev.colorFamilies.filter(f => f !== family)
        : [...prev.colorFamilies, family]
    }));
  };

  const handleComfortToggle = (slug: string) => {
    setFilters(prev => ({
      ...prev,
      comfort: prev.comfort.includes(slug)
        ? prev.comfort.filter(c => c !== slug)
        : [...prev.comfort, slug]
    }));
  };

  const handleCoupeToggle = (slug: string) => {
    setFilters(prev => ({
      ...prev,
      coupe: prev.coupe.includes(slug)
        ? prev.coupe.filter(c => c !== slug)
        : [...prev.coupe, slug]
    }));
  };

  const clearFilters = () => {
    setFilters({
      sizes: [],
      colorFamilies: [],
      comfort: [],
      coupe: [],
      live: false,
      nouveautes: false,
    });
  };

  const hasActiveFilters =
    filters.sizes.length > 0 ||
    filters.colorFamilies.length > 0 ||
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
                checked={filters.sizes.includes(profile.user_size)}
                onCheckedChange={() => handleSizeToggle(profile.user_size!)}
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
            {Array.from({ length: 11 }, (_, i) => 34 + (i * 2)).map(size => (
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
        {availableColorFamilies.length > 0 && (
          <>
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-900">Couleurs</h3>
              <div className="flex flex-wrap gap-2">
                {availableColorFamilies.map(family => {
                  const isSelected = filters.colorFamilies.includes(family);
                  return (
                    <div 
                      key={family} 
                      onClick={() => handleColorFamilyToggle(family)}
                      className={`cursor-pointer px-3 py-1.5 rounded-full text-xs border transition-all ${
                        isSelected 
                          ? 'bg-gray-900 text-white border-gray-900' 
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {family}
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
                      id={`comfort-${option.slug}`}
                      checked={filters.comfort.includes(option.slug)}
                      onCheckedChange={() => handleComfortToggle(option.slug)}
                      className="data-[state=checked]:bg-[#D4AF37] data-[state=checked]:border-[#D4AF37]"
                    />
                    <Label htmlFor={`comfort-${option.slug}`} className="text-sm cursor-pointer">
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
                      id={`coupe-${option.slug}`}
                      checked={filters.coupe.includes(option.slug)}
                      onCheckedChange={() => handleCoupeToggle(option.slug)}
                      className="data-[state=checked]:bg-[#D4AF37] data-[state=checked]:border-[#D4AF37]"
                    />
                    <Label htmlFor={`coupe-${option.slug}`} className="text-sm cursor-pointer">
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
                {filters.sizes.map(size => (
                  <Badge key={`size-${size}`} variant="secondary" className="gap-1 bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 border-0">
                    Taille {size}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => handleSizeToggle(size)} />
                  </Badge>
                ))}
                {filters.colorFamilies.map(family => (
                  <Badge key={`color-${family}`} variant="secondary" className="gap-1">
                    {family}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => handleColorFamilyToggle(family)} />
                  </Badge>
                ))}
                {filters.live && (
                  <Badge className="gap-1 bg-pink-100 text-pink-700 hover:bg-pink-200 border-0">
                    Live
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, live: false }))} />
                  </Badge>
                )}
                {filters.nouveautes && (
                  <Badge className="gap-1 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-0">
                    Nouveautés
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, nouveautes: false }))} />
                  </Badge>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}