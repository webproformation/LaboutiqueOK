'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ExternalLink } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  regular_price: number | null;
  sale_price: number | null;
}

interface SharedProduct {
  id: string;
  product_id: string;
  is_featured: boolean;
  special_offer: string | null;
  expires_at: string | null;
  products: any;
}

interface LiveProductsProps {
  liveStreamId: string;
}

export function LiveProducts({ liveStreamId }: LiveProductsProps) {
  const [products, setProducts] = useState<SharedProduct[]>([]);
  const { addToCart } = useCart();

  useEffect(() => {
    loadProducts();

    const channel = supabase
      .channel(`products_${liveStreamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_shared_products',
          filter: `live_stream_id=eq.${liveStreamId}`,
        },
        () => {
          loadProducts();
        }
      )
      .subscribe();

    const expirationCheckInterval = setInterval(() => {
      setProducts(prev => {
        const now = new Date();
        return prev.filter(product => {
          if (!product.expires_at) return true;
          return new Date(product.expires_at) > now;
        });
      });
    }, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(expirationCheckInterval);
    };
  }, [liveStreamId]);

  async function loadProducts() {
    const { data, error } = await supabase
      .from('live_shared_products')
      .select(`
        id,
        product_id,
        is_featured,
        special_offer,
        expires_at,
        products (
          id,
          name,
          slug,
          image_url,
          regular_price,
          sale_price
        )
      `)
      .eq('live_stream_id', liveStreamId)
      .eq('is_published', true)
      .order('shared_at', { ascending: false });

    if (error) {
      console.error('Error loading products:', error);
      return;
    }

    const now = new Date();
    const activeProducts = (data || []).filter((product: SharedProduct) => {
      if (!product.expires_at) return true;
      return new Date(product.expires_at) > now;
    });

    setProducts(activeProducts);
  }

  function getPrice(product: Product) {
    return product.sale_price || product.regular_price || 0;
  }

  async function handleAddToCart(product: Product) {
    try {
      await addToCart(product.id, 1);
      toast.success(`${product.name} ajouté au panier !`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Erreur lors de l\'ajout au panier');
    }
  }

  const featuredProduct = products.find(p => p.is_featured);
  const otherProducts = products.filter(p => !p.is_featured);

  return (
    <div className="space-y-6 p-4">
      {featuredProduct && (
        <div className="bg-gradient-to-br from-[#D4AF37]/10 to-[#b8933d]/10 rounded-xl p-4 border-2 border-[#D4AF37] relative overflow-hidden">
          <div className="absolute top-2 right-2 z-10">
            <Badge className="bg-gradient-to-r from-[#D4AF37] to-[#b8933d] text-white font-bold animate-pulse">
              ✨ EN COURS
            </Badge>
          </div>

          <div className="relative aspect-square rounded-lg overflow-hidden mb-4">
            {featuredProduct.products.image_url ? (
              <img
                src={featuredProduct.products.image_url}
                alt={featuredProduct.products.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">Pas d'image</span>
              </div>
            )}
          </div>

          <h3 className="font-bold text-lg mb-2 line-clamp-2">
            {featuredProduct.products.name}
          </h3>

          {featuredProduct.special_offer && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-2 mb-3">
              <p className="text-red-700 text-sm font-semibold text-center">
                🎁 {featuredProduct.special_offer}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <div className="text-2xl font-bold text-[#D4AF37]">
              {getPrice(featuredProduct.products).toFixed(2)}€
            </div>
            {featuredProduct.products.sale_price && (
              <div className="text-gray-500 line-through">
                {featuredProduct.products.regular_price?.toFixed(2)}€
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => handleAddToCart(featuredProduct.products)}
              className="bg-gradient-to-r from-[#D4AF37] to-[#b8933d] hover:from-[#b8933d] hover:to-[#D4AF37]"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10"
            >
              <Link href={`/product/${featuredProduct.products.slug}`}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Détails
              </Link>
            </Button>
          </div>
        </div>
      )}

      <div>
        <h3 className="font-semibold text-lg mb-4 text-gray-900">
          Produits du Live ({otherProducts.length})
        </h3>

        <div className="space-y-4">
          {otherProducts.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow"
            >
              <div className="flex gap-3">
                <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  {item.products.image_url ? (
                    <img
                      src={item.products.image_url}
                      alt={item.products.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      Pas d'image
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm mb-1 line-clamp-2">
                    {item.products.name}
                  </h4>
                  <p className="text-[#D4AF37] font-bold text-lg">
                    {getPrice(item.products).toFixed(2)}€
                  </p>
                  <Button
                    size="sm"
                    onClick={() => handleAddToCart(item.products)}
                    className="mt-2 w-full bg-[#D4AF37] hover:bg-[#b8933d]"
                  >
                    <ShoppingCart className="w-3 h-3 mr-1" />
                    Ajouter
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {products.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>Aucun produit partagé pour le moment</p>
        </div>
      )}
    </div>
  );
}
