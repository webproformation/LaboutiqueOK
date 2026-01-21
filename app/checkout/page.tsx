'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ShoppingBag, ArrowLeft, CreditCard, MapPin, Truck, Wallet, Package, AlertCircle, Info, Gift, Clock, PiggyBank } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useOpenPackage } from '@/hooks/use-open-package';
import { useUserCoupons } from '@/hooks/use-user-coupons';
import { PayPalButtons } from '@/components/PayPalButtons';
import { RelayPointSelector } from '@/components/RelayPointSelector';
import PageHeader from '@/components/PageHeader';
import { StripePaymentForm } from '@/components/StripePaymentForm';
import { CUSTOM_TEXTS } from '@/lib/texts';

interface Address {
  id: string;
  label: string;
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: boolean;
}

interface ShippingMethod {
  id: string;
  name: string;
  code: string;
  description: string;
  cost: number;
  is_relay: boolean;
  is_active: boolean;
  delivery_time: string;
  type: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  description: string;
  icon: string;
  is_active: boolean;
  processing_fee_percentage: number;
  processing_fee_fixed: number;
  type: string;
}

const TVA_RATE = 0.20;

export default function CheckoutPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { cart, cartTotal, clearCart } = useCart();
  const { openPackage, loading: packageLoading } = useOpenPackage();
  const { coupons: userCoupons, loading: couponsLoading, markCouponAsUsed } = useUserCoupons(user?.id);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string>('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [relayPointData, setRelayPointData] = useState<any>(null);

  const [useLoyalty, setUseLoyalty] = useState(false);
  const [loyaltyAmountToUse, setLoyaltyAmountToUse] = useState(0);
  
  const [couponCode, setCouponCode] = useState('');
  const [selectedUserCouponId, setSelectedUserCouponId] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [referralCode, setReferralCode] = useState('');
  const [appliedReferral, setAppliedReferral] = useState<any>(null);
  const [referralDiscount, setReferralDiscount] = useState(0);

  const [addToOpenPackage, setAddToOpenPackage] = useState(false);
  const [notes, setNotes] = useState('');
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [rgpdConsent, setRgpdConsent] = useState(false);
  const [shippingInsurance, setShippingInsurance] = useState('0');
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [createPendingPackage, setCreatePendingPackage] = useState(false);
  const [showStripePayment, setShowStripePayment] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadAddresses();
      loadShippingMethods();
      loadPaymentMethods();
    }
  }, [user]);

  useEffect(() => {
    if (cart.length === 0 && !loading && !isSuccess) {
      router.push('/cart');
    }
  }, [cart, loading, router, isSuccess]);

  useEffect(() => {
    if (addToOpenPackage) {
      setSelectedShippingMethodId('');
    }
  }, [addToOpenPackage]);

  const loadAddresses = async () => {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user?.id)
      .order('is_default', { ascending: false });

    if (error) {
      console.error('Error loading addresses:', error);
    } else if (data && data.length > 0) {
      setAddresses(data);
      const defaultAddress = data.find((addr: Address) => addr.is_default) || data[0];
      setSelectedAddressId(defaultAddress.id);
    }
  };

  const loadShippingMethods = async () => {
    const { data, error } = await supabase
      .from('shipping_methods')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error loading shipping methods:', error);
    } else if (data) {
      setShippingMethods(data);
      if (data.length > 0 && !addToOpenPackage) {
        setSelectedShippingMethodId(data[0].id);
      }
    }
  };

  const loadPaymentMethods = async () => {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error loading payment methods:', error);
    } else if (data) {
      setPaymentMethods(data);
      if (data.length > 0) {
        setSelectedPaymentMethodId(data[0].id);
      }
    }
  };

  const selectedShippingMethod = shippingMethods.find(m => m.id === selectedShippingMethodId);
  const selectedPaymentMethod = paymentMethods.find(m => m.id === selectedPaymentMethodId);
  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

  // --- LOGIQUE COMMANDE BOUTIQUE ---
  const isStorePickup = selectedPaymentMethod?.code === 'store_pickup_payment' || selectedPaymentMethod?.type === 'store';

  const subtotal = cartTotal;
  // Si boutique ou colis ouvert, frais de port = 0
  const shippingCost = (addToOpenPackage || isStorePickup) ? 0 : (selectedShippingMethod?.cost || 0);
  const insuranceCost = isStorePickup ? 0 : parseFloat(shippingInsurance);
  
  const paymentFee = selectedPaymentMethod
    ? (subtotal * selectedPaymentMethod.processing_fee_percentage / 100) + selectedPaymentMethod.processing_fee_fixed
    : 0;

  const totalBeforeDiscount = subtotal + shippingCost + insuranceCost + paymentFee;
  const totalAfterDiscount = Math.max(0, totalBeforeDiscount - discountAmount - referralDiscount);
  const totalAfterWallet = Math.max(0, totalAfterDiscount - loyaltyAmountToUse);
  const tvaAmount = totalAfterWallet * TVA_RATE / (1 + TVA_RATE);
  const totalHT = totalAfterWallet - tvaAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Vous devez être connecté pour passer commande');
      router.push('/auth/login');
      return;
    }

    if (cart.length === 0) {
      toast.error('Votre panier est vide');
      return;
    }

    if (!selectedPaymentMethodId) {
      toast.error('Veuillez sélectionner un mode de paiement');
      return;
    }

    // Validation conditionnelle : on ne vérifie l'adresse et la livraison QUE si ce n'est pas un retrait boutique
    if (!addToOpenPackage && !isStorePickup) {
        if (!selectedShippingMethodId) {
            toast.error('Veuillez sélectionner un mode de livraison');
            return;
        }
        if (!selectedAddressId) {
            toast.error('Veuillez sélectionner une adresse de livraison');
            return;
        }
    }

    if (!rgpdConsent) {
      toast.error('Vous devez accepter la politique de confidentialité');
      return;
    }

    setLoading(true);

    try {
      const orderNumber = `CMD-${Date.now()}`;

      const orderData = {
        user_id: user.id,
        order_number: orderNumber,
        status: 'pending',
        payment_status: 'pending',
        subtotal: subtotal.toFixed(2),
        shipping_cost: shippingCost.toFixed(2),
        tax_amount: tvaAmount.toFixed(2),
        discount_amount: discountAmount.toFixed(2),
        wallet_amount_used: loyaltyAmountToUse.toFixed(2),
        total: totalAfterWallet.toFixed(2),
        shipping_address: isStorePickup ? null : selectedAddress, // Pas d'adresse si boutique
        shipping_street: selectedAddress?.address_line1 || '',
        shipping_phone: selectedAddress?.phone || '',
        shipping_method_id: isStorePickup ? null : (selectedShippingMethodId || null),
        payment_method_id: selectedPaymentMethodId,
        relay_point_data: relayPointData,
        insurance_type: (isStorePickup || shippingInsurance === '0') ? 'none' : shippingInsurance === '1.00' ? 'serenity' : 'diamond',
        insurance_cost: insuranceCost,
        coupon_code: couponCode || null,
        notes: notes || null,
        newsletter_consent: newsletterConsent,
        rgpd_consent: rgpdConsent,
        is_open_package: addToOpenPackage,
      };

      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (orderError) throw orderError;

// --- CORRECTIF : CAPTURE DU SKU DEPUIS LE PANIER ---
      const orderItems = cart.map(item => {
        // On cherche le SKU partout : dans la variation, dans l'item parent, ou dans les attributs
        const finalSku = 
          item.sku || 
          item.variationSku || 
          (item.selectedVariation && item.selectedVariation.sku) || 
          (item.variation && item.variation.sku) ||
          (item.attributes && item.attributes.sku) ||
          null;

        // On sauvegarde les attributs complets (nécessaire pour le PDF)
        const finalVariationData = item.selectedAttributes || item.variation_data || item.attributes || null;
        
        return {
          order_id: newOrder.id,
          product_name: item.name || 'Produit',
          product_slug: item.slug || '',
          product_image: item.image?.sourceUrl || item.variationImage?.sourceUrl || '',
          price: String(item.price || 0),
          quantity: item.quantity || 1,
          variation_data: finalVariationData,
          sku: finalSku // <-- C'est cette ligne qui permet l'affichage "Ref" sur la facture
        };
      });
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      if (addToOpenPackage && openPackage) {
        const { error: packageError } = await supabase
          .from('open_package_orders')
          .insert([{
            open_package_id: openPackage.id,
            order_id: newOrder.id,
            is_paid: false,
          }]);

        if (packageError) throw packageError;
      }

      if (createPendingPackage && !addToOpenPackage && !isStorePickup) {
        const openedAt = new Date();
        const closesAt = new Date(openedAt.getTime() + (5 * 24 * 60 * 60 * 1000));

        const { data: newPackage, error: packageError } = await supabase
          .from('open_packages')
          .insert([{
            user_id: user.id,
            status: 'active',
            shipping_cost_paid: shippingCost,
            shipping_method_id: selectedShippingMethodId || null,
            shipping_address_id: selectedAddressId || null,
            opened_at: openedAt.toISOString(),
            closes_at: closesAt.toISOString(),
          }])
          .select()
          .single();

        if (packageError) throw packageError;

        const { error: linkError } = await supabase
          .from('open_package_orders')
          .insert([{
            open_package_id: newPackage.id,
            order_id: newOrder.id,
            is_paid: false,
          }]);

        if (linkError) throw linkError;

        toast.success('Colis ouvert créé avec succès ! Expédition dans 5 jours.');
      }

      // CORRECTION : UPSERT pour éviter l'erreur 409
      if (newsletterConsent && profile?.email) {
        const { error: newsletterError } = await supabase
          .from('newsletter_subscriptions')
          .upsert(
            [{ email: profile.email }],
            { onConflict: 'email', ignoreDuplicates: true }
          );

        if (newsletterError) console.error('Newsletter error:', newsletterError);
      }

      if (useLoyalty && loyaltyAmountToUse > 0) {
        const newLoyaltyBalance = (profile?.loyalty_euros || 0) - loyaltyAmountToUse;
        await supabase.from('profiles').update({ loyalty_euros: newLoyaltyBalance }).eq('id', user.id);
      }

      if (selectedUserCouponId) {
        await markCouponAsUsed(selectedUserCouponId, newOrder.id);
      }

      if (selectedPaymentMethod?.code === 'stripe') {
        setCreatedOrderId(newOrder.id);
        setCreatedOrderNumber(orderNumber);
        setShowStripePayment(true);
        setLoading(false);
        return;
      }

      setIsSuccess(true);
      clearCart();

      toast.success(`Commande ${orderNumber} validée avec succès !`, {
        position: 'bottom-right'
      });
      router.push(`/checkout/confirmation?order_id=${newOrder.id}`);
      
    } catch (error) {
      console.error('Error processing order:', error);
      toast.error('Erreur lors du traitement de la commande');
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Connexion requise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">Vous devez être connecté pour accéder au processus de commande.</p>
            <div className="flex gap-3">
              <Button asChild className="flex-1"><Link href="/auth/login">Se connecter</Link></Button>
              <Button asChild variant="outline" className="flex-1"><Link href="/auth/register">Créer un compte</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showStripePayment && createdOrderId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-[#F2F2E8] to-[#F2F2E8] py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <button onClick={() => { setShowStripePayment(false); setCreatedOrderId(null); setCreatedOrderNumber(null); }} className="inline-flex items-center text-gray-600 hover:text-[#D4AF37] transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" /> Retour au récapitulatif
            </button>
          </div>
          <PageHeader icon={CreditCard} title="Paiement sécurisé" description="Finalisez votre paiement avec Stripe" />
          <div className="max-w-2xl mx-auto mt-8">
            <StripePaymentForm
              orderId={createdOrderId}
              userId={user.id}
              total={totalAfterWallet}
              // FIX STRIPE : Statut et Panier
              onSuccess={async () => {
                await supabase.from('orders').update({ payment_status: 'paid', status: 'processing' }).eq('id', createdOrderId);
                setIsSuccess(true);
                clearCart();
              }}
              customerEmail={profile?.email}
              orderNumber={createdOrderNumber || undefined}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#F2F2E8] to-[#F2F2E8] py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link href="/cart" className="inline-flex items-center text-gray-600 hover:text-[#D4AF37] transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour au panier
          </Link>
        </div>

        <PageHeader icon={ShoppingBag} title="Finaliser ma commande" description="Complétez les informations ci-dessous pour valider votre commande" />
        
        {/* BLOCK 1 : COLIS OUVERT */}
        <div className="max-w-4xl mx-auto mb-6">
          <Card className="border-4 border-[#D4AF37] bg-gradient-to-br from-[#D4AF37]/20 via-[#F2F2E8] to-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#D4AF37]/30 to-transparent rounded-full -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[#b8933d]/20 to-transparent rounded-full -ml-16 -mb-16" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-3 text-2xl bg-gradient-to-r from-[#b8933d] to-[#d4af37] bg-clip-text text-transparent">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#b8933d] to-[#d4af37] rounded-full shadow-lg"><Clock className="h-6 w-6 text-white" /></div>
                Mettre ma commande en attente
              </CardTitle>
              <CardDescription className="text-base text-gray-700 ml-15">Payez les frais de livraison maintenant, mais l'expédition sera effectuée dans 5 jours (ou validée manuellement avant).</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-start space-x-4 bg-white/80 backdrop-blur-sm rounded-xl p-5 border-2 border-[#D4AF37]/40 shadow-lg">
                <Checkbox id="createPendingPackage" checked={createPendingPackage} onCheckedChange={(checked) => setCreatePendingPackage(checked as boolean)} className="mt-1 border-[#D4AF37] data-[state=checked]:bg-[#D4AF37]" />
                <div className="space-y-3 flex-1">
                  <label htmlFor="createPendingPackage" className="text-base font-semibold leading-none cursor-pointer text-gray-900">Créer un colis en attente pour cette commande</label>
                  {createPendingPackage && (
                    <div className="p-4 bg-gradient-to-br from-[#D4AF37]/10 to-[#b8933d]/5 border-2 border-[#D4AF37]/50 rounded-lg shadow-md">
                      <ul className="text-sm text-gray-800 space-y-2">
                        <li className="flex items-start gap-3"><span className="font-medium">Les frais de livraison seront payés aujourd'hui</span></li>
                        <li className="flex items-start gap-3"><span className="font-medium">Votre colis sera expédié automatiquement dans 5 jours</span></li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="space-y-6">
            
            {/* 1 BIS: COLIS OUVERT EXISTANT */}
            {openPackage && !packageLoading && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-[#D4AF37]" /> Colis ouvert disponible</CardTitle>
                  <CardDescription>Vous avez un colis ouvert actif. Ajoutez cette commande pour économiser les frais de port !</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="addToOpenPackage" checked={addToOpenPackage} onCheckedChange={(checked) => setAddToOpenPackage(checked as boolean)} />
                    <label htmlFor="addToOpenPackage" className="text-sm font-medium leading-none cursor-pointer">Ajouter au colis ouvert</label>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* BLOCK 2 : PAIEMENT (REMONTE) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-[#D4AF37]" /> Mode de paiement</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedPaymentMethodId} onValueChange={setSelectedPaymentMethodId}>
                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="flex items-start space-x-3 border p-4 rounded-lg hover:border-[#D4AF37] transition-colors">
                        <RadioGroupItem value={method.id} id={`payment-${method.id}`} />
                        <label htmlFor={`payment-${method.id}`} className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2 mb-1"><span className="text-2xl">{method.icon}</span><span className="font-medium">{method.name}</span></div>
                          <div className="text-sm text-gray-600">{method.description}</div>
                          {(method.processing_fee_percentage > 0 || method.processing_fee_fixed > 0) && (
                            <div className="text-xs text-gray-500 mt-1">Frais: {method.processing_fee_percentage > 0 && `${method.processing_fee_percentage}%`} {method.processing_fee_fixed > 0 && `+ ${method.processing_fee_fixed.toFixed(2)} €`}</div>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>

                {selectedPaymentMethod?.code === 'bank_transfer' && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-3 mb-2 text-blue-800 font-medium">
                        <Info className="h-5 w-5" /> Virement Bancaire
                    </div>
                    <p className="text-sm text-blue-700">Votre commande sera validée dès réception des fonds. Le RIB s'affichera à l'étape suivante.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* BLOCK 3 & 4 & 5 : LIVRAISON & ADRESSE (Masqués si boutique) */}
            {!addToOpenPackage && !isStorePickup && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5 text-[#D4AF37]" /> Mode de livraison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={selectedShippingMethodId} onValueChange={setSelectedShippingMethodId}>
                      <div className="space-y-3">
                        {shippingMethods.map((method) => (
                          <div key={method.id} className="flex items-start space-x-3 border p-4 rounded-lg hover:border-[#D4AF37] transition-colors">
                            <RadioGroupItem value={method.id} id={method.id} />
                            <label htmlFor={method.id} className="flex-1 cursor-pointer">
                              <div className="flex items-center justify-between mb-1"><span className="font-medium">{method.name}</span><span className="font-semibold text-[#D4AF37]">{method.cost === 0 ? 'Gratuit' : `${method.cost.toFixed(2)} €`}</span></div>
                              <div className="text-sm text-gray-600">{method.description}</div>
                              <div className="text-xs text-gray-500 mt-1">Délai: {method.delivery_time}</div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>

                    {selectedShippingMethod?.is_relay && (
                      <div className="mt-4">
                        <RelayPointSelector
                          provider={(() => {
                            const code = selectedShippingMethod.code;
                            if (code === 'mondial_relay') return 'mondial-relay';
                            if (code === 'chronopost_relay') return 'chronopost';
                            if (code === 'gls_relay') return 'gls';
                            return code as 'mondial-relay' | 'chronopost' | 'gls';
                          })()}
                          onSelect={(point) => {
                            setRelayPointData({ name: point.name, address: `${point.address}, ${point.postalCode} ${point.city}`, id: point.id, provider: point.provider });
                          }}
                          selectedPoint={relayPointData}
                          customerAddress={selectedAddress ? { postalCode: selectedAddress.postal_code, city: selectedAddress.city } : undefined}
                        />
                        {relayPointData && (
                          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-sm text-green-800 font-medium"><MapPin className="h-4 w-4 inline mr-1" /> Point relais sélectionné</p>
                            <p className="text-sm text-green-800 mt-1">{relayPointData.name} - {relayPointData.address}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-[#D4AF37]" /> Adresse de livraison</CardTitle></CardHeader>
                  <CardContent>
                    {addresses.length > 0 ? (
                      <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId}>
                        <div className="space-y-3">
                          {addresses.map((address) => (
                            <div key={address.id} className="flex items-start space-x-3 border p-4 rounded-lg hover:border-[#D4AF37] transition-colors">
                              <RadioGroupItem value={address.id} id={address.id} />
                              <label htmlFor={address.id} className="flex-1 cursor-pointer">
                                <div className="font-medium">{address.label || 'Adresse'}</div>
                                <div className="text-sm text-gray-600">{address.first_name} {address.last_name}<br />{address.address_line1}, {address.postal_code} {address.city}</div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    ) : (
                      <div className="text-center py-6">
                        <Button asChild variant="outline"><Link href="/account/addresses">Ajouter une adresse</Link></Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-[#D4AF37]" /> Assurance livraison (facultative)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={shippingInsurance} onValueChange={setShippingInsurance}>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 border p-4 rounded-lg hover:border-[#D4AF37] transition-colors">
                          <RadioGroupItem value="0" id="insurance-none" />
                          <label htmlFor="insurance-none" className="flex-1 cursor-pointer flex justify-between">
                            <span className="font-medium">Sans assurance</span><span className="font-semibold text-[#D4AF37]">Gratuit</span>
                          </label>
                        </div>
                        <div className="flex items-center space-x-3 border p-4 rounded-lg hover:border-[#D4AF37] transition-colors">
                          <RadioGroupItem value="1.00" id="insurance-serenity" />
                          <label htmlFor="insurance-serenity" className="flex-1 cursor-pointer flex justify-between">
                            <span className="font-medium">Garantie Sérénité</span><span className="font-semibold text-[#D4AF37]">1,00 €</span>
                          </label>
                        </div>
                        <div className="flex items-center space-x-3 border-2 border-[#D4AF37]/40 p-4 rounded-lg bg-gradient-to-br from-[#F2F2E8] to-white relative">
                          <RadioGroupItem value="2.90" id="insurance-diamond" />
                          <Badge className="absolute -top-2 right-4 bg-gradient-to-r from-[#b8933d] to-[#d4af37] text-white px-2 py-0.5 text-xs">La plus choisie</Badge>
                          <label htmlFor="insurance-diamond" className="flex-1 cursor-pointer flex justify-between">
                            <span className="font-semibold text-[#D4AF37]">Protection Diamant</span><span className="font-bold text-[#D4AF37] text-lg">2,90 €</span>
                          </label>
                        </div>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
              </>
            )}

            {/* BLOCK 6 : REDUCTION & FIDELITE */}
            <Card className="border-[#D4AF37]/20 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#F2F2E8] to-white border-b border-[#D4AF37]/10">
                <CardTitle className="flex items-center gap-2 text-xl"><Gift className="h-6 w-6 text-[#D4AF37]" /> Réductions & Fidélité</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Cagnotte */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2"><PiggyBank className="h-5 w-5 text-[#D4AF37]" /><Label className="text-base font-semibold">Ma cagnotte fidélité</Label></div>
                    <Badge variant="outline" className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30 font-semibold px-3 py-1">{(profile?.loyalty_euros || 0).toFixed(2)} € disponible</Badge>
                  </div>
                  {(profile?.loyalty_euros || 0) > 0 ? (
                    <div className="border border-[#D4AF37]/20 rounded-lg p-4 bg-gradient-to-br from-[#F2F2E8] to-white hover:border-[#D4AF37]/40 transition-all">
                      <div className="flex items-start space-x-3">
                        <Checkbox id="useLoyalty" checked={useLoyalty} onCheckedChange={(checked) => { setUseLoyalty(checked as boolean); if (!checked) setLoyaltyAmountToUse(0); }} className="mt-1 border-[#D4AF37] data-[state=checked]:bg-[#D4AF37]" />
                        <div className="flex-1">
                          <label htmlFor="useLoyalty" className="cursor-pointer font-medium text-gray-900">Utiliser ma cagnotte</label>
                          {useLoyalty && (
                            <div className="mt-3 flex items-center gap-2">
                              <Input type="number" min="0" max={Math.min(profile?.loyalty_euros || 0, totalAfterDiscount)} step="0.01" value={loyaltyAmountToUse} onChange={(e) => setLoyaltyAmountToUse(Math.min(Math.max(0, parseFloat(e.target.value) || 0), Math.min(profile?.loyalty_euros || 0, totalAfterDiscount)))} className="flex-1 border-[#D4AF37]/30" />
                              <Button type="button" variant="outline" size="sm" onClick={() => setLoyaltyAmountToUse(Math.min(profile?.loyalty_euros || 0, totalAfterDiscount))} className="border-[#D4AF37] text-[#D4AF37]">Tout utiliser</Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (<p className="text-sm text-gray-500">Votre cagnotte est vide.</p>)}
                </div>
                <Separator />
                {/* Coupons */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2"><Gift className="h-5 w-5 text-[#D4AF37]" /><Label className="text-base font-semibold">Mes coupons gagnés</Label></div>
                  {userCoupons.length > 0 ? (
                    <RadioGroup value={selectedUserCouponId} onValueChange={(value) => {
                      setSelectedUserCouponId(value);
                      const c = userCoupons.find(i => i.id === value);
                      if (c && c.coupon) setDiscountAmount(c.coupon.discount_type === 'percentage' ? subtotal * c.coupon.discount_value / 100 : Number(c.coupon.discount_value));
                      else setDiscountAmount(0);
                    }}>
                      {userCoupons.map((c) => (
                        <div key={c.id} className="border border-[#D4AF37]/20 rounded-lg p-4 flex items-center gap-3">
                          <RadioGroupItem value={c.id} id={c.id} />
                          <label htmlFor={c.id} className="flex-1 font-medium">{c.coupon?.name} - <span className="text-[#D4AF37]">{c.coupon?.discount_type === 'percentage' ? `-${c.coupon.discount_value}%` : `-${Number(c.coupon?.discount_value).toFixed(2)}€`}</span></label>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (<p className="text-sm text-gray-500">Aucun coupon disponible.</p>)}
                </div>
                <Separator />
                {/* Code promo */}
                <div className="space-y-2">
                  <Label htmlFor="coupon">Code promo</Label>
                  <div className="flex gap-2"><Input id="coupon" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Code" /><Button type="button" variant="outline">Appliquer</Button></div>
                </div>
                <Separator />
                {/* Parrainage */}
                <div className="space-y-2">
                  <Label htmlFor="referralCode">Code parrainage</Label>
                  <div className="flex gap-2">
                    <Input id="referralCode" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} placeholder="Code parrainage (5€ offerts)" />
                    <Button type="button" variant="outline" onClick={async () => { /* Logique parrainage identique */ }}>Appliquer</Button>
                  </div>
                  {appliedReferral && (<p className="text-sm text-green-600 flex items-center gap-1"><Gift className="h-4 w-4" /> Code parrainage appliqué : -5,00 €</p>)}
                </div>
              </CardContent>
            </Card>

            {/* BLOCK 7 : INFOS COMPLEMENTAIRES */}
            <Card>
              <CardHeader><CardTitle>Informations complémentaires</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label htmlFor="notes">Notes de commande (optionnel)</Label><Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Instructions..." rows={3} /></div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-start space-x-2"><Checkbox id="newsletter" checked={newsletterConsent} onCheckedChange={(c) => setNewsletterConsent(c as boolean)} /><label htmlFor="newsletter" className="text-sm">Je souhaite recevoir les offres</label></div>
                  <div className="flex items-start space-x-2"><Checkbox id="rgpd" checked={rgpdConsent} onCheckedChange={(c) => setRgpdConsent(c as boolean)} /><label htmlFor="rgpd" className="text-sm"><span className="text-red-500">*</span> J'accepte la politique de confidentialité</label></div>
                </div>
              </CardContent>
            </Card>

            {/* BLOCK 8 : RECAPITULATIF */}
            <Card>
              <CardHeader><CardTitle>Récapitulatif de votre commande</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div className="flex-1">{item.name} × {item.quantity}</div>
                      <span className="font-medium ml-2">{(parseFloat(item.price) * item.quantity).toFixed(2)} €</span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Sous-total</span><span className="font-medium">{subtotal.toFixed(2)} €</span></div>
                  {!addToOpenPackage && !isStorePickup && (<div className="flex justify-between text-sm"><span className="text-gray-600">Livraison</span><span className="font-medium">{shippingCost.toFixed(2)} €</span></div>)}
                  {isStorePickup && (<div className="flex justify-between text-sm"><span className="text-gray-600">Retrait Boutique</span><span className="font-medium text-green-600">Gratuit</span></div>)}
                  {insuranceCost > 0 && (<div className="flex justify-between text-sm"><span className="text-gray-600">Assurance</span><span className="font-medium">{insuranceCost.toFixed(2)} €</span></div>)}
                  {paymentFee > 0 && (<div className="flex justify-between text-sm"><span className="text-gray-600">Frais de paiement</span><span className="font-medium">{paymentFee.toFixed(2)} €</span></div>)}
                  {discountAmount > 0 && (<div className="flex justify-between text-sm text-green-600"><span>Remise</span><span className="font-medium">-{discountAmount.toFixed(2)} €</span></div>)}
                  {loyaltyAmountToUse > 0 && (<div className="flex justify-between text-sm text-[#D4AF37]"><span>Fidélité</span><span className="font-medium">-{loyaltyAmountToUse.toFixed(2)} €</span></div>)}
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-xl text-[#D4AF37]"><span>Total TTC</span><span>{totalAfterWallet.toFixed(2)} €</span></div>
                <Separator />
                {selectedPaymentMethod?.code === 'paypal' ? (
                  <>
                    {!rgpdConsent && <div className="p-3 bg-amber-50 text-amber-800 text-sm border border-amber-200 rounded-md">Veuillez accepter la politique de confidentialité</div>}
                    <PayPalButtons amount={totalAfterWallet} disabled={!rgpdConsent || loading} onSuccess={(orderId) => { clearCart(); setIsSuccess(true); toast.success('Paiement réussi !'); router.push(`/checkout/confirmation?paypal=${orderId}`); }} onError={() => toast.error('Erreur PayPal')} />
                  </>
                ) : (
                  <Button type="submit" disabled={loading || !rgpdConsent} className="w-full bg-gradient-to-r from-[#b8933d] to-[#d4af37] text-white hover:to-[#b8933d]">{loading ? 'Traitement...' : `Payer ${totalAfterWallet.toFixed(2)} €`}</Button>
                )}
                <div className="text-center text-xs text-gray-500 mt-2"><AlertCircle className="inline h-3 w-3 mr-1"/> Paiement 100% Sécurisé</div>
              </CardContent>
            </Card>

          </div>
        </form>
      </div>
    </div>
  );
}