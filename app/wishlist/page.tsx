'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface WishlistItem {
  id: string;
  product_id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  image_url: string | null;
}

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = () => {
    try {
      const savedWishlist = localStorage.getItem('wishlist');
      if (savedWishlist) {
        const items = JSON.parse(savedWishlist);
        setWishlistItems(items);
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveWishlist = (items: WishlistItem[]) => {
    localStorage.setItem('wishlist', JSON.stringify(items));
    setWishlistItems(items);
  };

  const removeItem = (productId: string) => {
    const updatedWishlist = wishlistItems.filter((item) => item.product_id !== productId);
    saveWishlist(updatedWishlist);
    toast.success('Article retiré des favoris');
  };

  const clearWishlist = () => {
    saveWishlist([]);
    toast.success('Liste de favoris vidée');
  };

  const addToCart = (item: WishlistItem) => {
    try {
      const savedCart = localStorage.getItem('cart');
      const cart = savedCart ? JSON.parse(savedCart) : [];

      const existingItem = cart.find((cartItem: any) => cartItem.product_id === item.product_id);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({
          id: item.id,
          product_id: item.product_id,
          name: item.name,
          slug: item.slug,
          price: item.sale_price || item.price,
          image_url: item.image_url,
          quantity: 1,
        });
      }

      localStorage.setItem('cart', JSON.stringify(cart));
      toast.success('Article ajouté au panier');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Erreur lors de l\'ajout au panier');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">Chargement...</div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
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
          <Button asChild size="lg" className="bg-[#C6A15B] hover:bg-[#B8934D] text-white">
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
            <p className="text-gray-600">{wishlistItems.length} article{wishlistItems.length > 1 ? 's' : ''}</p>
          </div>
          <Button variant="ghost" onClick={clearWishlist} className="text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4 mr-2" />
            Tout supprimer
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistItems.map((item) => (
            <Card key={item.id} className="group overflow-hidden relative border-gray-200 hover:border-[#C6A15B] transition-colors">
              <button
                onClick={() => removeItem(item.product_id)}
                className="absolute top-3 right-3 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-sm transition-all"
              >
                <Heart className="h-5 w-5 fill-red-500 text-red-500" />
              </button>

              <Link href={`/product/${item.slug}`}>
                <div className="aspect-square overflow-hidden bg-gray-100">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
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
                <Link href={`/product/${item.slug}`}>
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-[#C6A15B] transition-colors">
                    {item.name}
                  </h3>
                </Link>

                <div className="flex items-center gap-2 mb-4">
                  {item.sale_price ? (
                    <>
                      <span className="text-lg font-bold text-[#C6A15B]">
                        {item.sale_price.toFixed(2)} €
                      </span>
                      <span className="text-sm text-gray-500 line-through">
                        {item.price.toFixed(2)} €
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-bold">
                      {item.price.toFixed(2)} €
                    </span>
                  )}
                </div>

                <Button
                  onClick={() => addToCart(item)}
                  className="w-full bg-[#C6A15B] hover:bg-[#B8934D] text-white"
                  size="sm"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Ajouter au panier
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
