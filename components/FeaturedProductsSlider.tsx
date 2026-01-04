'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
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
import { Product } from '@/types';

interface SupabaseProduct {
  id: string;
  woocommerce_id: number;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  regular_price: number;
  sale_price: number | null;
  image_url: string | null;
  images: any;
  stock_status: string;
  stock_quantity: number | null;
  is_active: boolean;
  is_featured: boolean;
  attributes: any;
  variations: any;
  manage_stock: boolean;
}

function mapSupabaseProductToProduct(supabaseProduct: SupabaseProduct): Product {
  const hasVariations = supabaseProduct.variations && Array.isArray(supabaseProduct.variations) && supabaseProduct.variations.length > 0;

  const regularPrice = supabaseProduct.regular_price?.toString() || '0';
  const salePrice = supabaseProduct.sale_price?.toString() || null;
  const price = salePrice || regularPrice;

  return {
    id: supabaseProduct.id,
    databaseId: supabaseProduct.woocommerce_id,
    name: supabaseProduct.name,
    slug: supabaseProduct.slug,
    price: price,
    regularPrice: regularPrice,
    salePrice: salePrice,
    onSale: !!salePrice && parseFloat(salePrice) < parseFloat(regularPrice),
    type: hasVariations ? 'VARIABLE' : 'SIMPLE',
    status: supabaseProduct.is_active ? 'publish' : 'draft',
    stockStatus: supabaseProduct.stock_status || 'instock',
    stockQuantity: supabaseProduct.stock_quantity,
    manageStock: supabaseProduct.manage_stock,
    featured: true,
    description: supabaseProduct.description,
    shortDescription: supabaseProduct.short_description,
    image: supabaseProduct.image_url ? {
      sourceUrl: supabaseProduct.image_url
    } : undefined,
    galleryImages: supabaseProduct.images && Array.isArray(supabaseProduct.images) ? {
      nodes: supabaseProduct.images.map((img: any) => ({
        sourceUrl: img.src || img.image_url || img
      }))
    } : { nodes: [] },
    attributes: supabaseProduct.attributes ? {
      nodes: Array.isArray(supabaseProduct.attributes) ? supabaseProduct.attributes.map((attr: any) => ({
        name: attr.name,
        slug: attr.slug,
        options: attr.options || [],
        variation: attr.variation
      })) : []
    } : { nodes: [] },
    variations: hasVariations ? {
      nodes: supabaseProduct.variations.map((variation: any) => ({
        id: variation.id,
        databaseId: variation.id,
        name: variation.name,
        price: variation.price?.toString() || '0',
        regularPrice: variation.regular_price?.toString(),
        salePrice: variation.sale_price?.toString(),
        onSale: !!variation.sale_price,
        stockStatus: variation.stock_status || 'instock',
        stockQuantity: variation.stock_quantity,
        attributes: variation.attributes || [],
        image: variation.image ? {
          sourceUrl: variation.image.src || variation.image
        } : undefined
      }))
    } : { nodes: [] }
  };
}

export default function FeaturedProductsSlider() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_featured', true)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(12);

        if (error) throw error;

        const mappedProducts = (data || []).map(mapSupabaseProductToProduct);
        setProducts(mappedProducts);
      } catch (error) {
        console.error('Error fetching featured products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  if (loading) {
    return (
      <div className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-4" style={{ color: '#C6A15B' }}>Les pépites du moment</h2>
            <p className="text-gray-600 text-lg">
              Ces pièces que vous adorez... et que nous aussi !
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-4" style={{ color: '#C6A15B' }}>Les pépites du moment</h2>
          <p className="text-gray-600 text-lg">
            Ces pièces que vous adorez... et que nous aussi !
          </p>
        </div>

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
          <CarouselContent>
            {products.map((product) => (
              <CarouselItem key={product.id} className="md:basis-1/3 lg:basis-1/4">
                <div className="p-1">
                  <ProductCard product={product} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </div>
    </div>
  );
}
