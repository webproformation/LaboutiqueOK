"use client";

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Info } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { formatPrice, parsePrice } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase-client';
import GiftProgressBar from '@/components/GiftProgressBar';

const WalletSelector = dynamic(() => import('@/components/WalletSelector'), {
  ssr: false,
});

const MINIMUM_ORDER_AMOUNT = 10;

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [walletAmount, setWalletAmount] = useState(0);
  const [finalTotal, setFinalTotal] = useState(cartTotal);
  const [isFirstOrder, setIsFirstOrder] = useState(true);
  const [isCheckingFirstOrder, setIsCheckingFirstOrder] = useState(true);
  const [deliveryBatchId, setDeliveryBatchId] = useState<string | null>(null);

  useEffect(() => {
    const savedWalletAmount = localStorage.getItem('cart_wallet_amount');
    if (savedWalletAmount) {
      const amount = parseFloat(savedWalletAmount);
      if (amount > 0 && amount <= cartTotal) {
        setWalletAmount(amount);
      } else {
        localStorage.removeItem('cart_wallet_amount');
      }
    }
  }, [cartTotal]);

  useEffect(() => {
    setFinalTotal(Math.max(0, cartTotal - walletAmount));
  }, [cartTotal, walletAmount]);

  useEffect(() => {
    const checkIfFirstOrder = async () => {
      if (!user) {
        setIsCheckingFirstOrder(false);
        setIsFirstOrder(true);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('status', ['processing', 'completed', 'shipped']);

        if (!error) {
          setIsFirstOrder((data?.length || 0) === 0);
        }
      } catch (error) {
        console.error('Error checking first order:', error);
        setIsFirstOrder(true);
      } finally {
        setIsCheckingFirstOrder(false);
      }
    };

    checkIfFirstOrder();
  }, [user]);

  useEffect(() => {
    const fetchDeliveryBatch = async () => {
      if (!user) return;

      try {
        const { data } = await supabase
          .from('delivery_batches')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .single();

        if (data) {
          setDeliveryBatchId(data.id);
        }
      } catch (error) {
        console.error('Error fetching delivery batch:', error);
      }
    };

    fetchDeliveryBatch();
  }, [user]);

  const handleWalletAmountChange = (amount: number) => {
    setWalletAmount(amount);
    if (amount > 0) {
      localStorage.setItem('cart_wallet_amount', amount.toString());
    } else {
      localStorage.removeItem('cart_wallet_amount');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-24 w-24 text-gray-300" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Votre panier est vide</h1>
        <p className="mt-2 text-gray-600">Commencez vos achats dès maintenant !</p>
        <Link href="/">
          <Button className="mt-6 bg-[#b8933d] hover:bg-[#a07c2f] text-white">
            Découvrir nos produits
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-[#b8933d]"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Continuer mes achats
      </Link>

      <h1 className="mb-8 text-3xl font-bold text-gray-900">Mon Panier</h1>

      <div className="mb-8">
        <GiftProgressBar
          cartTotal={cartTotal}
          deliveryBatchId={deliveryBatchId}
        />
      </div>

      <div className="flex flex-col lg:grid gap-8 lg:grid-cols-3">
        <div className="order-2 lg:order-1 lg:col-span-2 space-y-4">
          {cart.map((item) => {
            const displayPrice = item.variationPrice || item.price;
            const displayImage = item.variationImage || item.image;
            const price = parsePrice(displayPrice);
            const total = price * item.quantity;

            return (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                      {displayImage?.sourceUrl ? (
                        <Image
                          src={displayImage.sourceUrl}
                          alt={item.name}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ShoppingBag className="h-8 w-8 text-gray-300" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        {item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 && (
                          <div className="mt-2 space-y-1">
                            {Object.entries(item.selectedAttributes).map(([key, value]) => {
                              const formattedKey = key
                                .replace(/^pa_/, '')
                                .replace(/-/g, ' ')
                                .replace(/_/g, ' ')
                                .split(' ')
                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(' ');

                              return (
                                <div key={key} className="text-sm text-gray-700">
                                  <span className="font-bold">{formattedKey}:</span> {value}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <p className="mt-2 text-sm font-medium text-[#b8933d]">{formatPrice(displayPrice)}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="flex items-center space-x-4">
                          <p className="font-semibold text-gray-900">
                            {total.toFixed(2)} €
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                            className="text-[#DF30CF] hover:text-[#c82bb7] hover:bg-pink-50"
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

          <Button
            variant="outline"
            onClick={clearCart}
            className="mt-4 text-[#DF30CF] hover:text-[#c82bb7]"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Vider le panier
          </Button>
        </div>

        <div className="order-1 lg:order-2 lg:col-span-1">
          <Card className="lg:sticky lg:top-24">
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
                  <span className="font-medium">Calculés à l&apos;étape suivante</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total TTC</span>
                <span className="text-[#b8933d]">{cartTotal.toFixed(2)} €</span>
              </div>

              <WalletSelector
                cartTotal={cartTotal}
                onWalletAmountChange={handleWalletAmountChange}
                currentWalletAmount={walletAmount}
              />

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
                    Pour votre première commande, le montant minimum est de {MINIMUM_ORDER_AMOUNT.toFixed(2)} €<br />
                    Il vous manque {(MINIMUM_ORDER_AMOUNT - finalTotal).toFixed(2)} €
                  </AlertDescription>
                </Alert>
              )}

              <Link href="/checkout" className="block">
                <Button
                  className="w-full bg-[#b8933d] hover:bg-[#a07c2f] text-white"
                  size="lg"
                  disabled={isFirstOrder && finalTotal < MINIMUM_ORDER_AMOUNT}
                >
                  Passer la commande
                </Button>
              </Link>

              <p className="text-center text-xs text-gray-500">
                Paiement sécurisé
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
