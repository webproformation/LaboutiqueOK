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

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string>('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [relayPointData, setRelayPointData] = useState<any>(null);

  const [useWallet, setUseWallet] = useState(false);
  const [walletAmountToUse, setWalletAmountToUse] = useState(0);
  const [useLoyalty, setUseLoyalty] = useState(false);
  const [loyaltyAmountToUse, setLoyaltyAmountToUse] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [selectedUserCouponId, setSelectedUserCouponId] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
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
    if (cart.length === 0 && !loading) {
      router.push('/cart');
    }
  }, [cart, loading, router]);

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

  const subtotal = cartTotal;
  const shippingCost = addToOpenPackage ? 0 : (selectedShippingMethod?.cost || 0);
  const insuranceCost = parseFloat(shippingInsurance);
  const paymentFee = selectedPaymentMethod
    ? (subtotal * selectedPaymentMethod.processing_fee_percentage / 100) + selectedPaymentMethod.processing_fee_fixed
    : 0;

  const totalBeforeDiscount = subtotal + shippingCost + insuranceCost + paymentFee;
  const totalAfterDiscount = Math.max(0, totalBeforeDiscount - discountAmount - referralDiscount);
  const totalAfterWallet = Math.max(0, totalAfterDiscount - walletAmountToUse - loyaltyAmountToUse);
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

    if (!addToOpenPackage && !selectedShippingMethodId) {
      toast.error('Veuillez sélectionner un mode de livraison');
      return;
    }

    if (!addToOpenPackage && !selectedAddressId) {
      toast.error('Veuillez sélectionner une adresse de livraison');
      return;
    }

    if (!selectedPaymentMethodId) {
      toast.error('Veuillez sélectionner un mode de paiement');
      return;
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
        wallet_amount_used: (walletAmountToUse + loyaltyAmountToUse).toFixed(2),
        total: totalAfterWallet.toFixed(2),
        shipping_address: selectedAddress,
        shipping_street: selectedAddress?.address_line1 || '',
        shipping_phone: selectedAddress?.phone || '',
        shipping_method_id: selectedShippingMethodId || null,
        payment_method_id: selectedPaymentMethodId,
        relay_point_data: relayPointData,
        insurance_type: shippingInsurance === '0' ? 'none' : shippingInsurance === '1.00' ? 'serenity' : 'diamond',
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

      // Insérer les items de la commande
      const orderItems = cart.map(item => ({
        order_id: newOrder.id,
        product_name: item.name || 'Produit',
        product_slug: item.slug || '',
        product_image: item.image?.sourceUrl || item.variationImage?.sourceUrl || '',
        price: String(item.price || 0),
        quantity: item.quantity || 1,
        variation_data: item.selectedAttributes || null,
      }));

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

      if (createPendingPackage && !addToOpenPackage) {
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

      if (newsletterConsent && profile?.email) {
        const { error: newsletterError } = await supabase
          .from('newsletter_subscriptions')
          .insert([{ email: profile.email }])
          .select();

        if (newsletterError && newsletterError.code !== '23505') {
          console.error('Newsletter error:', newsletterError);
        }
      }

      if (useWallet && walletAmountToUse > 0) {
        const newBalance = (profile?.wallet_balance || 0) - walletAmountToUse;
        await supabase
          .from('profiles')
          .update({ wallet_balance: newBalance })
          .eq('id', user.id);
      }

      if (useLoyalty && loyaltyAmountToUse > 0) {
        const newLoyaltyBalance = (profile?.loyalty_euros || 0) - loyaltyAmountToUse;
        await supabase
          .from('profiles')
          .update({ loyalty_euros: newLoyaltyBalance })
          .eq('id', user.id);
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

      clearCart();

      toast.success(`Commande ${orderNumber} validée avec succès !`, {
        position: 'bottom-right'
      });
      router.push(`/checkout/confirmation?order_id=${newOrder.id}`);
    } catch (error) {
      console.error('Error processing order:', error);
      toast.error('Erreur lors du traitement de la commande');
    } finally {
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
            <p className="text-gray-600">
              Vous devez être connecté pour accéder au processus de commande.
            </p>
            <div className="flex gap-3">
              <Button asChild className="flex-1">
                <Link href="/auth/login">Se connecter</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/auth/register">Créer un compte</Link>
              </Button>
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
            <button
              onClick={() => {
                setShowStripePayment(false);
                setCreatedOrderId(null);
                setCreatedOrderNumber(null);
              }}
              className="inline-flex items-center text-gray-600 hover:text-[#D4AF37] transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au récapitulatif
            </button>
          </div>

          <PageHeader
            icon={CreditCard}
            title="Paiement sécurisé"
            description="Finalisez votre paiement avec Stripe"
          />

          <div className="max-w-2xl mx-auto mt-8">
            <StripePaymentForm
              orderId={createdOrderId}
              userId={user.id}
              total={totalAfterWallet}
              onSuccess={() => {
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
          <Link
            href="/cart"
            className="inline-flex items-center text-gray-600 hover:text-[#D4AF37] transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au panier
          </Link>
        </div>

        <PageHeader
          icon={ShoppingBag}
          title="Finaliser ma commande"
          description="Complétez les informations ci-dessous pour valider votre commande"
        />

        <div className="max-w-4xl mx-auto mb-6">
          <Card className="border-4 border-[#D4AF37] bg-gradient-to-br from-[#D4AF37]/20 via-[#F2F2E8] to-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#D4AF37]/30 to-transparent rounded-full -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[#b8933d]/20 to-transparent rounded-full -ml-16 -mb-16" />

            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-3 text-2xl bg-gradient-to-r from-[#b8933d] to-[#d4af37] bg-clip-text text-transparent">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#b8933d] to-[#d4af37] rounded-full shadow-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                Mettre ma commande en attente
              </CardTitle>
              <CardDescription className="text-base text-gray-700 ml-15">
                Payez les frais de livraison maintenant, mais l'expédition sera effectuée dans 5 jours (ou validée manuellement avant).
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-start space-x-4 bg-white/80 backdrop-blur-sm rounded-xl p-5 border-2 border-[#D4AF37]/40 shadow-lg">
                <Checkbox
                  id="createPendingPackage"
                  checked={createPendingPackage}
                  onCheckedChange={(checked) => setCreatePendingPackage(checked as boolean)}
                  className="mt-1 border-[#D4AF37] data-[state=checked]:bg-[#D4AF37]"
                />
                <div className="space-y-3 flex-1">
                  <label
                    htmlFor="createPendingPackage"
                    className="text-base font-semibold leading-none cursor-pointer text-gray-900"
                  >
                    Créer un colis en attente pour cette commande
                  </label>
                  {createPendingPackage && (
                    <div className="p-4 bg-gradient-to-br from-[#D4AF37]/10 to-[#b8933d]/5 border-2 border-[#D4AF37]/50 rounded-lg shadow-md">
                      <ul className="text-sm text-gray-800 space-y-2">
                        <li className="flex items-start gap-3">
                          <div className="flex items-center justify-center w-6 h-6 bg-[#D4AF37] rounded-full flex-shrink-0 mt-0.5">
                            <Info className="h-4 w-4 text-white" />
                          </div>
                          <span className="font-medium">Les frais de livraison seront payés aujourd'hui</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="flex items-center justify-center w-6 h-6 bg-[#D4AF37] rounded-full flex-shrink-0 mt-0.5">
                            <Info className="h-4 w-4 text-white" />
                          </div>
                          <span className="font-medium">Votre colis sera expédié automatiquement dans 5 jours</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="flex items-center justify-center w-6 h-6 bg-[#D4AF37] rounded-full flex-shrink-0 mt-0.5">
                            <Info className="h-4 w-4 text-white" />
                          </div>
                          <span className="font-medium">Vous pouvez valider l'expédition manuellement depuis votre compte avant cette date</span>
                        </li>
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
            {openPackage && !packageLoading && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-[#D4AF37]" />
                    Colis ouvert disponible
                  </CardTitle>
                  <CardDescription>
                    Vous avez un colis ouvert actif. Ajoutez cette commande pour économiser les frais de port !
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="addToOpenPackage"
                      checked={addToOpenPackage}
                      onCheckedChange={(checked) => setAddToOpenPackage(checked as boolean)}
                    />
                    <label
                      htmlFor="addToOpenPackage"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Ajouter au colis ouvert (économisez {selectedShippingMethod?.cost.toFixed(2) || '0.00'} € de frais de port)
                    </label>
                  </div>
                  {addToOpenPackage && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-800">
                        <Info className="h-4 w-4 inline mr-1" />
                        Cette commande sera ajoutée à votre colis ouvert. Les frais de port ont déjà été payés.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {!addToOpenPackage && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-[#D4AF37]" />
                      Adresse de livraison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {addresses.length > 0 ? (
                      <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId}>
                        <div className="space-y-3">
                          {addresses.map((address) => (
                            <div key={address.id} className="flex items-start space-x-3 border p-4 rounded-lg hover:border-[#D4AF37] transition-colors">
                              <RadioGroupItem value={address.id} id={address.id} />
                              <label htmlFor={address.id} className="flex-1 cursor-pointer">
                                <div className="font-medium">{address.label || 'Adresse'}</div>
                                <div className="text-sm text-gray-600">
                                  {address.first_name} {address.last_name}<br />
                                  {address.address_line1}<br />
                                  {address.address_line2 && <>{address.address_line2}<br /></>}
                                  {address.postal_code} {address.city}<br />
                                  {address.country}<br />
                                  Tél: {address.phone}
                                </div>
                                {address.is_default && (
                                  <Badge variant="outline" className="mt-2">Par défaut</Badge>
                                )}
                              </label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-600 mb-4">Aucune adresse enregistrée</p>
                        <Button asChild variant="outline">
                          <Link href="/account/addresses">Ajouter une adresse</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-[#D4AF37]" />
                      Mode de livraison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={selectedShippingMethodId} onValueChange={setSelectedShippingMethodId}>
                      <div className="space-y-3">
                        {shippingMethods.map((method) => (
                          <div key={method.id} className="flex items-start space-x-3 border p-4 rounded-lg hover:border-[#D4AF37] transition-colors">
                            <RadioGroupItem value={method.id} id={method.id} />
                            <label htmlFor={method.id} className="flex-1 cursor-pointer">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">{method.name}</span>
                                <span className="font-semibold text-[#D4AF37]">
                                  {method.cost === 0 ? 'Gratuit' : `${method.cost.toFixed(2)} €`}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600">
                                {method.description}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Délai: {method.delivery_time}
                              </div>
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
                            setRelayPointData({
                              name: point.name,
                              address: `${point.address}, ${point.postalCode} ${point.city}`,
                              id: point.id,
                              provider: point.provider
                            });
                          }}
                          selectedPoint={relayPointData}
                          customerAddress={selectedAddress ? {
                            postalCode: selectedAddress.postal_code,
                            city: selectedAddress.city
                          } : undefined}
                        />

                        {relayPointData && (
                          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-sm text-green-800 font-medium">
                              <MapPin className="h-4 w-4 inline mr-1" />
                              Point relais sélectionné
                            </p>
                            <p className="text-sm text-green-800 mt-1">{relayPointData.name}</p>
                            <p className="text-xs text-green-700">{relayPointData.address}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#D4AF37]" />
                  Mode de paiement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedPaymentMethodId} onValueChange={setSelectedPaymentMethodId}>
                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="flex items-start space-x-3 border p-4 rounded-lg hover:border-[#D4AF37] transition-colors">
                        <RadioGroupItem value={method.id} id={`payment-${method.id}`} />
                        <label htmlFor={`payment-${method.id}`} className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">{method.icon}</span>
                            <span className="font-medium">{method.name}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {method.description}
                          </div>
                          {(method.processing_fee_percentage > 0 || method.processing_fee_fixed > 0) && (
                            <div className="text-xs text-gray-500 mt-1">
                              Frais: {method.processing_fee_percentage > 0 && `${method.processing_fee_percentage}%`}
                              {method.processing_fee_percentage > 0 && method.processing_fee_fixed > 0 && ' + '}
                              {method.processing_fee_fixed > 0 && `${method.processing_fee_fixed.toFixed(2)} €`}
                            </div>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>

                {selectedPaymentMethod?.code === 'bank_transfer' && (
                  <div className="mt-4">
                    <Dialog open={bankDialogOpen} onOpenChange={setBankDialogOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" className="w-full">
                          <Wallet className="h-4 w-4 mr-2" />
                          Voir les coordonnées bancaires
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Coordonnées bancaires pour virement</DialogTitle>
                          <DialogDescription>
                            Utilisez ces informations pour effectuer votre virement bancaire
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                            <div>
                              <p className="text-xs font-medium text-blue-800 uppercase">Compte Courant</p>
                              <p className="text-blue-900 font-semibold">31822952121 - SAS A U MORGANE DEWANIN</p>
                            </div>
                            <Separator />
                            <div>
                              <p className="text-xs font-medium text-blue-800 uppercase">IBAN</p>
                              <p className="text-blue-900 font-mono text-sm break-all">FR76 1350 7000 4331 8229 5212 127</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-blue-800 uppercase">BIC</p>
                              <p className="text-blue-900 font-mono text-sm">CCBPFRPPLIL</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-xs font-medium text-blue-800 uppercase">Code banque</p>
                                <p className="text-blue-900 font-mono text-sm">13507</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-blue-800 uppercase">Code guichet</p>
                                <p className="text-blue-900 font-mono text-sm">00043</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-xs font-medium text-blue-800 uppercase">N° du compte</p>
                                <p className="text-blue-900 font-mono text-sm">31822952121</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-blue-800 uppercase">Clé RIB</p>
                                <p className="text-blue-900 font-mono text-sm">27</p>
                              </div>
                            </div>
                            <Separator />
                            <div>
                              <p className="text-xs font-medium text-blue-800 uppercase">Banque</p>
                              <p className="text-blue-900 font-semibold">BANQUE POPULAIRE DU NORD</p>
                              <p className="text-blue-700 text-xs mt-1">Agence: AG CENTRALE</p>
                            </div>
                          </div>

                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-800 flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span>
                                Pensez à indiquer votre <strong>numéro de commande</strong> comme référence du virement pour un traitement rapide
                              </span>
                            </p>
                          </div>

                          <Button
                            type="button"
                            className="w-full"
                            onClick={() => setBankDialogOpen(false)}
                          >
                            J'ai noté les informations
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-800">
                        <Info className="h-4 w-4 inline mr-1" />
                        Votre commande sera validée après réception du virement
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {!addToOpenPackage && selectedShippingMethodId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-[#D4AF37]" />
                    Assurance livraison (facultative)
                  </CardTitle>
                  <CardDescription>
                    Protégez votre colis contre la perte, le vol ou les dommages pendant le transport
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={shippingInsurance} onValueChange={setShippingInsurance}>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 border p-4 rounded-lg hover:border-[#D4AF37] transition-colors">
                        <RadioGroupItem value="0" id="insurance-none" />
                        <label htmlFor="insurance-none" className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">Sans assurance</span>
                              <p className="text-sm text-gray-600 mt-1">
                                Pas de protection supplémentaire
                              </p>
                            </div>
                            <span className="font-semibold text-[#D4AF37]">Gratuit</span>
                          </div>
                        </label>
                      </div>

                      <div className="flex items-center space-x-3 border p-4 rounded-lg hover:border-[#D4AF37] transition-colors">
                        <RadioGroupItem value="1.00" id="insurance-serenity" />
                        <label htmlFor="insurance-serenity" className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">Garantie Sérénité</span>
                              <p className="text-sm text-gray-600 mt-1">
                                Protection perte, remboursement après enquête (30 jours)
                              </p>
                            </div>
                            <span className="font-semibold text-[#D4AF37]">1,00 €</span>
                          </div>
                        </label>
                      </div>

                      <div className="flex items-center space-x-3 border-2 border-[#D4AF37]/40 p-4 rounded-lg bg-gradient-to-br from-[#F2F2E8] to-white relative">
                        <RadioGroupItem value="2.90" id="insurance-diamond" />
                        <Badge
                          className="absolute -top-2 right-4 bg-gradient-to-r from-[#b8933d] to-[#d4af37] text-white px-2 py-0.5 text-xs"
                        >
                          La plus choisie
                        </Badge>
                        <label htmlFor="insurance-diamond" className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-semibold text-[#D4AF37]">Protection Diamant</span>
                              <p className="text-sm text-gray-700 mt-1 font-medium">
                                Remboursement ou renvoi immédiat sous 48h (Perte/Casse), sans enquête
                              </p>
                            </div>
                            <span className="font-bold text-[#D4AF37] text-lg">2,90 €</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            )}

            <Card className="border-[#D4AF37]/20 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#F2F2E8] to-white border-b border-[#D4AF37]/10">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Gift className="h-6 w-6 text-[#D4AF37]" />
                  Réductions & Fidélité
                </CardTitle>
                <CardDescription>
                  Profitez de vos avantages pour réduire le montant de votre commande
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Porte-monnaie */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-[#D4AF37]" />
                      <Label className="text-base font-semibold">Mon porte-monnaie</Label>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30 font-semibold px-3 py-1"
                    >
                      {(profile?.wallet_balance || 0).toFixed(2)} € disponible
                    </Badge>
                  </div>

                  {(profile?.wallet_balance || 0) > 0 ? (
                    <div className="border border-[#D4AF37]/20 rounded-lg p-4 bg-gradient-to-br from-[#F2F2E8] to-white hover:border-[#D4AF37]/40 transition-all">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="useWallet"
                          checked={useWallet}
                          onCheckedChange={(checked) => {
                            setUseWallet(checked as boolean);
                            if (!checked) {
                              setWalletAmountToUse(0);
                            } else {
                              const maxAmount = Math.min(profile?.wallet_balance || 0, totalAfterDiscount);
                              setWalletAmountToUse(maxAmount);
                            }
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <label htmlFor="useWallet" className="cursor-pointer">
                            <p className="font-medium text-gray-900">
                              Utiliser mon solde de {(profile?.wallet_balance || 0).toFixed(2)} €
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              Économisez jusqu'à {Math.min(profile?.wallet_balance || 0, totalAfterDiscount).toFixed(2)} € sur cette commande
                            </p>
                          </label>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <p className="text-sm text-gray-600 text-center">
                        Votre porte-monnaie est vide. Gagnez des points lors de vos achats ou en participant à nos jeux !
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Cagnotte fidélité */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <PiggyBank className="h-5 w-5 text-[#D4AF37]" />
                      <Label className="text-base font-semibold">Ma cagnotte fidélité</Label>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30 font-semibold px-3 py-1"
                    >
                      {(profile?.loyalty_euros || 0).toFixed(2)} € disponible
                    </Badge>
                  </div>

                  {(profile?.loyalty_euros || 0) > 0 ? (
                    <div className="border border-[#D4AF37]/20 rounded-lg p-4 bg-gradient-to-br from-[#F2F2E8] to-white hover:border-[#D4AF37]/40 transition-all">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="useLoyalty"
                          checked={useLoyalty}
                          onCheckedChange={(checked) => {
                            setUseLoyalty(checked as boolean);
                            if (!checked) {
                              setLoyaltyAmountToUse(0);
                            } else {
                              const afterWallet = Math.max(0, totalAfterDiscount - walletAmountToUse);
                              const maxAmount = Math.min(profile?.loyalty_euros || 0, afterWallet);
                              setLoyaltyAmountToUse(maxAmount);
                            }
                          }}
                          className="mt-1 border-[#D4AF37] data-[state=checked]:bg-[#D4AF37]"
                        />
                        <div className="flex-1">
                          <label htmlFor="useLoyalty" className="cursor-pointer">
                            <p className="font-medium text-gray-900">
                              Utiliser ma cagnotte de {(profile?.loyalty_euros || 0).toFixed(2)} €
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              Économisez jusqu'à {Math.min(profile?.loyalty_euros || 0, Math.max(0, totalAfterDiscount - walletAmountToUse)).toFixed(2)} € sur cette commande
                            </p>
                          </label>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <p className="text-sm text-gray-600 text-center">
                        Votre cagnotte est vide. Gagnez des euros en participant à nos jeux, lives et achats !
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Coupons gagnés */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="h-5 w-5 text-[#D4AF37]" />
                    <Label className="text-base font-semibold">Mes coupons gagnés</Label>
                  </div>

                  {couponsLoading ? (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <p className="text-sm text-gray-600 text-center">Chargement de vos coupons...</p>
                    </div>
                  ) : userCoupons.length > 0 ? (
                    <div className="space-y-3">
                      <RadioGroup
                        value={selectedUserCouponId}
                        onValueChange={(value) => {
                          setSelectedUserCouponId(value);
                          const selectedCoupon = userCoupons.find(c => c.id === value);
                          if (selectedCoupon && selectedCoupon.coupon_type) {
                            const discount = selectedCoupon.coupon_type.discount_type === 'percentage'
                              ? (subtotal * selectedCoupon.coupon_type.discount_value / 100)
                              : Number(selectedCoupon.coupon_type.discount_value);
                            setDiscountAmount(discount);
                          } else {
                            setDiscountAmount(0);
                          }
                        }}
                      >
                        {userCoupons.map((coupon) => (
                          <div
                            key={coupon.id}
                            className="border border-[#D4AF37]/20 rounded-lg p-4 bg-gradient-to-br from-white to-[#F2F2E8] hover:border-[#D4AF37]/50 transition-all cursor-pointer relative overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 w-20 h-20 bg-[#D4AF37]/5 rounded-full -mr-10 -mt-10" />
                            <div className="flex items-start space-x-3 relative">
                              <RadioGroupItem value={coupon.id} id={coupon.id} className="mt-1" />
                              <label htmlFor={coupon.id} className="flex-1 cursor-pointer">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="font-semibold text-gray-900">
                                        {coupon.coupon_type?.name || 'Coupon'}
                                      </p>
                                      <Badge className="bg-[#D4AF37] text-white border-0 text-xs">
                                        {coupon.code}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">
                                      {coupon.coupon_type?.description || 'Réduction applicable'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Valable jusqu'au {new Date(coupon.valid_until).toLocaleDateString('fr-FR')}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-2xl font-bold text-[#D4AF37]">
                                      {coupon.coupon_type?.discount_type === 'percentage'
                                        ? `-${coupon.coupon_type.discount_value}%`
                                        : `-${Number(coupon.coupon_type?.discount_value || 0).toFixed(2)}€`
                                      }
                                    </p>
                                  </div>
                                </div>
                              </label>
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <p className="text-sm text-gray-600 text-center">
                        Vous n'avez pas encore de coupons. Participez à nos jeux pour en gagner !
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Code promo manuel */}
                <div className="space-y-2">
                  <Label htmlFor="coupon" className="text-base font-semibold">Code promo</Label>
                  <div className="flex gap-2">
                    <Input
                      id="coupon"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Entrez votre code"
                      className="border-[#D4AF37]/20 focus:border-[#D4AF37]"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white transition-colors"
                    >
                      Appliquer
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="referralCode">Code parrainage</Label>
                  <div className="flex gap-2">
                    <Input
                      id="referralCode"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      placeholder="Code parrainage (5€ offerts)"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        if (!referralCode.trim()) {
                          toast.error('Veuillez saisir un code parrainage');
                          return;
                        }

                        const { data: hasOrders } = await supabase
                          .from('orders')
                          .select('id')
                          .eq('user_id', user?.id)
                          .limit(1)
                          .maybeSingle();

                        if (hasOrders) {
                          toast.error('Le code parrainage est réservé aux nouveaux clients');
                          return;
                        }

                        const { data: referralData, error } = await supabase
                          .from('referral_codes')
                          .select('id, code, user_id, is_active')
                          .eq('code', referralCode.toUpperCase())
                          .eq('is_active', true)
                          .maybeSingle();

                        if (error || !referralData) {
                          toast.error('Code parrainage invalide');
                          return;
                        }

                        if (referralData.user_id === user?.id) {
                          toast.error('Vous ne pouvez pas utiliser votre propre code');
                          return;
                        }

                        setAppliedReferral(referralData);
                        setReferralDiscount(5);
                        toast.success('Code parrainage appliqué ! -5€');
                      }}
                    >
                      Appliquer
                    </Button>
                  </div>
                  {appliedReferral && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <Gift className="h-4 w-4" />
                      Code parrainage appliqué : -5,00 €
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informations complémentaires</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="notes">Notes de commande (optionnel)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Instructions de livraison, précisions, etc."
                    rows={3}
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="newsletter"
                      checked={newsletterConsent}
                      onCheckedChange={(checked) => setNewsletterConsent(checked as boolean)}
                    />
                    <label htmlFor="newsletter" className="text-sm leading-tight cursor-pointer">
                      Je souhaite recevoir les offres et actualités de La Boutique de Morgane
                    </label>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="rgpd"
                      checked={rgpdConsent}
                      onCheckedChange={(checked) => setRgpdConsent(checked as boolean)}
                    />
                    <label htmlFor="rgpd" className="text-sm leading-tight cursor-pointer">
                      <span className="text-red-500">*</span> J'accepte la{' '}
                      <Link href="/politique-confidentialite" className="text-[#D4AF37] hover:underline">
                        politique de confidentialité
                      </Link>{' '}
                      et le traitement de mes données personnelles
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Récapitulatif de votre commande</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="font-medium">
                        {(parseFloat(item.price) * item.quantity).toFixed(2)} €
                      </span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sous-total</span>
                    <span className="font-medium">{subtotal.toFixed(2)} €</span>
                  </div>

                  {!addToOpenPackage && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Livraison</span>
                      <span className="font-medium">
                        {shippingCost === 0 ? 'Gratuit' : `${shippingCost.toFixed(2)} €`}
                      </span>
                    </div>
                  )}

                  {insuranceCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Assurance</span>
                      <span className="font-medium">{insuranceCost.toFixed(2)} €</span>
                    </div>
                  )}

                  {paymentFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Frais de paiement</span>
                      <span className="font-medium">{paymentFee.toFixed(2)} €</span>
                    </div>
                  )}

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Remise {couponCode && `(${couponCode})`}</span>
                      <span className="font-medium">-{discountAmount.toFixed(2)} €</span>
                    </div>
                  )}

                  {referralDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Parrainage</span>
                      <span className="font-medium">-{referralDiscount.toFixed(2)} €</span>
                    </div>
                  )}

                  {walletAmountToUse > 0 && (
                    <div className="flex justify-between text-sm text-purple-600">
                      <span>Avoirs utilisés</span>
                      <span className="font-medium">-{walletAmountToUse.toFixed(2)} €</span>
                    </div>
                  )}

                  {loyaltyAmountToUse > 0 && (
                    <div className="flex justify-between text-sm text-[#D4AF37] font-semibold">
                      <span>Cagnotte fidélité utilisée</span>
                      <span className="font-medium">-{loyaltyAmountToUse.toFixed(2)} €</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total TTC</span>
                    <span className="font-bold text-xl text-[#D4AF37]">
                      {totalAfterWallet.toFixed(2)} €
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>dont TVA (20%)</span>
                    <span>{tvaAmount.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Total HT</span>
                    <span>{totalHT.toFixed(2)} €</span>
                  </div>
                </div>

                <Separator />

                {selectedPaymentMethod?.code === 'paypal' ? (
                  <>
                    {!rgpdConsent && (
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
                        <AlertCircle className="h-4 w-4 inline mr-1" />
                        Vous devez accepter la politique de confidentialité pour continuer
                      </div>
                    )}
                    <PayPalButtons
                      amount={totalAfterWallet}
                      disabled={!rgpdConsent || loading}
                      onSuccess={(orderId) => {
                        clearCart();
                        toast.success('Paiement PayPal réussi !');
                        router.push(`/checkout/confirmation?paypal=${orderId}`);
                      }}
                      onError={(error) => {
                        console.error('PayPal error:', error);
                        toast.error('Erreur lors du paiement PayPal');
                      }}
                    />
                  </>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading || !rgpdConsent}
                    className="w-full bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d] text-white"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Traitement en cours...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Valider la commande
                      </>
                    )}
                  </Button>
                )}

                <div className="text-xs text-gray-500 text-center">
                  <AlertCircle className="h-3 w-3 inline mr-1" />
                  Paiement sécurisé
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}
