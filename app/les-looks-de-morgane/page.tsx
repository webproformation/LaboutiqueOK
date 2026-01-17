'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, SlidersHorizontal, DollarSign } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { ProductCard } from '@/components/ProductCard';
import PageHeader from '@/components/PageHeader';

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
}

export default function LooksPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFound, setCategoryFound] = useState(true);

  const [filterColor, setFilterColor] = useState<string>('all');
  const [filterSize, setFilterSize] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(1000);

  const [availableColors, setAvailableColors] = useState<Array<{ name: string; color_code?: string }>>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, priceRange, filterColor, filterSize]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', 'les-looks-de-morgane')
        .maybeSingle();

      if (categoryError) throw categoryError;

      if (!categoryData) {
        setCategoryFound(false);
        setProducts([]);
        setLoading(false);
        return;
      }

      const category = categoryData as { id: string };

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
                      const objValue = value as any;
                      stringValue = String(objValue.name || objValue.label || objValue.option || '');
                    } else {
                      stringValue = String(value || '');
                    }

                    const isHexCode = /^[a-f0-9]{8}$/i.test(stringValue);

                    if (!isHexCode && stringValue) {
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
      console.error('Error loading products:', error);
      setCategoryFound(false);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = async () => {
    let result = [...products];

    result = result.filter(product => {
      const price = product.sale_price || product.regular_price || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

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
            if (filterColor === 'all' && filterSize === 'all') {
              filteredIds.add(product.id);
            }
          }
        } else {
          if (filterColor === 'all' && filterSize === 'all') {
            filteredIds.add(product.id);
          }
        }
      }

      result = result.filter(p => filteredIds.has(p.id));
    }

    setFilteredProducts(result);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#C6A15B]" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        icon={Sparkles}
        title="Les Looks de Morgane"
        description="Découvrez les coups de cœur et suggestions de style sélectionnés personnellement par Morgane"
      />

      {!categoryFound && (
        <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-center">
            La catégorie n'existe pas encore en base de données. Créez-la depuis l'admin avec le slug "les-looks-de-morgane"
          </p>
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-6">
            {categoryFound
              ? 'Aucun produit dans cette sélection pour le moment. Revenez bientôt !'
              : 'Cette section sera bientôt disponible avec les looks sélectionnés par Morgane.'}
          </p>
          <Button asChild className="bg-[#C6A15B] hover:bg-[#B8934D] text-white">
            <Link href="/">Découvrir tous nos produits</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <SlidersHorizontal className="h-5 w-5 text-[#D4AF37]" />
                  <h3 className="font-semibold text-lg">Filtres</h3>
                </div>
                <Separator className="mb-4" />

                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-4 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Fourchette de prix
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-[#b8933d]">{priceRange[0]}€</span>
                        <span className="text-gray-500">à</span>
                        <span className="font-semibold text-[#b8933d]">{priceRange[1]}€</span>
                      </div>
                      <Slider
                        value={priceRange}
                        onValueChange={(value) => setPriceRange(value as [number, number])}
                        min={minPrice}
                        max={maxPrice}
                        step={1}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-500 text-center">
                        {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} dans cette gamme
                      </div>
                    </div>
                  </div>

                  {availableColors.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-3">Couleurs principales</h4>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setFilterColor('all')}
                            className={`px-3 py-1 text-sm rounded-md border transition-all ${
                              filterColor === 'all'
                                ? 'bg-[#b8933d] text-white border-[#b8933d]'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-[#b8933d]'
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
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-3">Tailles</h4>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setFilterSize('all')}
                            className={`px-3 py-1 text-sm rounded-md border transition-all ${
                              filterSize === 'all'
                                ? 'bg-[#b8933d] text-white border-[#b8933d]'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-[#b8933d]'
                            }`}
                          >
                            Toutes
                          </button>
                          {availableSizes.map((size) => (
                            <button
                              key={size}
                              onClick={() => setFilterSize(size)}
                              className={`px-3 py-1 text-sm rounded-md border transition-all uppercase ${
                                filterSize === size
                                  ? 'bg-[#b8933d] text-white border-[#b8933d]'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-[#b8933d]'
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
            <div className="mb-4 text-sm text-gray-600">
              {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} showAddToCart={true} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
