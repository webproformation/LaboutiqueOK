'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { decodeHtmlEntities } from '@/lib/utils';

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
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [sortBy, setSortBy] = useState<string>('default');
  const [filterColor, setFilterColor] = useState<string>('all');
  const [filterSize, setFilterSize] = useState<string>('all');

  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);

  const getColorValue = (colorName: string): string => {
    const colorMap: Record<string, string> = {
      noir: "#000000",
      blanc: "#FFFFFF",
      rouge: "#DC2626",
      bleu: "#2563EB",
      vert: "#16A34A",
      jaune: "#EAB308",
      rose: "#EC4899",
      violet: "#9333EA",
      orange: "#F97316",
      gris: "#6B7280",
      beige: "#D4B896",
      marron: "#92400E",
    };

    const lowerName = colorName.toLowerCase();
    for (const [key, value] of Object.entries(colorMap)) {
      if (lowerName.includes(key)) {
        return value;
      }
    }
    return "#9CA3AF";
  };

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

        const colors = new Set<string>();
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
                    if (lowerKey.includes('couleur') || lowerKey.includes('color')) {
                      colors.add(value as string);
                    }
                    if (lowerKey.includes('taille') || lowerKey.includes('size')) {
                      sizes.add(value as string);
                    }
                  });
                }
              });
            }
          }
        }

        setProducts(prods);
        setAvailableColors(Array.from(colors));
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
                  if ((lowerKey.includes('couleur') || lowerKey.includes('color')) && value === filterColor) {
                    matchesColor = true;
                  }
                  if ((lowerKey.includes('taille') || lowerKey.includes('size')) && value === filterSize) {
                    matchesSize = true;
                  }
                });

                return (filterColor === 'all' || matchesColor) && (filterSize === 'all' || matchesSize);
              });

              if (hasMatchingVariation) {
                filteredIds.add(product.id);
              }
            }
          } else {
            filteredIds.add(product.id);
          }
        }

        result = result.filter(p => filteredIds.has(p.id));
      }

      switch (sortBy) {
        case 'price_asc':
          result.sort((a, b) => {
            const priceA = a.sale_price || a.regular_price || 0;
            const priceB = b.sale_price || b.regular_price || 0;
            return priceA - priceB;
          });
          break;
        case 'price_desc':
          result.sort((a, b) => {
            const priceA = a.sale_price || a.regular_price || 0;
            const priceB = b.sale_price || b.regular_price || 0;
            return priceB - priceA;
          });
          break;
        default:
          break;
      }

      setFilteredProducts(result);
    };

    filterProducts();
  }, [products, sortBy, filterColor, filterSize]);

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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">{decodeHtmlEntities(category.name)}</h1>
        {category.description && (
          <p className="text-gray-600 max-w-3xl mx-auto">{decodeHtmlEntities(category.description)}</p>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-6">Aucun produit dans cette catégorie pour le moment.</p>
          <Button asChild>
            <Link href="/">Découvrir nos autres produits</Link>
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
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      Trier par prix
                    </h4>
                    <RadioGroup value={sortBy} onValueChange={setSortBy}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="default" id="sort-default" />
                        <Label htmlFor="sort-default" className="cursor-pointer">Par défaut</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="price_asc" id="sort-asc" />
                        <Label htmlFor="sort-asc" className="cursor-pointer">Prix croissant</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="price_desc" id="sort-desc" />
                        <Label htmlFor="sort-desc" className="cursor-pointer">Prix décroissant</Label>
                      </div>
                    </RadioGroup>
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
                          {availableColors.map((color) => (
                            <button
                              key={color}
                              onClick={() => setFilterColor(color)}
                              className={`flex items-center gap-2 px-3 py-1 text-sm rounded-md border transition-all ${
                                filterColor === color
                                  ? 'bg-[#b8933d] text-white border-[#b8933d]'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-[#b8933d]'
                              }`}
                              title={color}
                            >
                              <span
                                className="w-4 h-4 rounded-full border border-gray-400"
                                style={{ backgroundColor: getColorValue(color) }}
                              />
                              <span className="capitalize">{color}</span>
                            </button>
                          ))}
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
            <Card key={product.id} className="group overflow-hidden">
              <Link href={`/product/${product.slug}`}>
                <div className="aspect-square overflow-hidden bg-gray-100">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Pas d'image
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {decodeHtmlEntities(product.name)}
                  </h3>
                  <div className="flex items-center gap-2">
                    {product.sale_price ? (
                      <>
                        <span className="text-lg font-bold text-[#C6A15B]">
                          {product.sale_price.toFixed(2)} €
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                          {product.regular_price?.toFixed(2)} €
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-bold">
                        {product.regular_price?.toFixed(2)} €
                      </span>
                    )}
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
