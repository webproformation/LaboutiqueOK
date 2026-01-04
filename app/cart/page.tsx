'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  product_id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
  quantity: number;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const items = JSON.parse(savedCart);
        setCartItems(items);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCart = (items: CartItem[]) => {
    localStorage.setItem('cart', JSON.stringify(items));
    setCartItems(items);
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(productId);
      return;
    }

    const updatedCart = cartItems.map((item) =>
      item.product_id === productId ? { ...item, quantity: newQuantity } : item
    );
    saveCart(updatedCart);
  };

  const removeItem = (productId: string) => {
    const updatedCart = cartItems.filter((item) => item.product_id !== productId);
    saveCart(updatedCart);
    toast.success('Article retiré du panier');
  };

  const clearCart = () => {
    saveCart([]);
    toast.success('Panier vidé');
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const calculateItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">Chargement...</div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
            <ShoppingCart className="h-10 w-10 text-gray-400" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Votre panier est vide</h1>
          <p className="text-gray-600 mb-8">
            Découvrez nos produits et ajoutez vos coups de cœur à votre panier
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
          <h1 className="text-3xl font-bold">Mon panier</h1>
          <Button variant="ghost" onClick={clearCart} className="text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4 mr-2" />
            Vider le panier
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Link href={`/product/${item.slug}`} className="flex-shrink-0">
                      <div className="w-24 h-24 bg-gray-100 rounded overflow-hidden">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            Pas d'image
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${item.slug}`}>
                        <h3 className="font-semibold mb-2 hover:text-[#C6A15B] transition-colors">
                          {item.name}
                        </h3>
                      </Link>
                      <p className="text-lg font-bold text-[#C6A15B] mb-3">
                        {item.price.toFixed(2)} €
                      </p>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center border rounded">
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            className="p-2 hover:bg-gray-100 transition-colors"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val) && val > 0) {
                                updateQuantity(item.product_id, val);
                              }
                            }}
                            className="w-16 text-center border-0 focus-visible:ring-0"
                            min="1"
                          />
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            className="p-2 hover:bg-gray-100 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.product_id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {(item.price * item.quantity).toFixed(2)} €
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-4 border-[#C6A15B]">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-6">Récapitulatif</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Articles ({calculateItemCount()})</span>
                    <span>{calculateTotal().toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Livraison</span>
                    <span className="text-sm">Calculée à l'étape suivante</span>
                  </div>
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span className="text-[#C6A15B]">{calculateTotal().toFixed(2)} €</span>
                    </div>
                  </div>
                </div>

                <Button asChild className="w-full mb-4 bg-[#C6A15B] hover:bg-[#B8934D] text-white" size="lg">
                  <Link href="/contact">
                    Passer commande
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>

                <p className="text-sm text-gray-500 text-center mb-4">
                  Contactez-nous pour finaliser votre commande
                </p>

                <Button asChild variant="outline" className="w-full border-[#C6A15B] text-[#C6A15B] hover:bg-[#C6A15B] hover:text-white">
                  <Link href="/">Continuer mes achats</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
