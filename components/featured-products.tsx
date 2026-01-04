'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, Product } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_featured', true)
        .eq('status', 'publish')
        .limit(8);

      if (data) {
        setProducts(data);
      }
      setLoading(false);
    };

    fetchFeaturedProducts();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="rounded-xl overflow-hidden">
            <div className="aspect-square bg-gray-200 animate-pulse" />
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Sparkles className="h-8 w-8 text-[#D4AF37]" />
          <h2 className="text-4xl font-bold">Produits en Vedette</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link key={product.id} href={`/product/${product.slug}`}>
              <Card className="rounded-xl overflow-hidden shadow-soft hover:shadow-xl transition-smooth transform hover:-translate-y-1 cursor-pointer">
                <div className="aspect-square overflow-hidden bg-gray-100">
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
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    {product.sale_price && product.sale_price < (product.regular_price || 0) ? (
                      <>
                        <span className="text-[#D4AF37] font-bold">
                          {product.sale_price.toFixed(2)}€
                        </span>
                        <span className="text-gray-400 line-through text-sm">
                          {product.regular_price?.toFixed(2)}€
                        </span>
                      </>
                    ) : (
                      <span className="font-bold">
                        {product.regular_price?.toFixed(2)}€
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
