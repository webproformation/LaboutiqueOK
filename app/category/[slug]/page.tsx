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
        setProducts(prods);

        const colors = new Set<string>();
        const sizes = new Set<string>();

        prods.forEach((product: any) => {
          if (product.color) colors.add(product.color);
          if (product.size) sizes.add(product.size);
        });

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
    let result = [...products];

    if (filterColor !== 'all') {
      result = result.filter(p => p.color === filterColor);
    }

    if (filterSize !== 'all') {
      result = result.filter(p => p.size === filterSize);
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
                        <h4 className="font-medium mb-3">Couleur</h4>
                        <RadioGroup value={filterColor} onValueChange={setFilterColor}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="all" id="color-all" />
                            <Label htmlFor="color-all" className="cursor-pointer">Toutes</Label>
                          </div>
                          {availableColors.map((color) => (
                            <div key={color} className="flex items-center space-x-2">
                              <RadioGroupItem value={color} id={`color-${color}`} />
                              <Label htmlFor={`color-${color}`} className="cursor-pointer flex items-center gap-2">
                                <span
                                  className="w-4 h-4 rounded-full border border-gray-300"
                                  style={{ backgroundColor: color }}
                                />
                                {color}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    </>
                  )}

                  {availableSizes.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-3">Taille</h4>
                        <RadioGroup value={filterSize} onValueChange={setFilterSize}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="all" id="size-all" />
                            <Label htmlFor="size-all" className="cursor-pointer">Toutes</Label>
                          </div>
                          {availableSizes.map((size) => (
                            <div key={size} className="flex items-center space-x-2">
                              <RadioGroupItem value={size} id={`size-${size}`} />
                              <Label htmlFor={`size-${size}`} className="cursor-pointer">{size}</Label>
                            </div>
                          ))}
                        </RadioGroup>
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
