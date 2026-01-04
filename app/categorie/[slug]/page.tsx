'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, Product, ProductCategory } from '@/lib/supabase';
import { Header } from '@/components/header';
import { LoyaltyBar } from '@/components/loyalty-bar';
import { ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [maxPrice, setMaxPrice] = useState(200);

  useEffect(() => {
    loadCategoryAndProducts();
  }, [slug]);

  useEffect(() => {
    applyFilters();
  }, [priceRange, allProducts]);

  async function loadCategoryAndProducts() {
    try {
      if (slug === 'tous') {
        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .eq('status', 'publish')
          .order('created_at', { ascending: false });

        if (productsData) {
          setAllProducts(productsData);
          const prices = productsData.map(p => p.regular_price || 0).filter(p => p > 0);
          const max = Math.max(...prices, 200);
          setMaxPrice(max);
          setPriceRange([0, max]);
        }
        setLoading(false);
        return;
      }

      const { data: categoryData } = await supabase
        .from('product_categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (!categoryData) {
        router.push('/');
        return;
      }

      setCategory(categoryData);

      const { data: mappingData } = await supabase
        .from('product_category_mapping')
        .select('product_id')
        .eq('category_id', categoryData.id);

      const productIds = mappingData?.map(m => m.product_id) || [];

      if (productIds.length > 0) {
        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds)
          .eq('status', 'publish');

        if (productsData) {
          setAllProducts(productsData);
          const prices = productsData.map(p => p.regular_price || 0).filter(p => p > 0);
          const max = Math.max(...prices, 200);
          setMaxPrice(max);
          setPriceRange([0, max]);
        }
      }
    } catch (error) {
      console.error('Error loading category:', error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...allProducts];

    filtered = filtered.filter(product => {
      const price = product.sale_price || product.regular_price || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    setFilteredProducts(filtered);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <LoyaltyBar />
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-600">Chargement...</div>
        </div>
      </div>
    );
  }

  const displayProducts = filteredProducts.length > 0 ? filteredProducts : allProducts;
  const categoryName = slug === 'tous' ? 'Tous les Produits' : category?.name || '';

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <LoyaltyBar />

      <main className="container mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center text-gray-600 hover:text-[#D4AF37] mb-8 transition-smooth"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour à l'accueil
        </Link>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">{categoryName}</h1>
            {category?.description && (
              <p className="text-gray-600">{category.description}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              {displayProducts.length} produit{displayProducts.length > 1 ? 's' : ''}
            </p>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="rounded-xl">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filtres
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filtres</SheetTitle>
              </SheetHeader>
              <div className="py-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-4 block">
                      Prix: {priceRange[0]}€ - {priceRange[1]}€
                    </label>
                    <Slider
                      value={priceRange}
                      onValueChange={(value) => setPriceRange(value as [number, number])}
                      max={maxPrice}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {displayProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-600">Aucun produit trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayProducts.map((product) => {
              const displayPrice = product.sale_price || product.regular_price;
              const hasDiscount = product.sale_price && product.sale_price < (product.regular_price || 0);

              return (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  className="bg-white rounded-xl shadow-soft overflow-hidden hover:shadow-xl transition-smooth transform hover:-translate-y-1"
                >
                  <div className="aspect-square relative overflow-hidden bg-gray-100">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-110 transition-smooth"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        Pas d'image
                      </div>
                    )}
                    {hasDiscount && (
                      <div className="absolute top-3 left-3 bg-[#F8B4C1] text-white px-3 py-1 rounded-full text-xs font-semibold">
                        Promo
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-sm mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      {hasDiscount ? (
                        <>
                          <span className="text-[#D4AF37] font-bold">
                            {displayPrice?.toFixed(2)}€
                          </span>
                          <span className="text-gray-400 line-through text-sm">
                            {product.regular_price?.toFixed(2)}€
                          </span>
                        </>
                      ) : (
                        <span className="font-bold">
                          {displayPrice?.toFixed(2)}€
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
