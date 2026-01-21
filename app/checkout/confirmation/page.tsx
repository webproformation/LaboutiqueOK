'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Store, MapPin, Phone, Mail, Calendar, AlertCircle, Package, Download, Home, ShoppingBag, Landmark, Copy } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import JSConfetti from 'js-confetti'; 
import { generateInvoicePDF } from '@/lib/invoiceGenerator';

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: string | number;
  subtotal: string | number;
  shipping_cost: string | number;
  discount_amount: string | number;
  tax_amount: string | number;
  wallet_amount_used: string | number;
  created_at: string;
  shipping_address: any;
  relay_point_data: any;
  is_open_package: boolean;
  payment_method_id: string;
  payment_method_name?: string;
  order_items?: OrderItem[];
}

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string;
  price: string | number;
  quantity: number;
  variation_data: any;
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
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);

  // Récupération des paramètres URL
  const orderId = searchParams.get('order_id') || searchParams.get('order') || searchParams.get('paypal');
  const redirectStatus = searchParams.get('redirect_status');

  // --- 1. SCROLL AUTOMATIQUE EN HAUT ---
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (orderId) {
      loadOrderDetails(orderId);
    } else {
      const timeout = setTimeout(() => router.push('/'), 3000);
      return () => clearTimeout(timeout);
    }
  }, [orderId, router]);

  // Effet Confetti au succès
  useEffect(() => {
    if (!loading && order) {
        if (redirectStatus === 'succeeded' || order.payment_status === 'paid' || paymentMethod?.code === 'bank_transfer' || paymentMethod?.code === 'store_pickup_payment' || paymentMethod?.code === 'paypal') {
            const jsConfetti = new JSConfetti();
            jsConfetti.addConfetti({
                emojis: ['🛍️', '✨', '💳', '🎉'],
                confettiNumber: 60,
            });
        }
    }
  }, [loading, order, paymentMethod, redirectStatus]);

  async function loadOrderDetails(id: string) {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', id);

      if (itemsData) {
        setOrderItems(itemsData);
      }

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
      toast.error("Impossible de charger la commande");
    } finally {
      setLoading(false);
    }
  }

  const handleDownloadInvoice = async () => {
    if (!order) return;
    toast.loading("Génération de la facture...");
    try {
      const orderForPdf = {
        ...order,
        items: orderItems,
        payment_method: paymentMethod?.name || 'Carte Bancaire'
      };
      
      const doc = await generateInvoicePDF(orderForPdf, order.order_number);
      doc.save(`Facture_${order.order_number}.pdf`);
      toast.dismiss();
      toast.success("Facture téléchargée !");
    } catch (error) {
      console.error(error);
      toast.dismiss();
      toast.error("Erreur lors du téléchargement");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copié dans le presse-papier");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-[#F2F2E8] to-[#F2F2E8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
          <p className="text-gray-600">Finalisation de votre commande...</p>
        </div>
      </div>
    );
  }

  if (!order || !paymentMethod) {
    return null;
  }

  const renderPaymentSpecificInfo = () => {
    // --- BLOC VIREMENT BANCAIRE ---
    if (paymentMethod.code === 'bank_transfer') {
      return (
        <Card className="border-2 border-[#D4AF37] shadow-xl mb-8 overflow-hidden bg-white">
          <div className="bg-[#D4AF37] p-4 text-white flex items-center justify-center gap-3">
            <Clock className="h-8 w-8" />
            <div className="text-center md:text-left">
                <h3 className="text-xl font-bold uppercase tracking-wide">Commande en attente de virement</h3>
            </div>
          </div>
          
          <CardContent className="pt-8 px-6 pb-8 space-y-8">
            <div className="text-center max-w-2xl mx-auto">
                <p className="text-gray-600 text-lg">
                    Merci pour votre commande ! Elle a bien été enregistrée et sera validée <strong>dès réception de votre virement</strong>.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* COLONNE GAUCHE : RIB */}
                <div className="bg-neutral-50 rounded-xl border border-gray-200 p-6 relative overflow-hidden group hover:border-[#D4AF37]/50 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Landmark className="h-32 w-32 text-[#D4AF37]" />
                    </div>

                    <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-3">
                        <Landmark className="h-5 w-5 text-[#D4AF37]" />
                        <h4 className="font-bold text-gray-900 uppercase tracking-wider text-sm">Coordonnées Bancaires (RIB)</h4>
                    </div>

                    <div className="space-y-5 relative z-10">
                        <div>
                            <span className="text-xs text-gray-500 uppercase font-semibold">Titulaire du compte</span>
                            <p className="text-gray-900 font-bold text-lg">SAS A U MORGANE DEWANIN</p>
                        </div>

                        <div>
                            <span className="text-xs text-gray-500 uppercase font-semibold">Banque</span>
                            <p className="text-gray-900 font-medium">BANQUE POPULAIRE DU NORD</p>
                            <p className="text-sm text-gray-500">Agence : AG CENTRALE</p>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-3 group-hover:border-[#D4AF37]/30 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs text-[#D4AF37] uppercase font-bold">IBAN</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-[#D4AF37]" onClick={() => copyToClipboard("FR76 1350 7000 4331 8229 5212 127")}>
                                    <Copy className="h-3 w-3" />
                                </Button>
                            </div>
                            <p className="font-mono text-lg font-bold text-gray-800 break-all tracking-wider">
                                FR76 1350 7000 4331 8229 5212 127
                            </p>
                        </div>

                        <div className="flex gap-4">
                             <div>
                                <span className="text-xs text-gray-500 uppercase font-semibold">BIC</span>
                                <p className="font-mono font-medium text-gray-800">CCBPFRPPLIL</p>
                             </div>
                             <div>
                                <span className="text-xs text-gray-500 uppercase font-semibold">Montant</span>
                                <p className="font-bold text-[#D4AF37]">{(typeof order.total === 'number' ? order.total : parseFloat(order.total)).toFixed(2)} €</p>
                             </div>
                        </div>
                    </div>
                </div>

                {/* COLONNE DROITE : INSTRUCTIONS */}
                <div className="flex flex-col justify-center space-y-6">
                    <div className="bg-[#D4AF37]/10 border-2 border-[#D4AF37] rounded-xl p-6">
                        <div className="flex items-start gap-4">
                            <AlertCircle className="h-8 w-8 text-[#D4AF37] flex-shrink-0" />
                            <div>
                                <h4 className="font-bold text-[#D4AF37] text-lg mb-2">Communication Importante</h4>
                                <p className="text-gray-700 text-sm mb-3">
                                    Pour que nous puissions identifier votre paiement rapidement, merci d'indiquer <strong>uniquement</strong> votre numéro de commande en référence du virement.
                                </p>
                                <div className="bg-white inline-flex items-center gap-3 px-4 py-2 rounded-lg border border-[#D4AF37]/30 shadow-sm">
                                    <span className="text-gray-500 text-xs uppercase font-bold">Référence :</span>
                                    <span className="font-mono text-xl font-bold text-gray-900">{order.order_number}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-[#D4AF37]" onClick={() => copyToClipboard(order.order_number)}>
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-600">
                            Un email récapitulatif contenant ces informations vous a été envoyé à <span className="font-medium text-gray-900">{supabase.auth.getUser().then(u => u.data.user?.email)}</span>
                        </p>
                    </div>
                </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // --- BLOC RETRAIT BOUTIQUE ---
    if (paymentMethod.code === 'store_pickup_payment' || paymentMethod.type === 'store') {
      return (
        <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-white shadow-lg mb-6">
          <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-50 border-b border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500 rounded-full">
                <Store className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl text-blue-900">Commande réservée - Paiement en boutique</CardTitle>
                <p className="text-blue-700 text-sm mt-1">
                  La préparation de votre commande sera réalisée sur place
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
              <p className="text-red-900 font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                La commande doit être réglée en boutique sous 5 jours
              </p>
            </div>

            <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-6">
              <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                <Store className="h-5 w-5" />
                Informations Pratiques
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-blue-900">Adresse</p>
                    <p className="text-blue-800">1062 rue d'Armentières</p>
                    <p className="text-blue-800">59850 Nieppe</p>
                  </div>
                </div>

                <Separator className="bg-blue-300" />

                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-blue-900">Morgane</p>
                      <a href="tel:+33641456671" className="text-blue-700 hover:underline">
                        +33 6 41 45 66 71
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-blue-900">André</p>
                      <a href="tel:+33603489662" className="text-blue-700 hover:underline">
                        +33 6 03 48 96 62
                      </a>
                    </div>
                  </div>
                </div>

                <Separator className="bg-blue-300" />

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-blue-900">Horaires</p>
                    <p className="text-blue-800">Retrait sur RDV</p>
                    <p className="text-blue-800">Mercredi 9h-19h</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-medium">
                Merci de prendre rendez-vous pour le retrait de votre commande
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    // --- BLOC SUCCÈS STANDARD (CB, PAYPAL) ---
    return (
      <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-white shadow-lg mb-6">
        <CardHeader className="bg-gradient-to-r from-green-100 to-green-50 border-b border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500 rounded-full">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl text-green-900">Commande Validée !</CardTitle>
              <p className="text-green-700 text-sm mt-1">
                Paiement accepté via {paymentMethod.name}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="bg-green-100 border border-green-300 rounded-lg p-4">
            <p className="text-green-900 font-medium">
              Votre commande est en cours de traitement. Vous recevrez un email contenant vos informations de livraison.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-green-800 bg-green-50 px-4 py-3 rounded-lg border border-green-200">
            <Mail className="h-4 w-4 flex-shrink-0" />
            <span>Un email de confirmation vous a été envoyé</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  const totalValue = typeof order.total === 'number' ? order.total : parseFloat(order.total);
  const subtotalValue = typeof order.subtotal === 'number' ? order.subtotal : parseFloat(order.subtotal);
  const shippingValue = typeof order.shipping_cost === 'number' ? order.shipping_cost : parseFloat(order.shipping_cost);
  const discountValue = typeof order.discount_amount === 'number' ? order.discount_amount : parseFloat(order.discount_amount);
  const walletValue = typeof order.wallet_amount_used === 'number' ? order.wallet_amount_used : parseFloat(order.wallet_amount_used);
  const taxValue = typeof order.tax_amount === 'number' ? order.tax_amount : parseFloat(order.tax_amount);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#F2F2E8] to-[#F2F2E8] py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-4 text-base px-4 py-2 bg-white border-[#D4AF37] text-[#D4AF37]">
            Numéro de commande : <span className="font-mono font-bold ml-2 text-black">{order.order_number}</span>
          </Badge>
          <p className="text-gray-600 text-sm">
            Commandé le {new Date(order.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        {renderPaymentSpecificInfo()}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center">
            <Button onClick={handleDownloadInvoice} variant="outline" className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white">
                <Download className="h-4 w-4 mr-2" />
                Télécharger la facture
            </Button>
            <Button asChild className="bg-[#D4AF37] hover:bg-[#b8933d] text-white">
                <Link href="/account/orders">
                    <Package className="h-4 w-4 mr-2" />
                    Suivre ma commande
                </Link>
            </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-[#D4AF37]" />
                Articles commandés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex gap-3 border-b pb-3 last:border-0 last:pb-0">
                    {item.product_image && (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product_name}</p>
                      <p className="text-xs text-gray-600">Quantité: {item.quantity}</p>
                      {item.variation_data && (
                        <p className="text-xs text-gray-500 mt-1">
                          {Object.entries(item.variation_data).map(([k, v]) => `${k}: ${v}`).join(', ')}
                        </p>
                      )}
                    </div>
                    <p className="font-semibold text-sm whitespace-nowrap">
                      {(typeof item.price === 'number' ? item.price : parseFloat(item.price)).toFixed(2)} €
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#D4AF37]" />
                {order.relay_point_data ? 'Point Relais' : 'Adresse de livraison'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.relay_point_data ? (
                <div className="text-sm">
                  <p className="font-semibold">{order.relay_point_data.name}</p>
                  <p className="text-gray-600 mt-1">{order.relay_point_data.address}</p>
                </div>
              ) : order.shipping_address ? (
                <div className="text-sm">
                  <p className="font-semibold">
                    {order.shipping_address.first_name} {order.shipping_address.last_name}
                  </p>
                  <p className="text-gray-600 mt-1">{order.shipping_address.address_line1}</p>
                  {order.shipping_address.address_line2 && (
                    <p className="text-gray-600">{order.shipping_address.address_line2}</p>
                  )}
                  <p className="text-gray-600">
                    {order.shipping_address.postal_code} {order.shipping_address.city}
                  </p>
                  <p className="text-gray-600">{order.shipping_address.country}</p>
                  {order.shipping_address.phone && (
                    <p className="text-gray-600 mt-2 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {order.shipping_address.phone}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Aucune adresse</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Récapitulatif financier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sous-total</span>
                <span className="font-medium">{subtotalValue.toFixed(2)} €</span>
              </div>

              {shippingValue > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frais de livraison</span>
                  <span className="font-medium">{shippingValue.toFixed(2)} €</span>
                </div>
              )}

              {discountValue > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Réduction</span>
                  <span className="font-medium">-{discountValue.toFixed(2)} €</span>
                </div>
              )}

              {walletValue > 0 && (
                <div className="flex justify-between text-sm text-purple-600">
                  <span>Cagnotte fidélité utilisée</span>
                  <span className="font-medium">-{walletValue.toFixed(2)} €</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between text-lg font-bold pt-2">
                <span>Total TTC</span>
                <span className="text-[#D4AF37]">{totalValue.toFixed(2)} €</span>
              </div>

              <div className="flex justify-between text-xs text-gray-500">
                <span>dont TVA (20%)</span>
                <span>{taxValue.toFixed(2)} €</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button asChild variant="ghost" size="lg">
            <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Retour à la boutique
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}