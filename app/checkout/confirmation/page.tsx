'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, Clock, CreditCard, MapPin, Phone, Mail, Building2, Hash } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  tax_amount: number;
  wallet_amount_used: number;
  created_at: string;
  shipping_address: any;
  is_open_package: boolean;
}

interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  type: string;
  icon: string;
}

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orderId = searchParams.get('order');
    if (orderId) {
      loadOrderDetails(orderId);
    } else {
      router.push('/');
    }
  }, [searchParams, router]);

  async function loadOrderDetails(orderId: string) {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      if (orderData.payment_method_id) {
        const { data: paymentData } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('id', orderData.payment_method_id)
          .single();

        if (paymentData) {
          setPaymentMethod(paymentData);
        }
      }
    } catch (error) {
      console.error('Error loading order:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F2E8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const getPaymentStatusInfo = () => {
    if (order.is_open_package) {
      return {
        icon: <Package className="h-12 w-12 text-blue-500" />,
        title: 'Commande ajoutée au colis ouvert',
        description: 'Votre commande sera envoyée avec votre colis ouvert. Le paiement sera effectué lors de la clôture du colis.',
        color: 'blue'
      };
    }

    if (paymentMethod?.code === 'bank_transfer') {
      return {
        icon: <Clock className="h-12 w-12 text-orange-500" />,
        title: 'En attente de virement',
        description: 'Votre commande est confirmée. Veuillez effectuer le virement bancaire pour finaliser votre achat.',
        color: 'orange'
      };
    }

    if (paymentMethod?.code === 'store_pickup_payment') {
      return {
        icon: <Clock className="h-12 w-12 text-purple-500" />,
        title: 'À régler en boutique',
        description: 'Votre commande est confirmée. Le paiement sera effectué lors du retrait en boutique.',
        color: 'purple'
      };
    }

    return {
      icon: <CheckCircle className="h-12 w-12 text-green-500" />,
      title: 'Paiement confirmé',
      description: 'Votre commande a été validée et sera traitée dans les plus brefs délais.',
      color: 'green'
    };
  };

  const statusInfo = getPaymentStatusInfo();

  return (
    <div className="min-h-screen bg-[#F2F2E8] py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="mb-6">
          <CardContent className="pt-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                {statusInfo.icon}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {statusInfo.title}
              </h1>
              <p className="text-gray-600 mb-4">
                {statusInfo.description}
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                <Hash className="h-4 w-4 text-gray-600" />
                <span className="font-mono font-semibold text-gray-900">
                  {order.order_number}
                </span>
              </div>
            </div>

            {paymentMethod?.code === 'bank_transfer' && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <Building2 className="h-6 w-6 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold text-blue-900 text-lg mb-3">
                      Informations bancaires
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-semibold text-blue-800">Bénéficiaire</p>
                        <p className="text-blue-900">LA BOUTIQUE DE MORGANE</p>
                      </div>
                      <div>
                        <p className="font-semibold text-blue-800">IBAN</p>
                        <p className="text-blue-900 font-mono">FR76 XXXX XXXX XXXX XXXX XXXX XXX</p>
                      </div>
                      <div>
                        <p className="font-semibold text-blue-800">BIC</p>
                        <p className="text-blue-900 font-mono">XXXXXXXX</p>
                      </div>
                      <div>
                        <p className="font-semibold text-blue-800">Banque</p>
                        <p className="text-blue-900">VOTRE BANQUE</p>
                      </div>
                      <div className="pt-3 border-t border-blue-300">
                        <p className="font-semibold text-blue-800 mb-1">Montant à virer</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {typeof order.total === 'number' ? order.total.toFixed(2) : parseFloat(order.total).toFixed(2)} €
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-blue-800 mb-1">Référence obligatoire</p>
                        <p className="text-lg font-mono font-bold text-blue-900 bg-white px-3 py-2 rounded border-2 border-blue-300">
                          {order.order_number}
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          ⚠️ Merci d'indiquer cette référence dans le libellé de votre virement
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Separator className="my-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#D4AF37]" />
                  Adresse de livraison
                </h3>
                {order.shipping_address && (
                  <div className="text-sm text-gray-700">
                    <p className="font-medium">
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
                    {order.shipping_address.phone && (
                      <p className="mt-2 flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {order.shipping_address.phone}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#D4AF37]" />
                  Mode de paiement
                </h3>
                {paymentMethod && (
                  <div className="text-sm text-gray-700">
                    <p className="font-medium flex items-center gap-2">
                      <span className="text-xl">{paymentMethod.icon}</span>
                      {paymentMethod.name}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sous-total</span>
                <span className="font-medium">{(typeof order.subtotal === 'number' ? order.subtotal : parseFloat(order.subtotal)).toFixed(2)} €</span>
              </div>
              {(typeof order.shipping_cost === 'number' ? order.shipping_cost : parseFloat(order.shipping_cost)) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frais de livraison</span>
                  <span className="font-medium">{(typeof order.shipping_cost === 'number' ? order.shipping_cost : parseFloat(order.shipping_cost)).toFixed(2)} €</span>
                </div>
              )}
              {(typeof order.discount_amount === 'number' ? order.discount_amount : parseFloat(order.discount_amount)) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Réduction</span>
                  <span className="font-medium">-{(typeof order.discount_amount === 'number' ? order.discount_amount : parseFloat(order.discount_amount)).toFixed(2)} €</span>
                </div>
              )}
              {(typeof order.wallet_amount_used === 'number' ? order.wallet_amount_used : parseFloat(order.wallet_amount_used)) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Porte-monnaie utilisé</span>
                  <span className="font-medium">-{(typeof order.wallet_amount_used === 'number' ? order.wallet_amount_used : parseFloat(order.wallet_amount_used)).toFixed(2)} €</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-[#D4AF37]">{(typeof order.total === 'number' ? order.total : parseFloat(order.total)).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>dont TVA (20%)</span>
                <span>{(typeof order.tax_amount === 'number' ? order.tax_amount : parseFloat(order.tax_amount)).toFixed(2)} €</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="outline" className="flex-1 sm:flex-none">
            <Link href="/">Retour à l'accueil</Link>
          </Button>
          <Button asChild className="flex-1 sm:flex-none bg-[#D4AF37] hover:bg-[#C5A028]">
            <Link href="/account/orders">Voir mes commandes</Link>
          </Button>
        </div>

        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-3 rounded-lg">
            <Mail className="h-4 w-4" />
            <span>Un email de confirmation vous a été envoyé</span>
          </div>
        </div>
      </div>
    </div>
  );
}
