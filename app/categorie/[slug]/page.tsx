'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, Product, ProductCategory } from '@/lib/supabase';
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
import { ProductCard } from '@/components/ProductCard';

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
        .from('categories')
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayProducts.map((product) => (
              <ProductCard key={product.id} product={product} showAddToCart={true} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
