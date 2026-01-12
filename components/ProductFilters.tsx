'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { X } from 'lucide-react';

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
  const [isClothing, setIsClothing] = useState(false);

  useEffect(() => {
    checkCategory();
    loadFilterOptions();
  }, [categorySlug]);

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters]);

  const checkCategory = async () => {
    if (!categorySlug) {
      setIsClothing(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('name, slug, parent_id')
        .eq('slug', categorySlug)
        .maybeSingle();

      if (error) throw error;

      const clothingKeywords = ['pret-a-porter', 'vetement', 'mode', 'dressing'];
      const isClothingCategory = clothingKeywords.some(
        keyword => data?.name.toLowerCase().includes(keyword) || data?.slug.toLowerCase().includes(keyword)
      );

      setIsClothing(isClothingCategory);
    } catch (error) {
      console.error('Error checking category:', error);
      setIsClothing(true);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const [colorResult, confortResult, coupeResult] = await Promise.all([
        supabase
          .from('product_attribute_terms')
          .select('color_family')
          .not('color_family', 'is', null)
          .order('color_family'),
        supabase
          .from('product_attributes')
          .select('id, name, slug')
          .eq('slug', 'confort')
          .maybeSingle(),
        supabase
          .from('product_attributes')
          .select('id, name, slug')
          .eq('slug', 'coupe')
          .maybeSingle()
      ]);

      if (colorResult.data) {
        const uniqueFamilies = Array.from(new Set(
          colorResult.data.map(item => item.color_family).filter(Boolean)
        )) as string[];
        setAvailableColorFamilies(uniqueFamilies);
      }

      if (confortResult.data) {
        const { data: terms } = await supabase
          .from('product_attribute_terms')
          .select('id, name, slug')
          .eq('attribute_id', confortResult.data.id)
          .order('order_by');

        if (terms) {
          setConfortOptions(terms.map(t => ({ id: t.id, name: t.name, slug: t.slug })));
        }
      }

      if (coupeResult.data) {
        const { data: terms } = await supabase
          .from('product_attribute_terms')
          .select('id, name, slug')
          .eq('attribute_id', coupeResult.data.id)
          .order('order_by');

        if (terms) {
          setCoupeOptions(terms.map(t => ({ id: t.id, name: t.name, slug: t.slug })));
        }
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
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
    <Card className="sticky top-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filtres</CardTitle>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Effacer
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {profile?.user_size && isClothing && (
          <>
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-900">Ma taille ({profile.user_size})</h3>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="my-size"
                  checked={filters.sizes.includes(profile.user_size)}
                  onCheckedChange={() => handleSizeToggle(profile.user_size!)}
                />
                <Label htmlFor="my-size" className="text-sm cursor-pointer">
                  Uniquement ma taille
                </Label>
              </div>
            </div>
            <Separator />
          </>
        )}

        {isClothing && (
          <>
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-900">Tailles</h3>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 11 }, (_, i) => 34 + (i * 2)).map(size => (
                  <button
                    key={size}
                    onClick={() => handleSizeToggle(size)}
                    className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                      filters.sizes.includes(size)
                        ? 'bg-[#D4AF37] text-white border-[#D4AF37]'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-[#D4AF37]'
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

        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-900">Couleurs</h3>
          <div className="space-y-2">
            {availableColorFamilies.map(family => (
              <div key={family} className="flex items-center space-x-2">
                <Checkbox
                  id={`color-${family}`}
                  checked={filters.colorFamilies.includes(family)}
                  onCheckedChange={() => handleColorFamilyToggle(family)}
                />
                <Label htmlFor={`color-${family}`} className="text-sm cursor-pointer">
                  {family}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {isClothing && confortOptions.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-900">Confort</h3>
              <div className="space-y-2">
                {confortOptions.map(option => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`comfort-${option.slug}`}
                      checked={filters.comfort.includes(option.slug)}
                      onCheckedChange={() => handleComfortToggle(option.slug)}
                    />
                    <Label htmlFor={`comfort-${option.slug}`} className="text-sm cursor-pointer">
                      {option.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {isClothing && coupeOptions.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-900">Coupe</h3>
              <div className="space-y-2">
                {coupeOptions.map(option => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`coupe-${option.slug}`}
                      checked={filters.coupe.includes(option.slug)}
                      onCheckedChange={() => handleCoupeToggle(option.slug)}
                    />
                    <Label htmlFor={`coupe-${option.slug}`} className="text-sm cursor-pointer">
                      {option.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <Separator />
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-900">Autres</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="filter-live"
                checked={filters.live}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, live: !!checked }))}
              />
              <Label htmlFor="filter-live" className="text-sm cursor-pointer">
                Vu dans le dernier Live
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="filter-nouveautes"
                checked={filters.nouveautes}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, nouveautes: !!checked }))}
              />
              <Label htmlFor="filter-nouveautes" className="text-sm cursor-pointer">
                Nouveautés
              </Label>
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-gray-900">Filtres actifs</h3>
              <div className="flex flex-wrap gap-2">
                {filters.sizes.map(size => (
                  <Badge key={`size-${size}`} variant="secondary" className="gap-1">
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
                  <Badge variant="secondary" className="gap-1">
                    Live
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, live: false }))} />
                  </Badge>
                )}
                {filters.nouveautes && (
                  <Badge variant="secondary" className="gap-1">
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
