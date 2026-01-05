'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Trash2, ShoppingCart, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  main_image_url: string | null;
  stock: number;
}

export default function WishlistPage() {
  const { user } = useAuth();
  const { wishlistItems, toggleWishlist } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlistProducts();
  }, [wishlistItems]);

  const loadWishlistProducts = async () => {
    if (wishlistItems.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, price, sale_price, main_image_url, stock')
        .in('id', wishlistItems);

      if (error) throw error;

      setProducts(data || []);
    } catch (error) {
      console.error('Error loading wishlist products:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId: string) => {
    await toggleWishlist(productId);
  };

  const addToCart = (product: Product) => {
    try {
      const savedCart = localStorage.getItem('cart');
      const cart = savedCart ? JSON.parse(savedCart) : [];

      const existingItem = cart.find((cartItem: any) => cartItem.product_id === product.id);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({
          id: product.id,
          product_id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.sale_price || product.price,
          image_url: product.main_image_url,
          quantity: 1,
        });
      }

      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cartUpdated'));
      toast.success('Article ajouté au panier');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Erreur lors de l\'ajout au panier');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
            <Heart className="h-10 w-10 text-gray-400" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Votre liste de favoris est vide</h1>
          <p className="text-gray-600 mb-8">
            Ajoutez des produits à vos favoris pour les retrouver facilement plus tard
          </p>
          <Button asChild size="lg" className="bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d] text-white">
            <Link href="/">
              Découvrir nos produits
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mes favoris</h1>
            <p className="text-gray-600">{products.length} article{products.length > 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="group overflow-hidden relative border-gray-200 hover:border-[#D4AF37] transition-colors">
              <button
                onClick={() => removeItem(product.id)}
                className="absolute top-3 right-3 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-sm transition-all"
              >
                <Heart className="h-5 w-5 fill-red-500 text-red-500" />
              </button>

              <Link href={`/product/${product.slug}`}>
                <div className="aspect-square overflow-hidden bg-gray-100">
                  {product.main_image_url ? (
                    <img
                      src={product.main_image_url}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Pas d'image
                    </div>
                  )}
                </div>
              </Link>

              <CardContent className="p-4">
                <Link href={`/product/${product.slug}`}>
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-[#D4AF37] transition-colors">
                    {product.name}
                  </h3>
                </Link>

                <div className="flex items-center gap-2 mb-4">
                  {product.sale_price ? (
                    <>
                      <span className="text-lg font-bold text-[#D4AF37]">
                        {product.sale_price.toFixed(2)} €
                      </span>
                      <span className="text-sm text-gray-500 line-through">
                        {product.price.toFixed(2)} €
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-bold">
                      {product.price.toFixed(2)} €
                    </span>
                  )}
                </div>

                {product.stock > 0 ? (
                  <Button
                    onClick={() => addToCart(product)}
                    className="w-full bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d] text-white"
                    size="sm"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Ajouter au panier
                  </Button>
                ) : (
                  <Button
                    disabled
                    className="w-full"
                    size="sm"
                    variant="outline"
                  >
                    Rupture de stock
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
