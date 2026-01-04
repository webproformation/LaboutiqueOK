'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, Product, ProductCategory } from '@/lib/supabase';
import { ArrowLeft, SlidersHorizontal, Heart, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { toast } from 'sonner';

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
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

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

  const toggleFavorite = (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId);
        toast.success('Retiré des favoris');
      } else {
        newFavorites.add(productId);
        toast.success('Ajouté aux favoris ❤️');
      }
      return newFavorites;
    });
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast.success(`${product.name} ajouté au panier !`);
  };

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
            {displayProducts.map((product) => {
              const displayPrice = product.sale_price || product.regular_price;
              const hasDiscount = product.sale_price && product.sale_price < (product.regular_price || 0);
              const isInStock = !product.stock_quantity || product.stock_quantity > 0;
              const isFavorite = favorites.has(product.id);

              return (
                <div
                  key={product.id}
                  className="group relative bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden"
                >
                  <Link href={`/product/${product.slug}`} className="block">
                    <div className="aspect-square relative overflow-hidden bg-gray-50">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <ShoppingCart className="h-16 w-16" />
                        </div>
                      )}

                      {hasDiscount && (
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-pink-400 to-pink-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
                          PROMO
                        </div>
                      )}

                      <button
                        onClick={(e) => toggleFavorite(product.id, e)}
                        className="absolute top-3 right-3 bg-white hover:bg-gray-50 p-2.5 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                      >
                        <Heart
                          className={`h-5 w-5 transition-colors ${
                            isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
                          }`}
                        />
                      </button>

                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button
                          onClick={(e) => handleAddToCart(product, e)}
                          className="w-full bg-[#C6A15B] hover:bg-[#b8933d] text-white font-semibold rounded-xl shadow-lg"
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Ajouter
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
                        {product.name}
                      </h3>

                      <div className="flex items-center gap-2">
                        {isInStock ? (
                          <Badge variant="outline" className="text-xs border-green-200 bg-green-50 text-green-700">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                            Disponible
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs border-red-200 bg-red-50 text-red-700">
                            Rupture
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-baseline gap-2">
                        {hasDiscount ? (
                          <>
                            <span className="text-gray-400 line-through text-sm">
                              {product.regular_price?.toFixed(2)} €
                            </span>
                            <span className="text-[#C6A15B] font-bold text-xl">
                              {displayPrice?.toFixed(2)} €
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-900 font-bold text-xl">
                            {displayPrice?.toFixed(2)} €
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
