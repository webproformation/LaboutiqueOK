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
import { toast } from 'sonner';
import { ShoppingBag, ArrowLeft, CreditCard, MapPin, Truck, Wallet, Package, AlertCircle, Info } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useOpenPackage } from '@/hooks/use-open-package';

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
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const [addToOpenPackage, setAddToOpenPackage] = useState(false);
  const [notes, setNotes] = useState('');
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [rgpdConsent, setRgpdConsent] = useState(false);

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
  const paymentFee = selectedPaymentMethod
    ? (subtotal * selectedPaymentMethod.processing_fee_percentage / 100) + selectedPaymentMethod.processing_fee_fixed
    : 0;

  const totalBeforeDiscount = subtotal + shippingCost + paymentFee;
  const totalAfterDiscount = Math.max(0, totalBeforeDiscount - discountAmount);
  const totalAfterWallet = Math.max(0, totalAfterDiscount - walletAmountToUse);
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
        wallet_amount_used: walletAmountToUse.toFixed(2),
        total: totalAfterWallet.toFixed(2),
        items: cart,
        shipping_address: selectedAddress,
        shipping_method_id: selectedShippingMethodId || null,
        payment_method_id: selectedPaymentMethodId,
        relay_point_data: relayPointData,
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

      clearCart();

      toast.success(`Commande ${orderNumber} validée avec succès !`);
      router.push('/account/orders');
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

  return (
    <div className="min-h-screen bg-[#F2F2E8] py-8">
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

        <h1 className="text-4xl font-bold text-gray-900 mb-8 flex items-center gap-3">
          <ShoppingBag className="h-10 w-10 text-[#D4AF37]" />
          Finaliser ma commande
        </h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
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
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-800">
                          <Info className="h-4 w-4 inline mr-1" />
                          La sélection du point relais sera disponible après validation de la commande.
                        </p>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-[#D4AF37]" />
                  Options de paiement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Utiliser mon porte-monnaie</Label>
                    <Badge variant="outline">{(profile?.wallet_balance || 0).toFixed(2)} € disponible</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
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
                    />
                    <label htmlFor="useWallet" className="text-sm cursor-pointer">
                      Utiliser mon solde ({(profile?.wallet_balance || 0).toFixed(2)} €)
                    </label>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="coupon">Code promo</Label>
                  <div className="flex gap-2">
                    <Input
                      id="coupon"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Entrez votre code"
                    />
                    <Button type="button" variant="outline">
                      Appliquer
                    </Button>
                  </div>
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
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

                  {walletAmountToUse > 0 && (
                    <div className="flex justify-between text-sm text-purple-600">
                      <span>Portefeuille utilisé</span>
                      <span className="font-medium">-{walletAmountToUse.toFixed(2)} €</span>
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
