'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import ProductCard from '@/components/ProductCard';
import { Package } from 'lucide-react';
import type { Product as ProductType } from '@/types';

interface WooProduct {
  id: number;
  name: string;
  slug: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  images: Array<{ src: string }>;
  stock_status: string;
  categories: Array<{ id: number; name: string; slug: string }>;
  attributes: Array<{ id: number; name: string; options: string[] }>;
}

interface RelatedProductsDisplayProps {
  productId: string;
}

export default function RelatedProductsDisplay({ productId }: RelatedProductsDisplayProps) {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRelatedProducts();
  }, [productId]);

  const loadRelatedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('related_products')
        .select('related_product_id')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        setLoading(false);
        return;
      }

      const productIds = data.map(rel => rel.related_product_id).join(',');
      const response = await fetch(`/api/woocommerce/products?include=${productIds}`);
      const fetchedProducts: WooProduct[] = await response.json();

      const orderedProducts: ProductType[] = data
        .map(rel => {
          const product = fetchedProducts.find((p: WooProduct) => p.id.toString() === rel.related_product_id);
          if (product) {
            return {
              id: product.id.toString(),
              databaseId: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              regularPrice: product.regular_price,
              salePrice: product.sale_price,
              onSale: !!product.sale_price && product.sale_price !== product.regular_price,
              stockStatus: product.stock_status,
              image: product.images[0] ? { sourceUrl: product.images[0].src } : undefined,
              attributes: product.attributes ? {
                nodes: product.attributes.map(attr => ({
                  name: attr.name,
                  options: attr.options,
                }))
              } : undefined,
            } as ProductType;
          }
          return null;
        })
        .filter((p): p is ProductType => p !== null);

      setProducts(orderedProducts);
    } catch (error) {
      console.error('Error loading related products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center text-gray-500">Chargement des produits complémentaires...</div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#b8933d] rounded-full mb-4">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Produits Complémentaires
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Complétez votre look avec ces articles sélectionnés spécialement pour vous
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
