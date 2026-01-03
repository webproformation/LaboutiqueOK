"use client";

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_PRODUCT_CATEGORIES, GET_PRODUCTS_PAGINATED } from '@/lib/queries';
import { GetProductCategoriesResponse, ProductCategory, Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import Image from 'next/image';
import { Home } from 'lucide-react';
import { parsePrice } from '@/lib/utils';
import { enrichProductsWithSupabaseImages } from '@/lib/supabase-product-mapper';

interface ProductsResponse {
  products: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string;
    };
    nodes: Product[];
  };
}

export default function EnRayonPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const { data: categoriesData, loading: loadingCategories } = useQuery<GetProductCategoriesResponse>(
    GET_PRODUCT_CATEGORIES
  );

  const { data: productsData, loading: loadingProducts, fetchMore } = useQuery<ProductsResponse>(
    GET_PRODUCTS_PAGINATED,
    {
      variables: { first: 20, after: null },
    }
  );

  useEffect(() => {
    if (productsData) {
      const sortedProducts = [...productsData.products.nodes].sort((a, b) => {
        const priceA = parsePrice(a.price);
        const priceB = parsePrice(b.price);
        return priceA - priceB;
      });

      // ENRICHISSEMENT SUPABASE
      console.log('[EnRayonPage] 🎯 Enriching', sortedProducts.length, 'products with Supabase images');
      enrichProductsWithSupabaseImages(sortedProducts)
        .then(enriched => {
          console.log('[EnRayonPage] ✅ Enrichment complete');
          setProducts(enriched);
        })
        .catch(error => {
          console.error('[EnRayonPage] ❌ Enrichment error:', error);
          setProducts(sortedProducts);
        });

      setHasNextPage(productsData.products.pageInfo.hasNextPage);
      setEndCursor(productsData.products.pageInfo.endCursor);
    }
  }, [productsData]);

  const categories = categoriesData?.productCategories?.nodes || [];
  const topLevelCategories = categories.filter(cat => !cat.parentId);

  const loadMore = async () => {
    if (!hasNextPage || loadingProducts || !endCursor) return;

    try {
      const { data } = await fetchMore({
        variables: {
          first: 20,
          after: endCursor,
        },
      });

      if (data) {
        const newProducts = [...data.products.nodes];
        setProducts(prev => {
          const combined = [...prev, ...newProducts];
          return combined.sort((a, b) => {
            const priceA = parsePrice(a.price);
            const priceB = parsePrice(b.price);
            return priceA - priceB;
          });
        });
        setHasNextPage(data.products.pageInfo.hasNextPage);
        setEndCursor(data.products.pageInfo.endCursor);
      }
    } catch (error) {
      console.error('Error loading more products:', error);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !loadingProducts) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, loadingProducts, endCursor]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-6">
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-[#b8933d] flex items-center gap-1">
            <Home className="h-4 w-4" />
            Accueil
          </Link>
          <span>/</span>
          <span className="text-gray-900">En rayon</span>
        </nav>

        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            La boutique de
          </h1>
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            MORGANE
          </h2>
          <h3 className="text-3xl md:text-4xl font-bold text-[#b8933d]">
            En rayon
          </h3>
        </div>

        {loadingCategories ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {topLevelCategories.slice(0, 8).map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="group relative aspect-[3/4] overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{
                    backgroundImage: `url(${
                      category.image?.sourceUrl ||
                      'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1200'
                    })`,
                  }}
                >
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                </div>

                <div className="relative h-full flex flex-col items-center justify-center p-6 text-center">
                  <h3 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                    {category.name}
                  </h3>
                  {category.count > 0 && (
                    <p className="text-sm text-white/90">
                      {category.count} produit{category.count > 1 ? 's' : ''}
                    </p>
                  )}
                  <div className="mt-4 px-6 py-2 bg-white text-gray-900 font-semibold rounded-full opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    Découvrir
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Tous nos produits
          </h3>
          <p className="text-gray-600">
            Découvrez notre sélection complète
          </p>
        </div>

        {loadingProducts && products.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {products.map((product) => (
                <ProductCard key={`${product.id}-${product.slug}`} product={product} />
              ))}
            </div>

            <div ref={observerTarget} className="py-8 flex justify-center">
              {loadingProducts && (
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#b8933d]"></div>
                  <span>Chargement...</span>
                </div>
              )}
              {!hasNextPage && products.length > 0 && (
                <p className="text-gray-600">Vous avez vu tous les produits</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
