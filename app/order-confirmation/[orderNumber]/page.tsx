"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CircleCheck as CheckCircle, Package, MapPin, Loader as Loader2, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  shipping_address: any;
  order_items: OrderItem[];
}

interface OrderItem {
  product_name: string;
  product_slug: string;
  product_image: string;
  price: string;
  quantity: number;
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const paypalParam = searchParams.get('paypal');
    if (paypalParam === 'success') {
      handlePayPalReturn();
    } else if (paypalParam === 'check') {
      checkPayPalStatus();
    } else if (paypalParam === 'cancelled') {
      handlePayPalCancel();
    } else {
      loadOrder();
    }
  }, [user, params.orderNumber]);

  const handlePayPalCancel = async () => {
    toast.error('Paiement PayPal annulé');
    localStorage.removeItem('paypal_order_id');
    localStorage.removeItem('pending_order_id');
    localStorage.removeItem('pending_order_number');

    if (window.opener) {
      setTimeout(() => {
        window.close();
      }, 1500);
    } else {
      router.push('/checkout');
    }
  };

  const checkPayPalStatus = async () => {
    try {
      const pendingOrderId = localStorage.getItem('pending_order_id');

      if (!pendingOrderId) {
        await loadOrder();
        return;
      }

      const { data: orderData } = await supabase
        .from('orders')
        .select('status')
        .eq('id', pendingOrderId)
        .single();

      if (orderData?.status === 'processing' || orderData?.status === 'completed') {
        localStorage.removeItem('paypal_order_id');
        localStorage.removeItem('pending_order_id');
        localStorage.removeItem('pending_order_number');
        toast.success('Paiement effectué avec succès !');
      }

      await loadOrder();
    } catch (error) {
      console.error('Error checking PayPal status:', error);
      await loadOrder();
    }
  };

  const handlePayPalReturn = async () => {
    try {
      const paypalOrderId = localStorage.getItem('paypal_order_id');
      const pendingOrderId = localStorage.getItem('pending_order_id');

      if (!paypalOrderId || !pendingOrderId) {
        toast.error('Informations de paiement manquantes');
        await loadOrder();
        return;
      }

      const captureResponse = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId: paypalOrderId }),
      });

      const captureData = await captureResponse.json();

      if (!captureResponse.ok) {
        console.error('PayPal capture error:', captureData);
        throw new Error(captureData.error || 'Erreur lors de la capture du paiement PayPal');
      }

      const { data: orderData } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', pendingOrderId)
        .single();

      if (!orderData) {
        throw new Error('Commande introuvable');
      }

      await supabase
        .from('orders')
        .update({
          status: 'processing',
          payment_method: 'paypal',
          payment_id: captureData.captureId,
        })
        .eq('id', pendingOrderId);

      const wooOrderData = {
        payment_method: 'paypal',
        payment_method_title: 'PayPal',
        set_paid: true,
        billing: {
          first_name: orderData.shipping_address.first_name,
          last_name: orderData.shipping_address.last_name,
          address_1: orderData.shipping_address.address_line1,
          address_2: orderData.shipping_address.address_line2 || '',
          city: orderData.shipping_address.city,
          postcode: orderData.shipping_address.postal_code,
          country: orderData.shipping_address.country,
          email: user?.email || '',
          phone: orderData.shipping_address.phone,
        },
        shipping: {
          first_name: orderData.shipping_address.first_name,
          last_name: orderData.shipping_address.last_name,
          address_1: orderData.shipping_address.address_line1,
          address_2: orderData.shipping_address.address_line2 || '',
          city: orderData.shipping_address.city,
          postcode: orderData.shipping_address.postal_code,
          country: orderData.shipping_address.country,
        },
        line_items: orderData.order_items.map((item: any) => ({
          product_id: item.product_id || 0,
          quantity: item.quantity,
        })),
        meta_data: [
          {
            key: '_paypal_transaction_id',
            value: captureData.captureId,
          },
          {
            key: '_paypal_order_id',
            value: paypalOrderId,
          },
        ],
      };

      const wooResponse = await fetch('/api/woocommerce/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wooOrderData),
      });

      if (wooResponse.ok) {
        const wooOrder = await wooResponse.json();
        await supabase
          .from('orders')
          .update({
            woocommerce_order_id: wooOrder.id,
          })
          .eq('id', pendingOrderId);
      }

      localStorage.removeItem('paypal_order_id');
      localStorage.removeItem('pending_order_id');
      localStorage.removeItem('pending_order_number');

      toast.success('Paiement PayPal confirmé !');

      if (window.opener) {
        setTimeout(() => {
          window.close();
        }, 1500);
      } else {
        await loadOrder();
      }
    } catch (error) {
      console.error('PayPal return error:', error);
      toast.error('Erreur lors de la confirmation du paiement');

      if (window.opener) {
        setTimeout(() => {
          window.close();
        }, 2000);
      } else {
        await loadOrder();
      }
    }
  };

  const loadOrder = async () => {
    if (!user || !params.orderNumber) return;

    const { data: orderData } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', params.orderNumber)
      .eq('user_id', user.id)
      .single();

    if (!orderData) {
      router.push('/account/orders');
      return;
    }

    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderData.id);

    setOrder({
      ...orderData,
      order_items: items || [],
    });

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#b8933d]" />
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Commande confirmée !
            </h1>
            <p className="text-gray-600">
              Merci pour votre commande. Nous vous enverrons une confirmation par email.
            </p>
          </div>

          <Card className="mb-6 border-2 border-[#b8933d]/30 bg-gradient-to-br from-amber-50 to-yellow-50">
            <CardContent className="p-6 text-center space-y-3">
              <div className="flex justify-center">
                <Star className="w-8 h-8 text-[#b8933d] fill-[#b8933d]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Une dernière chose avant de partir...
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Votre expérience nous intéresse ! Prenez quelques instants pour partager votre avis sur notre boutique. Votre témoignage aide d'autres clientes à faire le bon choix et nous permet de nous améliorer continuellement.
              </p>
              <Link href="/livre-dor">
                <Button className="bg-[#b8933d] hover:bg-[#a07c2f] text-white">
                  <Star className="w-4 h-4 mr-2" />
                  Laisser un avis
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600">Numéro de commande</p>
                  <p className="text-lg font-semibold text-gray-900">{order.order_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(order.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-2">Total payé</p>
                <p className="text-2xl font-bold text-[#b8933d]">
                  {order.total_amount.toFixed(2)} €
                </p>
              </div>
            </CardContent>
          </Card>

          {order.shipping_address && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-[#b8933d]" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Adresse de livraison
                  </h2>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="font-medium text-gray-900">
                    {order.shipping_address.first_name} {order.shipping_address.last_name}
                  </p>
                  <p>{order.shipping_address.address_line1}</p>
                  {order.shipping_address.address_line2 && (
                    <p>{order.shipping_address.address_line2}</p>
                  )}
                  <p>
                    {order.shipping_address.postal_code} {order.shipping_address.city}
                  </p>
                  <p>{order.shipping_address.country}</p>
                  <p>{order.shipping_address.phone}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5 text-[#b8933d]" />
                <h2 className="text-lg font-semibold text-gray-900">Articles commandés</h2>
              </div>
              <div className="space-y-4">
                {order.order_items.map((item, index) => {
                  const price = parseFloat(
                    item.price?.replace('€', '').replace(',', '.') || '0'
                  );
                  const total = price * item.quantity;

                  return (
                    <div key={index} className="flex gap-4 pb-4 border-b last:border-0">
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                        {item.product_image ? (
                          <Image
                            src={item.product_image}
                            alt={item.product_name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Package className="h-8 w-8 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 justify-between">
                        <div>
                          <Link
                            href={`/product/${item.product_slug}`}
                            className="font-medium text-gray-900 hover:text-[#b8933d]"
                          >
                            {item.product_name}
                          </Link>
                          <p className="text-sm text-gray-500">Quantité: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-gray-900">{total.toFixed(2)} €</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/account/orders">
              <Button variant="outline" size="lg">
                Voir mes commandes
              </Button>
            </Link>
            <Link href="/en-rayon">
              <Button className="bg-[#b8933d] hover:bg-[#a07c2f]" size="lg">
                Continuer mes achats
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
