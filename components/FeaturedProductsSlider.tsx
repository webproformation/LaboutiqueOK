'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_PRODUCTS_BY_IDS } from '@/lib/queries';
import { supabase } from '@/lib/supabase-client';
import ProductCard from './ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';

interface GetProductsByIdsResponse {
  products: {
    nodes: any[];
  };
}

export default function FeaturedProductsSlider() {
  const [featuredProductIds, setFeaturedProductIds] = useState<number[]>([]);
  const [loadingIds, setLoadingIds] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('featured_products')
          .select('product_id')
          .eq('is_active', true)
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false });

        if (error) throw error;

        const ids = data?.map((item: any) => item.product_id) || [];
        setFeaturedProductIds(ids);
      } catch (error) {
        console.error('Error fetching featured products:', error);
      } finally {
        setLoadingIds(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  const { data: productsData, loading, error: apolloError } = useQuery<GetProductsByIdsResponse>(GET_PRODUCTS_BY_IDS, {
    variables: { ids: featuredProductIds },
    skip: loadingIds || featuredProductIds.length === 0,
  });

  useEffect(() => {
    if (featuredProductIds.length > 0) {
      console.log('[FeaturedProductsSlider] Featured product IDs:', featuredProductIds);
    }
    if (productsData) {
      console.log('[FeaturedProductsSlider] GraphQL response:', productsData);
      console.log('[FeaturedProductsSlider] Products found:', productsData?.products?.nodes?.length || 0);
    }
    if (apolloError) {
      console.error('[FeaturedProductsSlider] Apollo error:', apolloError);
    }
  }, [featuredProductIds, productsData, apolloError]);

  if (loadingIds || loading) {
    return (
      <div className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-4" style={{ color: '#C6A15B' }}>Les pépites du moment</h2>
            <p className="text-gray-600 text-lg">
              Ces pièces que vous adorez... et que nous aussi !
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-96 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (apolloError) {
    console.error('[FeaturedProductsSlider] Error loading featured products:', apolloError);
    return null;
  }

  if (featuredProductIds.length === 0) {
    console.log('[FeaturedProductsSlider] No featured products configured');
    return null;
  }

  if (!productsData?.products?.nodes || productsData.products.nodes.length === 0) {
    console.log('[FeaturedProductsSlider] No products returned from WooCommerce');
    return null;
  }

  const products = productsData.products.nodes;

  return (
    <div className="py-12 bg-gray-50 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-4" style={{ color: '#C6A15B' }}>Les pépites du moment</h2>
          <p className="text-gray-600 text-lg">
            Ces pièces que vous adorez... et que nous aussi !
          </p>
        </div>
        <div className="overflow-hidden">
          <Carousel
            opts={{
              align: 'start',
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 4000,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {products.map((product: any, index: number) => (
                <CarouselItem
                  key={product.databaseId}
                  className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 animate-in fade-in duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <ProductCard product={product} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>
      </div>
    </div>
  );
}
