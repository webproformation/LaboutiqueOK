'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, SlidersHorizontal, Euro, Package, ArrowUpDown, X, User } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { decodeHtmlEntities } from '@/lib/utils';
import { ProductCard } from '@/components/ProductCard';
import PageHeader from '@/components/PageHeader';
import { useAuth } from '@/context/AuthContext';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  regular_price: number | null;
  sale_price: number | null;
  image_url: string | null;
  stock_quantity: number | null;
  is_variable_product?: boolean;
  color?: string;
  size?: string;
  attributes?: any;
  created_at?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
}

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { profile } = useAuth();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterColor, setFilterColor] = useState<string>('all');
  const [filterSize, setFilterSize] = useState<string>('all');
  const [mySizeOnly, setMySizeOnly] = useState<boolean>(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'name'>('newest');

  const [availableColors, setAvailableColors] = useState<Array<{ name: string; color_code?: string }>>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);

  useEffect(() => {
    loadCategoryAndProducts();
  }, [slug]);

  const loadCategoryAndProducts = async () => {
    setLoading(true);
    try {
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (categoryError) throw categoryError;
      if (!categoryData) {
        setCategory(null);
        setProducts([]);
        return;
      }

      const category = categoryData as any;
      setCategory(category);

      const { data: productIds, error: mappingError } = await supabase
        .from('product_category_mapping')
        .select('product_id')
        .eq('category_id', category.id);

      if (mappingError) throw mappingError;

      if (productIds && productIds.length > 0) {
        const ids = (productIds as Array<{ product_id: string }>).map((p) => p.product_id);
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('id', ids)
          .eq('status', 'publish');

        if (productsError) throw productsError;
        const prods = productsData || [];

        const colorsMap = new Map<string, { name: string; color_code?: string }>();
        const sizes = new Set<string>();

        for (const product of prods) {
          if (product.is_variable_product) {
            const { data: variations } = await supabase
              .from('product_variations')
              .select('attributes')
              .eq('product_id', product.id);

            if (variations) {
              variations.forEach((v: any) => {
                if (v.attributes) {
                  Object.entries(v.attributes).forEach(([key, value]) => {
                    const lowerKey = key.toLowerCase();

                    // Extraire la valeur string depuis l'objet si nécessaire
                    let stringValue = '';
                    if (typeof value === 'object' && value !== null) {
                      // Si c'est un objet, essayer d'extraire name, label, ou option
                      const objValue = value as any;
                      stringValue = String(objValue.name || objValue.label || objValue.option || '');
                    } else {
                      stringValue = String(value || '');
                    }

                    // Filtrer les IDs (UUID, hex codes longs, ou IDs numériques)
                    const isUUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(stringValue);
                    const isHexCode = /^[a-f0-9]{8,}$/i.test(stringValue);
                    const isNumericId = /^\d+$/.test(stringValue);

                    if (!isUUID && !isHexCode && !isNumericId && stringValue) {
                      if (lowerKey.includes('couleur') || lowerKey.includes('color')) {
                        if (!colorsMap.has(stringValue)) {
                          colorsMap.set(stringValue, { name: stringValue });
                        }
                      }
                      if (lowerKey.includes('taille') || lowerKey.includes('size')) {
                        sizes.add(stringValue);
                      }
                    }
                  });
                }
              });
            }
          } else if (product.attributes && typeof product.attributes === 'object') {
            // Produit simple - scanner les attributs depuis products.attributes
            const attributeTermIds: string[] = [];
            Object.values(product.attributes).forEach((termIds: any) => {
              if (Array.isArray(termIds)) {
                attributeTermIds.push(...termIds);
              }
            });

            if (attributeTermIds.length > 0) {
              const { data: attributeTerms } = await supabase
                .from('product_attribute_terms')
                .select('id, name, slug, color_code, attribute_id, product_attributes!inner(name, slug)')
                .in('id', attributeTermIds);

              if (attributeTerms) {
                attributeTerms.forEach((term: any) => {
                  const attrSlug = term.product_attributes?.slug || '';
                  if (attrSlug.includes('couleur') || attrSlug.includes('color')) {
                    if (!colorsMap.has(term.name)) {
                      colorsMap.set(term.name, {
                        name: term.name,
                        color_code: term.color_code
                      });
                    }
                  }
                  if (attrSlug.includes('taille') || attrSlug.includes('size')) {
                    sizes.add(term.name);
                  }
                });
              }
            }
          }
        }

        // Calculer les prix min et max
        const prices = prods.map(p => p.sale_price || p.regular_price || 0).filter(p => p > 0);
        const calculatedMin = prices.length > 0 ? Math.floor(Math.min(...prices)) : 0;
        const calculatedMax = prices.length > 0 ? Math.ceil(Math.max(...prices)) : 1000;

        setMinPrice(calculatedMin);
        setMaxPrice(calculatedMax);
        setPriceRange([calculatedMin, calculatedMax]);

        setProducts(prods);
        setAvailableColors(Array.from(colorsMap.values()));
        setAvailableSizes(Array.from(sizes));
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error loading category:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filterProducts = async () => {
      let result = [...products];

      // Filtre par prix
      result = result.filter(product => {
        const price = product.sale_price || product.regular_price || 0;
        return price >= priceRange[0] && price <= priceRange[1];
      });

      // Filtre "À ma taille"
      if (mySizeOnly && profile?.user_size) {
        const userSize = String(profile.user_size);
        const filteredIds = new Set<string>();

        for (const product of result) {
          if (product.is_variable_product) {
            const { data: variations } = await supabase
              .from('product_variations')
              .select('attributes, stock_quantity')
              .eq('product_id', product.id)
              .gt('stock_quantity', 0);

            if (variations) {
              const hasMatchingSize = variations.some((v: any) => {
                if (!v.attributes) return false;
                return Object.entries(v.attributes).some(([key, value]) => {
                  const lowerKey = key.toLowerCase();
                  if (lowerKey.includes('taille') || lowerKey.includes('size')) {
                    // Extraire la valeur string depuis l'objet si nécessaire
                    let stringValue = '';
                    if (typeof value === 'object' && value !== null) {
                      const objValue = value as any;
                      stringValue = String(objValue.name || objValue.label || objValue.option || '');
                    } else {
                      stringValue = String(value || '');
                    }
                    return stringValue === userSize;
                  }
                  return false;
                });
              });

              if (hasMatchingSize) {
                filteredIds.add(product.id);
              }
            }
          }
        }

        result = result.filter(p => filteredIds.has(p.id));
      }

      if (filterColor !== 'all' || filterSize !== 'all') {
        const filteredIds = new Set<string>();

        for (const product of products) {
          if (product.is_variable_product) {
            const { data: variations } = await supabase
              .from('product_variations')
              .select('attributes, product_id')
              .eq('product_id', product.id);

            if (variations) {
              const hasMatchingVariation = variations.some((v: any) => {
                if (!v.attributes) return false;

                let matchesColor = filterColor === 'all';
                let matchesSize = filterSize === 'all';

                Object.entries(v.attributes).forEach(([key, value]) => {
                  const lowerKey = key.toLowerCase();

                  // Extraire la valeur string depuis l'objet si nécessaire
                  let stringValue = '';
                  if (typeof value === 'object' && value !== null) {
                    const objValue = value as any;
                    stringValue = String(objValue.name || objValue.label || objValue.option || '');
                  } else {
                    stringValue = String(value || '');
                  }

                  if ((lowerKey.includes('couleur') || lowerKey.includes('color')) && stringValue === filterColor) {
                    matchesColor = true;
                  }
                  if ((lowerKey.includes('taille') || lowerKey.includes('size')) && stringValue === filterSize) {
                    matchesSize = true;
                  }
                });

                return (filterColor === 'all' || matchesColor) && (filterSize === 'all' || matchesSize);
              });

              if (hasMatchingVariation) {
                filteredIds.add(product.id);
              }
            }
          } else if (product.attributes && typeof product.attributes === 'object') {
            // Produit simple - vérifier les attributs depuis products.attributes
            const attributeTermIds: string[] = [];
            Object.values(product.attributes).forEach((termIds: any) => {
              if (Array.isArray(termIds)) {
                attributeTermIds.push(...termIds);
              }
            });

            if (attributeTermIds.length > 0) {
              const { data: attributeTerms } = await supabase
                .from('product_attribute_terms')
                .select('id, name, slug, color_code, attribute_id, product_attributes!inner(name, slug)')
                .in('id', attributeTermIds);

              if (attributeTerms) {
                let matchesColor = filterColor === 'all';
                let matchesSize = filterSize === 'all';

                attributeTerms.forEach((term: any) => {
                  const attrSlug = term.product_attributes?.slug || '';
                  if ((attrSlug.includes('couleur') || attrSlug.includes('color')) && term.name === filterColor) {
                    matchesColor = true;
                  }
                  if ((attrSlug.includes('taille') || attrSlug.includes('size')) && term.name === filterSize) {
                    matchesSize = true;
                  }
                });

                if ((filterColor === 'all' || matchesColor) && (filterSize === 'all' || matchesSize)) {
                  filteredIds.add(product.id);
                }
              }
            } else {
              // Produit simple sans attributs, inclure si pas de filtre actif
              if (filterColor === 'all' && filterSize === 'all') {
                filteredIds.add(product.id);
              }
            }
          } else {
            // Produit ni variable ni avec attributs
            if (filterColor === 'all' && filterSize === 'all') {
              filteredIds.add(product.id);
            }
          }
        }

        result = result.filter(p => filteredIds.has(p.id));
      }

      result.sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
          case 'price-asc':
            const priceA = a.sale_price || a.regular_price || 0;
            const priceB = b.sale_price || b.regular_price || 0;
            return priceA - priceB;
          case 'price-desc':
            const priceA2 = a.sale_price || a.regular_price || 0;
            const priceB2 = b.sale_price || b.regular_price || 0;
            return priceB2 - priceA2;
          case 'name':
            return a.name.localeCompare(b.name);
          default:
            return 0;
        }
      });

      setFilteredProducts(result);
    };

    filterProducts();
  }, [products, priceRange, filterColor, filterSize, mySizeOnly, sortBy, profile]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#C6A15B]" />
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Catégorie non trouvée</h1>
          <p className="text-gray-600 mb-6">
            La catégorie que vous recherchez n'existe pas.
          </p>
          <Button asChild>
            <Link href="/">Retour à l'accueil</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#FFF9F0] to-white">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-8 sm:mb-12">
          <PageHeader
            icon={Package}
            title={decodeHtmlEntities(category.name)}
            description={category.description ? decodeHtmlEntities(category.description) : undefined}
          />
        </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-6">Aucun produit dans cette catégorie pour le moment.</p>
          <Button asChild>
            <Link href="/">Découvrir nos autres produits</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          <aside className="lg:col-span-1 space-y-4 lg:space-y-6">
            <Card className="shadow-xl rounded-2xl border-2 border-gray-100 overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-[#FFF9F0]">
                  <div className="bg-gradient-to-br from-[#b8933d] to-[#D4AF37] p-2 rounded-xl shadow-md">
                    <SlidersHorizontal className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold text-xl text-gray-900">Filtres</h3>
                </div>

                <div className="space-y-6">
                  {profile?.user_size && (
                    <>
                      <div className="bg-gradient-to-br from-[#FFF9F0] to-[#F2F2E8] p-5 rounded-xl border-2 border-[#D4AF37]/20 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="bg-[#D4AF37] p-1.5 rounded-lg">
                              <User className="h-4 w-4 text-white" />
                            </div>
                            <Label htmlFor="my-size-filter" className="font-bold cursor-pointer text-gray-900">
                              À ma taille ({profile.user_size})
                            </Label>
                          </div>
                          <Switch
                            id="my-size-filter"
                            checked={mySizeOnly}
                            onCheckedChange={setMySizeOnly}
                          />
                        </div>
                        {mySizeOnly && (
                          <p className="text-xs text-gray-600 mt-3 pl-1 italic">
                            ✨ Affiche uniquement les articles disponibles en taille {profile.user_size}
                          </p>
                        )}
                      </div>
                      <Separator className="my-6" />
                    </>
                  )}

                  <div>
                    <h4 className="font-bold mb-5 flex items-center gap-2 text-gray-900">
                      <div className="bg-[#b8933d] p-1.5 rounded-lg">
                        <Euro className="h-4 w-4 text-white" />
                      </div>
                      Fourchette de prix
                    </h4>
                    <div className="space-y-5">
                      <div className="flex items-center justify-between text-base bg-gradient-to-r from-[#FFF9F0] to-white p-3 rounded-xl border border-gray-200">
                        <span className="font-bold text-[#b8933d] text-lg">{priceRange[0]}€</span>
                        <span className="text-gray-400 font-medium">à</span>
                        <span className="font-bold text-[#b8933d] text-lg">{priceRange[1]}€</span>
                      </div>
                      <Slider
                        value={priceRange}
                        onValueChange={(value) => setPriceRange(value as [number, number])}
                        min={minPrice}
                        max={maxPrice}
                        step={1}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-600 text-center bg-gray-50 py-2 px-3 rounded-lg font-semibold">
                        {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} dans cette gamme
                      </div>
                    </div>
                  </div>

                  {availableColors.length > 0 && (
                    <>
                      <Separator className="my-6" />
                      <div>
                        <h4 className="font-bold mb-4 flex items-center gap-2 text-gray-900">
                          <div className="bg-pink-500 p-1.5 rounded-lg">
                            <span className="text-white text-sm">🎨</span>
                          </div>
                          Couleurs
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setFilterColor('all')}
                            className={`px-4 py-2 text-sm rounded-xl border-2 transition-all font-semibold ${
                              filterColor === 'all'
                                ? 'bg-gradient-to-r from-[#b8933d] to-[#D4AF37] text-white border-[#b8933d] shadow-md scale-105'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-[#b8933d] hover:shadow-sm'
                            }`}
                          >
                            Toutes
                          </button>
                          {availableColors.map((color) => {
                            const hasColorCode = color.color_code && color.color_code.startsWith('#');

                            return (
                              <button
                                key={color.name}
                                onClick={() => setFilterColor(color.name)}
                                className={`flex items-center gap-2 px-2.5 py-1.5 text-sm rounded-full border-2 transition-all ${
                                  filterColor === color.name
                                    ? 'border-[#b8933d] shadow-md scale-105'
                                    : 'border-gray-200 hover:border-[#b8933d] hover:shadow-sm'
                                }`}
                                title={color.name}
                              >
                                {hasColorCode ? (
                                  <span
                                    className={`w-6 h-6 rounded-full border-2 flex-shrink-0 ${
                                      color.color_code === '#FFFFFF' ? 'border-gray-300' : 'border-gray-400'
                                    }`}
                                    style={{
                                      backgroundColor: color.color_code,
                                      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                                    }}
                                  />
                                ) : (
                                  <span className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs font-bold text-gray-600 bg-gray-100">
                                    {color.name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                                <span className="text-gray-700 font-medium">{color.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}

                  {availableSizes.length > 0 && (
                    <>
                      <Separator className="my-6" />
                      <div>
                        <h4 className="font-bold mb-4 flex items-center gap-2 text-gray-900">
                          <div className="bg-purple-500 p-1.5 rounded-lg">
                            <span className="text-white text-sm">📏</span>
                          </div>
                          Tailles
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setFilterSize('all')}
                            className={`px-4 py-2 text-sm rounded-xl border-2 transition-all font-semibold ${
                              filterSize === 'all'
                                ? 'bg-gradient-to-r from-[#b8933d] to-[#D4AF37] text-white border-[#b8933d] shadow-md scale-105'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-[#b8933d] hover:shadow-sm'
                            }`}
                          >
                            Toutes
                          </button>
                          {availableSizes.map((size) => (
                            <button
                              key={size}
                              onClick={() => setFilterSize(size)}
                              className={`px-4 py-2 text-sm rounded-xl border-2 transition-all uppercase font-bold ${
                                filterSize === size
                                  ? 'bg-gradient-to-r from-[#b8933d] to-[#D4AF37] text-white border-[#b8933d] shadow-md scale-105'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-[#b8933d] hover:shadow-sm'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </aside>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6 border-2 border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-[#b8933d] to-[#D4AF37] p-2 rounded-lg shadow-md">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Produits trouvés</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {filteredProducts.length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-white p-3 rounded-xl border-2 border-gray-200">
                  <div className="bg-[#D4AF37] p-1.5 rounded-lg">
                    <ArrowUpDown className="h-4 w-4 text-white" />
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-sm font-semibold text-gray-900 bg-transparent border-0 focus:outline-none focus:ring-0 cursor-pointer"
                  >
                    <option value="newest">Nouveautés</option>
                    <option value="price-asc">Prix croissant</option>
                    <option value="price-desc">Prix décroissant</option>
                    <option value="name">Nom A-Z</option>
                  </select>
                </div>
              </div>
            </div>

            {(mySizeOnly || filterColor !== 'all' || filterSize !== 'all' || priceRange[0] !== minPrice || priceRange[1] !== maxPrice) && (
              <div className="mb-6 p-5 bg-gradient-to-br from-[#FFF9F0] to-white rounded-2xl border-2 border-[#D4AF37]/20 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-[#b8933d] p-1.5 rounded-lg">
                      <SlidersHorizontal className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">Filtres actifs</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMySizeOnly(false);
                      setFilterColor('all');
                      setFilterSize('all');
                      setPriceRange([minPrice, maxPrice]);
                    }}
                    className="h-9 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Tout effacer
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {mySizeOnly && (
                    <Badge className="gap-2 px-3 py-2 bg-gradient-to-r from-[#D4AF37] to-[#C6A15B] hover:from-[#C6A15B] hover:to-[#b8933d] text-white font-semibold border-0 rounded-xl">
                      À ma taille
                      <X className="h-4 w-4 cursor-pointer hover:scale-110 transition-transform" onClick={() => setMySizeOnly(false)} />
                    </Badge>
                  )}
                  {filterColor !== 'all' && (
                    <Badge className="gap-2 px-3 py-2 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-semibold border-0 rounded-xl">
                      {availableColors.find(c => c.name === filterColor)?.name || filterColor}
                      <X className="h-4 w-4 cursor-pointer hover:scale-110 transition-transform" onClick={() => setFilterColor('all')} />
                    </Badge>
                  )}
                  {filterSize !== 'all' && (
                    <Badge className="gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold border-0 rounded-xl">
                      Taille {filterSize}
                      <X className="h-4 w-4 cursor-pointer hover:scale-110 transition-transform" onClick={() => setFilterSize('all')} />
                    </Badge>
                  )}
                  {(priceRange[0] !== minPrice || priceRange[1] !== maxPrice) && (
                    <Badge className="gap-2 px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold border-0 rounded-xl">
                      {priceRange[0]}€ - {priceRange[1]}€
                      <X className="h-4 w-4 cursor-pointer hover:scale-110 transition-transform" onClick={() => setPriceRange([minPrice, maxPrice])} />
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ProductCard product={product} showAddToCart={true} />
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl shadow-lg border-2 border-gray-100">
                <div className="max-w-md mx-auto px-6">
                  <div className="bg-gradient-to-br from-[#FFF9F0] to-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[#D4AF37]/20">
                    <Package className="h-10 w-10 text-[#b8933d]" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun produit trouvé</h3>
                  <p className="text-gray-600">
                    Aucun produit ne correspond à vos critères de filtrage.
                  </p>
                  <Button
                    onClick={() => {
                      setMySizeOnly(false);
                      setFilterColor('all');
                      setFilterSize('all');
                      setPriceRange([minPrice, maxPrice]);
                    }}
                    className="mt-6 bg-gradient-to-r from-[#b8933d] to-[#D4AF37] hover:from-[#a07c2f] hover:to-[#C6A15B] text-white rounded-xl font-bold shadow-md"
                  >
                    Réinitialiser les filtres
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
