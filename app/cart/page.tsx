"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, Trash2, Plus, Minus, Info } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { WalletSelector } from '@/components/WalletSelector';
import { GiftProgressBar } from '@/components/GiftProgressBar';

const MINIMUM_ORDER_AMOUNT = 10;

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, cartTotal, cartItemCount, loading } = useCart();
  const { user } = useAuth();
  const [walletAmount, setWalletAmount] = useState(0);
  const [isFirstOrder, setIsFirstOrder] = useState(true);

  const parsePrice = (price: string | number): number => {
    if (typeof price === 'number') return price;
    const cleaned = price.replace(/[^0-9.,]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  const formatPrice = (price: string | number): string => {
    const numPrice = typeof price === 'number' ? price : parsePrice(price);
    return numPrice.toFixed(2);
  };

  const handleWalletAmountChange = (amount: number) => {
    setWalletAmount(amount);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart_wallet_amount', amount.toString());
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cart_wallet_amount');
      if (saved) {
        setWalletAmount(parseFloat(saved));
      }
    }
  }, []);

  const finalTotal = Math.max(0, cartTotal - walletAmount);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="flex flex-col lg:grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <Skeleton className="h-24 w-24 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-32" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="lg:col-span-1">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
            <ShoppingBag className="h-12 w-12 text-gray-300" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Votre panier est vide</h1>
          <p className="text-lg text-gray-600 mb-8">
            Commencez vos achats dès maintenant et découvrez nos produits exclusifs !
          </p>
          <Link href="/">
            <Button className="bg-[#b8933d] hover:bg-[#a07c2f]" size="lg">
              Découvrir nos produits
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mon Panier</h1>
          <Button
            variant="ghost"
            onClick={clearCart}
            className="text-pink-600 hover:text-pink-700 hover:bg-pink-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Vider le panier
          </Button>
        </div>

        <div className="flex flex-col lg:grid gap-8 lg:grid-cols-3">
          <div className="order-2 lg:order-1 lg:col-span-2 space-y-4">
            {cart.map((item) => {
              if (!item) return null;

              const displayPrice = item.variationPrice || item.price;
              const displayImage = item.variationImage?.src || item.image?.sourceUrl || '/placeholder.png';
              const itemId = item.variationId ? `${item.id}-${item.variationId}` : item.id;
              const price = parsePrice(displayPrice);
              const total = price * item.quantity;

              return (
                <Card key={itemId} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                        <Image
                          src={displayImage}
                          alt={item.name}
                          fill
                          sizes="96px"
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder.png';
                          }}
                        />
                      </div>

                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <Link href={`/product/${item.slug}`}>
                            <h3 className="font-semibold text-gray-900 hover:text-[#b8933d] transition-colors">
                              {item.name}
                            </h3>
                          </Link>

                          {item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 && (
                            <div className="mt-2 space-y-1">
                              {Object.entries(item.selectedAttributes).map(([key, value]) => {
                                const formattedKey = key.replace(/^attribute_/, '').replace(/_/g, ' ');
                                const displayValue = typeof value === 'object' && value !== null
                                  ? (value as any)?.name || (value as any)?.option || String(value || '')
                                  : String(value || '');
                                return (
                                  <div key={key} className="text-sm text-gray-700">
                                    <span className="font-semibold capitalize">{formattedKey}:</span>{' '}
                                    <span>{displayValue}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <p className="mt-2 text-sm font-medium text-[#b8933d]">
                            {formatPrice(displayPrice)} €
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(itemId, item.quantity - 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-12 text-center text-sm font-medium">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(itemId, item.quantity + 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="flex items-center space-x-4">
                            <p className="text-lg font-semibold text-gray-900">
                              {total.toFixed(2)} €
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(itemId)}
                              className="text-pink-600 hover:text-pink-700 hover:bg-pink-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="order-1 lg:order-2 lg:col-span-1">
            <div className="space-y-4">
              <GiftProgressBar cartTotal={cartTotal} />

              <Card className="lg:sticky lg:top-24 border-2 border-[#b8933d]">
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-xl font-bold text-gray-900">Récapitulatif</h2>
                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sous-total HT</span>
                      <span className="font-medium">{(cartTotal / 1.20).toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">TVA (20%)</span>
                      <span className="font-medium">{(cartTotal - (cartTotal / 1.20)).toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Frais de port</span>
                      <span className="text-sm text-gray-500">Calculés à l'étape suivante</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total TTC</span>
                    <span className="text-[#b8933d]">{cartTotal.toFixed(2)} €</span>
                  </div>

                  {user && <WalletSelector
                    cartTotal={cartTotal}
                    onWalletAmountChange={handleWalletAmountChange}
                    currentWalletAmount={walletAmount}
                  />}

                  {walletAmount > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-green-800">Cagnotte utilisée</span>
                        <span className="font-semibold text-green-900">-{walletAmount.toFixed(2)} €</span>
                      </div>
                      <Separator className="my-2 bg-green-200" />
                      <div className="flex justify-between text-base font-bold">
                        <span className="text-gray-900">Reste à payer</span>
                        <span className="text-[#b8933d]">{finalTotal.toFixed(2)} €</span>
                      </div>
                    </div>
                  )}

                  {isFirstOrder && finalTotal < MINIMUM_ORDER_AMOUNT && (
                    <Alert className="bg-orange-50 border-orange-200">
                      <Info className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-sm text-orange-800">
                        Pour votre première commande, le montant minimum est de {MINIMUM_ORDER_AMOUNT.toFixed(2)} €
                        <br />
                        Il vous manque <strong>{(MINIMUM_ORDER_AMOUNT - finalTotal).toFixed(2)} €</strong>
                      </AlertDescription>
                    </Alert>
                  )}

                  <Link href="/checkout" className="block">
                    <Button
                      className="w-full bg-[#b8933d] hover:bg-[#a07c2f]"
                      size="lg"
                      disabled={isFirstOrder && finalTotal < MINIMUM_ORDER_AMOUNT}
                    >
                      Passer la commande
                    </Button>
                  </Link>

                  <p className="text-center text-xs text-gray-500">
                    🔒 Paiement 100% sécurisé
                  </p>

                  <Link href="/" className="block">
                    <Button variant="outline" className="w-full border-[#b8933d] text-[#b8933d] hover:bg-[#b8933d]/5">
                      Continuer mes achats
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
