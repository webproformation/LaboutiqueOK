"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { MapPin, ShoppingBag, Loader as Loader2, Plus, ArrowLeft, Truck, CreditCard, Clock, Info, Shield } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice, parsePrice } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import GDPRConsent from '@/components/GDPRConsent';
import StripeCheckoutForm from '@/components/StripeCheckoutForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import dynamic from 'next/dynamic';

const MondialRelaySelector = dynamic(
  () => import('@/components/MondialRelaySelector'),
  {
    loading: () => (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#b8933d] mr-2" />
            <span className="text-gray-600">Chargement du sélecteur de point relais...</span>
          </div>
        </CardContent>
      </Card>
    ),
    ssr: false
  }
);

const CouponSelector = dynamic(
  () => import('@/components/CouponSelector'),
  {
    loading: () => (
      <div className="py-2">
        <Loader2 className="h-4 w-4 animate-spin text-[#b8933d]" />
      </div>
    ),
    ssr: false
  }
);

const WalletSelector = dynamic(
  () => import('@/components/WalletSelector'),
  {
    ssr: false,
  }
);

interface Address {
  id: string;
  label: string;
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: boolean;
}

interface ShippingMethod {
  id: string;
  zone_id: number;
  zone_name: string;
  instance_id: number;
  method_id: string;
  title: string;
  cost: string;
  description: string;
  is_relay?: boolean;
}

interface PaymentGateway {
  id: string;
  title: string;
  description: string;
  order: number;
}

interface TaxRate {
  id: number;
  country: string;
  state: string;
  rate: string;
  name: string;
  shipping: boolean;
  class: string;
}

interface UserCoupon {
  id: string;
  code: string;
  coupon_type_id: string;
  source: string;
  is_used: boolean;
  used_at: string | null;
  obtained_at: string;
  valid_until: string;
  coupon_types: {
    id: string;
    code: string;
    type: string;
    value: number;
    description: string;
    valid_until: string;
  };
}

const MINIMUM_ORDER_AMOUNT = 10;

const stripHtmlTags = (html: string) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
};

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cart, cartTotal, clearCart } = useCart();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>('');
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [useDeliveryBatch, setUseDeliveryBatch] = useState(false);
  const [activeBatch, setActiveBatch] = useState<any>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<UserCoupon | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [gdprConsent, setGdprConsent] = useState(false);
  const [gdprError, setGdprError] = useState('');
  const [selectedInsurance, setSelectedInsurance] = useState<string>('none');
  const [selectedRelayPoint, setSelectedRelayPoint] = useState<any>(null);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [pendingOrderNumber, setPendingOrderNumber] = useState<string>('');
  const [walletAmount, setWalletAmount] = useState(0);
  const [isFirstOrder, setIsFirstOrder] = useState(true);

  const insuranceOptions = [
    { id: 'none', label: 'Sans assurance', description: 'Pas de protection supplémentaire', price: 0 },
    { id: 'standard', label: 'Garantie Sérénité ✨', description: 'Protection en cas de perte, remboursement après enquête du transporteur (délai : 30 jours)', price: 1 },
    { id: 'premium', label: 'Protection Diamant 💎', description: 'La plus choisie. Remboursement ou renvoi immédiat sous 48h en cas de perte/casse, sans attendre l\'enquête', price: 2.90 },
  ];

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (cart.length === 0) {
      router.push('/cart');
      return;
    }

    // Clear old cache versions
    localStorage.removeItem('checkout_options_cache');
    localStorage.removeItem('checkout_options_cache_time');
    localStorage.removeItem('checkout_options_cache_v2');
    localStorage.removeItem('checkout_options_cache_time_v2');

    loadCheckoutData();
  }, [user, cart]);

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

  const loadCheckoutData = async () => {
    if (!user) return;

    try {
      // Load checkout options and addresses in parallel
      await Promise.all([
        loadAddresses(),
        loadCheckoutOptions(),
        checkActiveBatch(),
        checkIfFirstOrder(),
      ]);

      // Check customer status directly from Supabase
      try {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('blocked, blocked_reason')
          .eq('id', user.id)
          .maybeSingle();

        if (!profileError && profile && profile.blocked) {
          toast.error(profile.blocked_reason || 'Votre compte est bloqué. Contactez le service client.');
          router.push('/account');
          return;
        }
      } catch (statusError) {
        console.error('Error checking customer status:', statusError);
        // Continue with checkout even if status check fails
      }
    } catch (error) {
      console.error('Error loading checkout data:', error);
      toast.error('Erreur lors du chargement des données. Veuillez réessayer.');
    }

    setLoading(false);
  };

  const checkIfFirstOrder = async () => {
    if (!user) return;

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
    }
  };

  const checkActiveBatch = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('delivery_batches')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .gte('validate_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setActiveBatch(data);
        setUseDeliveryBatch(true);
      }
    } catch (error) {
      console.error('Error checking active batch:', error);
    }
  };

  const loadAddresses = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      setAddresses(data);
      const defaultAddress = data.find((addr) => addr.is_default);
      setSelectedAddressId(defaultAddress?.id || data[0].id);
    }
  };

  const loadCheckoutOptions = async () => {
    try {
      // Ne plus utiliser le cache - toujours charger depuis l'API
      console.log('Loading checkout options from API...');
      const response = await fetch('/api/woocommerce/checkout-options');

      console.log('Checkout options API response:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();

        console.log('Checkout options data received:', {
          shippingMethodsCount: data.shippingMethods?.length || 0,
          paymentGatewaysCount: data.paymentGateways?.length || 0,
          taxRatesCount: data.taxRates?.length || 0,
        });

        setShippingMethods(data.shippingMethods || []);
        setPaymentGateways(data.paymentGateways || []);
        setTaxRates(data.taxRates || []);

        console.log('Shipping methods set:', data.shippingMethods?.length || 0);

        if (data.shippingMethods && data.shippingMethods.length > 0) {
          const availableMethods = data.shippingMethods.filter((m: ShippingMethod) => m.method_id !== 'free_shipping');
          console.log('Available shipping methods:', availableMethods.length);
          if (availableMethods.length > 0) {
            setSelectedShippingMethod(availableMethods[0].id);
            console.log('Selected shipping method:', availableMethods[0].id);
          }
        } else {
          console.warn('No shipping methods received from API!');
        }

        if (data.paymentGateways && data.paymentGateways.length > 0) {
          setSelectedPaymentMethod(data.paymentGateways[0].id);
        }
      } else {
        console.error('Failed to fetch checkout options:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error loading checkout options:', error);
    }
  };

  const calculateShippingCost = () => {
    if (selectedCoupon?.coupon_types.type === 'free_delivery') {
      return 0;
    }
    const method = shippingMethods.find(m => m.id === selectedShippingMethod);
    return method ? parseFloat(method.cost) : 0;
  };

  const calculateInsuranceCost = () => {
    const insurance = insuranceOptions.find(opt => opt.id === selectedInsurance);
    return insurance ? insurance.price : 0;
  };

  const calculateCartDiscount = () => {
    if (!selectedCoupon) return 0;

    const couponType = selectedCoupon.coupon_types;
    if (couponType.type === 'discount_amount') {
      return Math.min(couponType.value, cartTotal);
    } else if (couponType.type === 'discount_percentage') {
      return (cartTotal * couponType.value) / 100;
    }
    return 0;
  };

  const calculateDiscount = () => {
    if (!selectedCoupon) return 0;

    const couponType = selectedCoupon.coupon_types;
    if (couponType.type === 'discount_amount') {
      return Math.min(couponType.value, cartTotal);
    } else if (couponType.type === 'discount_percentage') {
      return (cartTotal * couponType.value) / 100;
    } else if (couponType.type === 'free_delivery') {
      const method = shippingMethods.find(m => m.id === selectedShippingMethod);
      return method ? parseFloat(method.cost) : 0;
    }
    return 0;
  };

  const calculateTax = () => {
    const subtotalAfterDiscount = cartTotal - calculateCartDiscount();
    const totalTTC = subtotalAfterDiscount + calculateShippingCost() + calculateInsuranceCost();
    const taxAmount = totalTTC - (totalTTC / 1.20);
    return taxAmount;
  };

  const calculateTotal = () => {
    const subtotalAfterDiscount = cartTotal - calculateCartDiscount();
    const totalTTC = subtotalAfterDiscount + calculateShippingCost() + calculateInsuranceCost();
    const totalAfterWallet = Math.max(0, totalTTC - walletAmount);
    return totalAfterWallet;
  };

  const calculateTotalBeforeWallet = () => {
    const subtotalAfterDiscount = cartTotal - calculateCartDiscount();
    const totalTTC = subtotalAfterDiscount + calculateShippingCost() + calculateInsuranceCost();
    return totalTTC;
  };

  const handleWalletAmountChange = (amount: number) => {
    setWalletAmount(amount);
    if (amount > 0) {
      localStorage.setItem('cart_wallet_amount', amount.toString());
    } else {
      localStorage.removeItem('cart_wallet_amount');
    }
  };

  const generateOrderNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `CMD-${timestamp}-${random}`;
  };

  const createDeliveryBatch = async () => {
    if (isFirstOrder && cartTotal < MINIMUM_ORDER_AMOUNT) {
      toast.error(`Le montant minimum pour votre première commande est de ${MINIMUM_ORDER_AMOUNT.toFixed(2)} €`);
      return;
    }

    if (!selectedAddressId) {
      toast.error('Veuillez sélectionner une adresse de livraison');
      return;
    }

    if (!activeBatch) {
      if (!selectedShippingMethod) {
        toast.error('Veuillez sélectionner un mode de livraison');
        return;
      }

      const method = shippingMethods.find(m => m.id === selectedShippingMethod);
      const isRelayDelivery = method?.is_relay === true;

      if (isRelayDelivery && !selectedRelayPoint) {
        toast.error('Veuillez sélectionner un point relais');
        return;
      }
    }

    if (!selectedPaymentMethod) {
      toast.error('Veuillez sélectionner un mode de paiement');
      return;
    }

    setProcessing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const shippingCost = calculateShippingCost();
      const selectedAddress = addresses.find((addr) => addr.id === selectedAddressId);
      const selectedShipping = shippingMethods.find(m => m.id === selectedShippingMethod);

      const items = cart.map(item => ({
        product_id: item.id,
        product_name: item.name,
        product_slug: item.slug,
        quantity: item.quantity,
        unit_price: parsePrice(item.price),
        total_price: parsePrice(item.price) * item.quantity,
        image_url: item.image?.sourceUrl || null,
      }));

      let batchId = activeBatch?.id;
      const subtotalAfterDiscount = cartTotal - calculateCartDiscount();
      let paymentAmount = cartTotal;
      const selectedPaymentGateway = paymentGateways.find(g => g.id === selectedPaymentMethod);

      // Si c'est la première commande avec livraison groupée
      if (!activeBatch) {
        // Payer produits + frais de livraison + TVA
        const baseHT = subtotalAfterDiscount + shippingCost + calculateInsuranceCost();
        const tva = baseHT * 0.20;
        paymentAmount = baseHT + tva;

        let paymentIntentId = null;

        // Si c'est Stripe, créer un Payment Intent
        if (selectedPaymentMethod === 'stripe') {
          const paymentResponse = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-payment-intent`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session?.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                amount: paymentAmount,
                currency: 'eur',
                description: 'Mon colis ouvert - Première commande',
              }),
            }
          );

          if (!paymentResponse.ok) {
            throw new Error('Erreur lors de la création du paiement');
          }

          const paymentData = await paymentResponse.json();
          paymentIntentId = paymentData.paymentIntentId;
        }

        // Créer le batch
        const { data: newBatch, error: batchError } = await supabase
          .from('delivery_batches')
          .insert({
            user_id: user!.id,
            shipping_cost: shippingCost,
            shipping_address_id: selectedAddressId,
            status: 'pending',
          })
          .select()
          .single();

        if (batchError) throw batchError;
        batchId = newBatch.id;

        // Créer commande WooCommerce
        const wooOrderData = {
          status: selectedPaymentMethod === 'stripe' ? 'processing' : 'pending',
          payment_method: selectedPaymentMethod,
          payment_method_title: selectedPaymentGateway?.title || 'Paiement',
          set_paid: selectedPaymentMethod === 'stripe',
          billing: {
            first_name: selectedAddress!.first_name,
            last_name: selectedAddress!.last_name,
            address_1: selectedAddress!.address_line1,
            address_2: selectedAddress!.address_line2 || '',
            city: selectedAddress!.city,
            postcode: selectedAddress!.postal_code,
            country: selectedAddress!.country,
            email: user!.email || '',
            phone: selectedAddress!.phone,
          },
          shipping: selectedRelayPoint ? {
            first_name: selectedAddress!.first_name,
            last_name: selectedAddress!.last_name,
            address_1: selectedRelayPoint.LgAdr1 || selectedRelayPoint.LgAdr3,
            address_2: selectedRelayPoint.LgAdr2 || '',
            city: selectedRelayPoint.Ville,
            postcode: selectedRelayPoint.CP,
            country: selectedRelayPoint.Pays,
          } : {
            first_name: selectedAddress!.first_name,
            last_name: selectedAddress!.last_name,
            address_1: selectedAddress!.address_line1,
            address_2: selectedAddress!.address_line2 || '',
            city: selectedAddress!.city,
            postcode: selectedAddress!.postal_code,
            country: selectedAddress!.country,
          },
          line_items: items.map(item => ({
            product_id: parseInt(item.product_id),
            quantity: item.quantity,
          })),
          shipping_lines: [{
            method_id: selectedShipping!.method_id,
            method_title: 'Mon colis ouvert (5 jours)',
            total: shippingCost.toString(),
          }],
          meta_data: [
            {
              key: '_supabase_batch_id',
              value: batchId,
            },
            ...(paymentIntentId ? [{
              key: '_stripe_payment_intent_id',
              value: paymentIntentId,
            }] : []),
            ...(selectedRelayPoint ? [
              {
                key: '_mondial_relay_id',
                value: selectedRelayPoint.Num,
              },
              {
                key: '_mondial_relay_name',
                value: selectedRelayPoint.LgAdr1 || selectedRelayPoint.LgAdr3,
              },
              {
                key: '_mondial_relay_address',
                value: `${selectedRelayPoint.LgAdr3 || ''} ${selectedRelayPoint.CP} ${selectedRelayPoint.Ville}`,
              },
            ] : []),
          ],
        };

        const wooResponse = await fetch('/api/woocommerce/create-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderData: wooOrderData,
              localOrderId: null,
            }),
          }
        );

        if (!wooResponse.ok) {
          const errorText = await wooResponse.text();
          console.error('WooCommerce order creation failed:', errorText);
          throw new Error('Erreur lors de la création de la commande WooCommerce');
        }

        const wooResult = await wooResponse.json();

        // Mettre à jour le batch avec l'ID WooCommerce
        const { error: updateError } = await supabase
          .from('delivery_batches')
          .update({
            woocommerce_order_id: wooResult.woocommerceOrderId?.toString(),
          })
          .eq('id', batchId);

        if (updateError) {
          console.error('Failed to update batch with WooCommerce order ID:', updateError);
        }

      } else {
        // Commande suivante : payer uniquement les produits + assurance + TVA
        const baseHT = subtotalAfterDiscount + calculateInsuranceCost();
        const tva = baseHT * 0.20;
        paymentAmount = baseHT + tva;

        let paymentIntentId = null;

        // Si c'est Stripe, créer un Payment Intent
        if (selectedPaymentMethod === 'stripe') {
          const paymentResponse = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-payment-intent`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session?.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                amount: paymentAmount,
                currency: 'eur',
                description: 'Mon colis ouvert - Produits supplémentaires',
              }),
            }
          );

          if (!paymentResponse.ok) {
            throw new Error('Erreur lors de la création du paiement');
          }

          const paymentData = await paymentResponse.json();
          paymentIntentId = paymentData.paymentIntentId;
        }

        // Créer commande WooCommerce pour les nouveaux produits
        const wooOrderData = {
          status: selectedPaymentMethod === 'stripe' ? 'processing' : 'pending',
          payment_method: selectedPaymentMethod,
          payment_method_title: selectedPaymentGateway?.title || 'Paiement',
          set_paid: selectedPaymentMethod === 'stripe',
          billing: {
            first_name: selectedAddress!.first_name,
            last_name: selectedAddress!.last_name,
            address_1: selectedAddress!.address_line1,
            address_2: selectedAddress!.address_line2 || '',
            city: selectedAddress!.city,
            postcode: selectedAddress!.postal_code,
            country: selectedAddress!.country,
            email: user!.email || '',
            phone: selectedAddress!.phone,
          },
          shipping: selectedRelayPoint ? {
            first_name: selectedAddress!.first_name,
            last_name: selectedAddress!.last_name,
            address_1: selectedRelayPoint.LgAdr1 || selectedRelayPoint.LgAdr3,
            address_2: selectedRelayPoint.LgAdr2 || '',
            city: selectedRelayPoint.Ville,
            postcode: selectedRelayPoint.CP,
            country: selectedRelayPoint.Pays,
          } : {
            first_name: selectedAddress!.first_name,
            last_name: selectedAddress!.last_name,
            address_1: selectedAddress!.address_line1,
            address_2: selectedAddress!.address_line2 || '',
            city: selectedAddress!.city,
            postcode: selectedAddress!.postal_code,
            country: selectedAddress!.country,
          },
          line_items: items.map(item => ({
            product_id: parseInt(item.product_id),
            quantity: item.quantity,
          })),
          shipping_lines: [{
            method_id: 'flat_rate',
            method_title: 'Mon colis ouvert (déjà payée)',
            total: '0',
          }],
          meta_data: [
            {
              key: '_supabase_batch_id',
              value: batchId,
            },
            ...(paymentIntentId ? [{
              key: '_stripe_payment_intent_id',
              value: paymentIntentId,
            }] : []),
            ...(selectedRelayPoint ? [
              {
                key: '_mondial_relay_id',
                value: selectedRelayPoint.Num,
              },
              {
                key: '_mondial_relay_name',
                value: selectedRelayPoint.LgAdr1 || selectedRelayPoint.LgAdr3,
              },
              {
                key: '_mondial_relay_address',
                value: `${selectedRelayPoint.LgAdr3 || ''} ${selectedRelayPoint.CP} ${selectedRelayPoint.Ville}`,
              },
            ] : []),
          ],
        };

        const wooResponse = await fetch('/api/woocommerce/create-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderData: wooOrderData,
              localOrderId: null,
            }),
          }
        );

        if (!wooResponse.ok) {
          const errorText = await wooResponse.text();
          console.error('WooCommerce order creation failed:', errorText);
          throw new Error('Erreur lors de la création de la commande WooCommerce');
        }
      }

      // Ajouter les items au batch
      const batchItems = items.map(item => ({
        ...item,
        batch_id: batchId,
      }));

      const { error: itemsError } = await supabase
        .from('delivery_batch_items')
        .insert(batchItems);

      if (itemsError) throw itemsError;

      clearCart();
      toast.success('Articles ajoutés à votre colis ouvert !');
      router.push('/account/pending-deliveries');
    } catch (error) {
      console.error('Error creating delivery batch:', error);
      toast.error('Erreur lors de la création du colis ouvert');
    } finally {
      setProcessing(false);
    }
  };

  const handleStripePayment = async (
    orderNumber: string,
    selectedAddress: Address,
    selectedShipping: ShippingMethod,
    shippingCost: number,
    taxAmount: number,
    totalAmount: number
  ) => {
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user!.id,
          order_number: orderNumber,
          status: 'pending',
          total_amount: totalAmount,
          shipping_address: selectedAddress,
          shipping_method_id: selectedShippingMethod,
          shipping_cost: shippingCost,
          tax_amount: taxAmount,
        })
        .select()
        .single();

      if (orderError || !order) {
        throw new Error('Erreur lors de la création de la commande');
      }

      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_name: item.name,
        product_slug: item.slug,
        product_image: item.image?.sourceUrl || '',
        price: item.price,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        throw new Error('Erreur lors de l\'enregistrement des articles');
      }

      if (selectedCoupon) {
        await supabase
          .from('user_coupons')
          .update({
            is_used: true,
            used_at: new Date().toISOString(),
            order_id: order.id,
          })
          .eq('id', selectedCoupon.id);
      }

      if (walletAmount > 0) {
        await supabase
          .from('loyalty_transactions')
          .insert({
            user_id: user!.id,
            amount: -walletAmount,
            type: 'admin_adjustment',
            description: `Utilisation de la cagnotte pour la commande ${orderNumber}`,
            reference_id: order.id,
          });

        localStorage.removeItem('cart_wallet_amount');
      }

      const { data: { session } } = await supabase.auth.getSession();

      const paymentResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-payment-intent`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: totalAmount,
            currency: 'eur',
            orderId: order.id,
          }),
        }
      );

      if (!paymentResponse.ok) {
        throw new Error('Erreur lors de la création du paiement Stripe');
      }

      const paymentData = await paymentResponse.json();

      setPendingOrderNumber(orderNumber);
      setStripeClientSecret(paymentData.clientSecret);
      setShowStripeModal(true);

    } catch (error) {
      console.error('Stripe payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue lors du paiement Stripe';
      toast.error(errorMessage);
      setProcessing(false);
    }
  };

  const handleStripeSuccess = async () => {
    try {
      const selectedAddress = addresses.find((addr) => addr.id === selectedAddressId);
      const selectedShipping = shippingMethods.find(m => m.id === selectedShippingMethod);

      const wooOrderData = {
        status: 'processing',
        payment_method: 'stripe',
        payment_method_title: 'Carte bancaire (Stripe)',
        set_paid: true,
        billing: {
          first_name: selectedAddress!.first_name,
          last_name: selectedAddress!.last_name,
          address_1: selectedAddress!.address_line1,
          address_2: selectedAddress!.address_line2 || '',
          city: selectedAddress!.city,
          postcode: selectedAddress!.postal_code,
          country: selectedAddress!.country,
          email: user!.email || '',
          phone: selectedAddress!.phone,
        },
        shipping: selectedRelayPoint ? {
          first_name: selectedAddress!.first_name,
          last_name: selectedAddress!.last_name,
          address_1: selectedRelayPoint.LgAdr1 || selectedRelayPoint.LgAdr3,
          address_2: selectedRelayPoint.LgAdr2 || '',
          city: selectedRelayPoint.Ville,
          postcode: selectedRelayPoint.CP,
          country: selectedRelayPoint.Pays,
        } : {
          first_name: selectedAddress!.first_name,
          last_name: selectedAddress!.last_name,
          address_1: selectedAddress!.address_line1,
          address_2: selectedAddress!.address_line2 || '',
          city: selectedAddress!.city,
          postcode: selectedAddress!.postal_code,
          country: selectedAddress!.country,
        },
        line_items: cart.map(item => ({
          product_id: item.databaseId || parseInt(item.id) || 0,
          quantity: item.quantity,
        })),
        shipping_lines: [{
          method_id: selectedShipping!.method_id,
          method_title: selectedShipping!.title,
          total: selectedShipping!.cost,
        }],
        meta_data: [
          ...(selectedRelayPoint ? [
            {
              key: '_mondial_relay_id',
              value: selectedRelayPoint.Num,
            },
            {
              key: '_mondial_relay_name',
              value: selectedRelayPoint.LgAdr1 || selectedRelayPoint.LgAdr3,
            },
            {
              key: '_mondial_relay_address',
              value: `${selectedRelayPoint.LgAdr3 || ''} ${selectedRelayPoint.CP} ${selectedRelayPoint.Ville}`,
            },
          ] : []),
        ],
      };

      const wooResponse = await fetch('/api/woocommerce/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wooOrderData),
      });

      if (!wooResponse.ok) {
        console.error('WooCommerce order creation failed');
      }

      clearCart();
      setShowStripeModal(false);
      toast.success('Paiement réussi !');
      router.push(`/order-confirmation/${pendingOrderNumber}`);
    } catch (error) {
      console.error('Error completing Stripe order:', error);
      toast.error('Paiement effectué mais erreur lors de la finalisation de la commande');
      setShowStripeModal(false);
      setProcessing(false);
    }
  };

  const handleStripeError = (error: string) => {
    toast.error(`Erreur de paiement: ${error}`);
    setProcessing(false);
  };

  const handlePayPalPayment = async (
    orderNumber: string,
    selectedAddress: Address,
    selectedShipping: ShippingMethod,
    shippingCost: number,
    taxAmount: number,
    totalAmount: number
  ) => {
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user!.id,
          order_number: orderNumber,
          status: 'pending',
          total_amount: totalAmount,
          shipping_address: selectedAddress,
          shipping_method_id: selectedShippingMethod,
          shipping_cost: shippingCost,
          tax_amount: taxAmount,
        })
        .select()
        .single();

      if (orderError || !order) {
        throw new Error('Erreur lors de la création de la commande');
      }

      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_name: item.name,
        product_slug: item.slug,
        product_image: item.image?.sourceUrl || '',
        price: item.price,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        throw new Error('Erreur lors de l\'enregistrement des articles');
      }

      if (selectedCoupon) {
        await supabase
          .from('user_coupons')
          .update({
            is_used: true,
            used_at: new Date().toISOString(),
            order_id: order.id,
          })
          .eq('id', selectedCoupon.id);
      }

      if (walletAmount > 0) {
        await supabase
          .from('loyalty_transactions')
          .insert({
            user_id: user!.id,
            amount: -walletAmount,
            type: 'admin_adjustment',
            description: `Utilisation de la cagnotte pour la commande ${orderNumber}`,
            reference_id: order.id,
          });

        localStorage.removeItem('cart_wallet_amount');
      }

      const paypalResponse = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: totalAmount,
          currency: 'EUR',
          description: `Commande ${orderNumber} - La Boutique de Morgane`,
          returnUrl: `${window.location.origin}/order-confirmation/${orderNumber}?paypal=success`,
          cancelUrl: `${window.location.origin}/order-confirmation/${orderNumber}?paypal=cancelled`,
        }),
      });

      const paypalData = await paypalResponse.json();

      if (!paypalResponse.ok) {
        console.error('PayPal API error:', paypalData);
        throw new Error(paypalData.error || 'Erreur lors de la création de la commande PayPal');
      }

      localStorage.setItem('pending_order_id', order.id);
      localStorage.setItem('pending_order_number', orderNumber);
      localStorage.setItem('paypal_order_id', paypalData.orderId);

      const popup = window.open(
        paypalData.approvalUrl,
        'PayPal',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        toast.error('Veuillez autoriser les popups pour continuer avec PayPal');
        setProcessing(false);
        return;
      }

      const checkPopup = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(checkPopup);
          setProcessing(false);

          const storedOrderNumber = localStorage.getItem('pending_order_number');
          if (storedOrderNumber) {
            router.push(`/order-confirmation/${storedOrderNumber}?paypal=check`);
          }
        }
      }, 500);

    } catch (error) {
      console.error('PayPal payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue lors du paiement PayPal';
      toast.error(errorMessage);
      setProcessing(false);
    }
  };

  const proceedToPayment = async () => {
    if (!gdprConsent) {
      setGdprError('Vous devez accepter les conditions pour valider votre commande');
      toast.error('Veuillez accepter les conditions générales de vente');
      return;
    }

    setGdprError('');

    const finalTotal = calculateTotal();
    if (isFirstOrder && finalTotal < MINIMUM_ORDER_AMOUNT) {
      toast.error(`Le montant minimum pour votre première commande est de ${MINIMUM_ORDER_AMOUNT.toFixed(2)} €`);
      return;
    }

    if (useDeliveryBatch) {
      await createDeliveryBatch();
      return;
    }

    if (!selectedAddressId) {
      toast.error('Veuillez sélectionner une adresse de livraison');
      return;
    }

    if (!selectedShippingMethod) {
      toast.error('Veuillez sélectionner un mode de livraison');
      return;
    }

    const method = shippingMethods.find(m => m.id === selectedShippingMethod);
    const isRelayDelivery = method?.is_relay === true;

    if (isRelayDelivery && !selectedRelayPoint) {
      toast.error('Veuillez sélectionner un point relais');
      return;
    }

    setProcessing(true);

    try {
      const selectedAddress = addresses.find((addr) => addr.id === selectedAddressId);
      const selectedShipping = shippingMethods.find(m => m.id === selectedShippingMethod);
      const orderNumber = generateOrderNumber();
      const shippingCost = calculateShippingCost();
      const taxAmount = calculateTax();
      const totalAmount = calculateTotal();

      if (selectedPaymentMethod === 'paypal') {
        await handlePayPalPayment(orderNumber, selectedAddress!, selectedShipping!, shippingCost, taxAmount, totalAmount);
        return;
      }

      if (selectedPaymentMethod === 'stripe') {
        await handleStripePayment(orderNumber, selectedAddress!, selectedShipping!, shippingCost, taxAmount, totalAmount);
        return;
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user!.id,
          order_number: orderNumber,
          status: 'processing',
          total_amount: totalAmount,
          shipping_address: selectedAddress,
          shipping_method_id: selectedShippingMethod,
          shipping_cost: shippingCost,
          tax_amount: taxAmount,
        })
        .select()
        .single();

      if (orderError || !order) {
        throw new Error('Erreur lors de la création de la commande');
      }

      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_name: item.name,
        product_slug: item.slug,
        product_image: item.image?.sourceUrl || '',
        price: item.price,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        throw new Error('Erreur lors de l\'enregistrement des articles');
      }

      if (selectedCoupon) {
        await supabase
          .from('user_coupons')
          .update({
            is_used: true,
            used_at: new Date().toISOString(),
            order_id: order.id,
          })
          .eq('id', selectedCoupon.id);
      }

      if (walletAmount > 0) {
        await supabase
          .from('loyalty_transactions')
          .insert({
            user_id: user!.id,
            amount: -walletAmount,
            type: 'admin_adjustment',
            description: `Utilisation de la cagnotte pour la commande ${orderNumber}`,
            reference_id: order.id,
          });

        localStorage.removeItem('cart_wallet_amount');
      }

      const { data: { session } } = await supabase.auth.getSession();

      const wooOrderData = {
        payment_method: 'bacs',
        payment_method_title: 'Virement bancaire',
        set_paid: false,
        billing: {
          first_name: selectedAddress!.first_name,
          last_name: selectedAddress!.last_name,
          address_1: selectedAddress!.address_line1,
          address_2: selectedAddress!.address_line2 || '',
          city: selectedAddress!.city,
          postcode: selectedAddress!.postal_code,
          country: selectedAddress!.country,
          email: user!.email || '',
          phone: selectedAddress!.phone,
        },
        shipping: selectedRelayPoint ? {
          first_name: selectedAddress!.first_name,
          last_name: selectedAddress!.last_name,
          address_1: selectedRelayPoint.LgAdr1 || selectedRelayPoint.LgAdr3,
          address_2: selectedRelayPoint.LgAdr2 || '',
          city: selectedRelayPoint.Ville,
          postcode: selectedRelayPoint.CP,
          country: selectedRelayPoint.Pays,
        } : {
          first_name: selectedAddress!.first_name,
          last_name: selectedAddress!.last_name,
          address_1: selectedAddress!.address_line1,
          address_2: selectedAddress!.address_line2 || '',
          city: selectedAddress!.city,
          postcode: selectedAddress!.postal_code,
          country: selectedAddress!.country,
        },
        line_items: cart.map(item => ({
          product_id: item.databaseId || parseInt(item.id) || 0,
          quantity: item.quantity,
        })),
        shipping_lines: [{
          method_id: selectedShipping!.method_id,
          method_title: selectedShipping!.title,
          total: selectedShipping!.cost,
        }],
        meta_data: [
          ...(selectedRelayPoint ? [
            {
              key: '_mondial_relay_id',
              value: selectedRelayPoint.Num,
            },
            {
              key: '_mondial_relay_name',
              value: selectedRelayPoint.LgAdr1 || selectedRelayPoint.LgAdr3,
            },
            {
              key: '_mondial_relay_address',
              value: `${selectedRelayPoint.LgAdr3 || ''} ${selectedRelayPoint.CP} ${selectedRelayPoint.Ville}`,
            },
          ] : []),
        ],
      };

      const wooResponse = await fetch('/api/woocommerce/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wooOrderData),
      });

      if (!wooResponse.ok) {
        const errorText = await wooResponse.text();
        console.error('WooCommerce order creation failed:', errorText);
        throw new Error('Erreur lors de la création de la commande WooCommerce');
      }

      clearCart();
      toast.success('Commande validée avec succès !');
      router.push(`/order-confirmation/${orderNumber}`);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Une erreur est survenue lors de la commande');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#b8933d]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/cart"
          className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-[#b8933d]"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Retour au panier
        </Link>

        <h1 className="mb-8 text-3xl font-bold text-gray-900">
          Validation de la commande
        </h1>

        <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Mon colis ouvert (5 jours)
                  </CardTitle>
                  <CardDescription className="text-blue-800">
                    Économisez sur les frais de livraison en groupant vos achats
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeBatch && (
                    <Alert className="bg-green-50 border-green-200">
                      <Info className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Vous avez déjà un colis ouvert. Ces articles seront ajoutés sans frais de livraison supplémentaires !
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                    <div className="flex-1">
                      <Label htmlFor="delivery-batch" className="text-base font-semibold text-gray-900 cursor-pointer">
                        Activer mon colis ouvert
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        {activeBatch
                          ? 'Ajouter à votre colis existant sans frais supplémentaires'
                          : 'Vous aurez 5 jours pour ajouter d\'autres produits sans payer de nouveaux frais de livraison'
                        }
                      </p>
                    </div>
                    <Switch
                      id="delivery-batch"
                      checked={useDeliveryBatch}
                      onCheckedChange={setUseDeliveryBatch}
                      className="ml-4"
                    />
                  </div>

                  {useDeliveryBatch && (
                    <Alert className="bg-white border-blue-200">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        {activeBatch ? (
                          <>
                            <strong>Colis ouvert actif :</strong> Vos articles seront ajoutés à votre colis en cours.
                            Vous pourrez valider le colis à tout moment depuis votre espace client.
                          </>
                        ) : (
                          <>
                            <strong>Comment ça marche ?</strong> Vos articles seront mis en attente pendant 5 jours.
                            Vous pourrez ajouter d&apos;autres produits sans payer de frais de livraison supplémentaires,
                            puis valider le colis quand vous le souhaitez depuis votre espace client.
                          </>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[#b8933d]" />
                    Adresse de livraison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {addresses.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">
                        Vous n'avez pas encore d'adresse de livraison
                      </p>
                      <Button
                        onClick={() => router.push('/account/addresses')}
                        className="bg-[#b8933d] hover:bg-[#a07c2f]"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter une adresse
                      </Button>
                    </div>
                  ) : (
                    <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId}>
                      <div className="space-y-4">
                        {addresses.map((address) => (
                          <div
                            key={address.id}
                            className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                              selectedAddressId === address.id
                                ? 'border-[#b8933d] bg-[#b8933d]/5'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedAddressId(address.id)}
                          >
                            <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                            <div className="flex-1">
                              <Label htmlFor={address.id} className="cursor-pointer">
                                <div className="space-y-1">
                                  {address.label && (
                                    <p className="font-semibold text-gray-900">{address.label}</p>
                                  )}
                                  <p className="text-sm text-gray-900">
                                    {address.first_name} {address.last_name}
                                  </p>
                                  <p className="text-sm text-gray-600">{address.address_line1}</p>
                                  {address.address_line2 && (
                                    <p className="text-sm text-gray-600">{address.address_line2}</p>
                                  )}
                                  <p className="text-sm text-gray-600">
                                    {address.postal_code} {address.city}
                                  </p>
                                  <p className="text-sm text-gray-600">{address.country}</p>
                                  <p className="text-sm text-gray-600">{address.phone}</p>
                                </div>
                              </Label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  )}

                  {addresses.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => router.push('/account/addresses')}
                      className="mt-4"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter une nouvelle adresse
                    </Button>
                  )}
                </CardContent>
              </Card>

              {(!useDeliveryBatch || (useDeliveryBatch && !activeBatch)) && (
                <>
                  {shippingMethods.length === 0 ? (
                    <Alert className="border-orange-200 bg-orange-50">
                      <Info className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800">
                        <strong>Aucune méthode de livraison disponible.</strong>
                        <br />
                        Veuillez actualiser la page ou contacter le support si le problème persiste.
                        <br />
                        <button
                          onClick={() => window.location.reload()}
                          className="mt-2 underline font-semibold"
                        >
                          Actualiser la page
                        </button>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Truck className="h-5 w-5 text-[#b8933d]" />
                          Mode de livraison
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <RadioGroup value={selectedShippingMethod} onValueChange={(value) => {
                          setSelectedShippingMethod(value);
                          setSelectedRelayPoint(null);
                        }}>
                          <div className="space-y-4">
                            {shippingMethods.filter(method => method.method_id !== 'free_shipping').map((method) => (
                              <div
                                key={method.id}
                                className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                                  selectedShippingMethod === method.id
                                    ? 'border-[#b8933d] bg-[#b8933d]/5'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => {
                                  setSelectedShippingMethod(method.id);
                                  setSelectedRelayPoint(null);
                                }}
                          >
                            <RadioGroupItem value={method.id} id={method.id} className="mt-1" />
                            <div className="flex-1">
                              <Label htmlFor={method.id} className="cursor-pointer">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-semibold text-gray-900">{method.title}</p>
                                    {method.description && (
                                      <p className="text-sm text-gray-600">{stripHtmlTags(method.description)}</p>
                                    )}
                                  </div>
                                  <p className="font-bold text-[#b8933d]">
                                    {parseFloat(method.cost) === 0 ? 'Gratuit' : `${parseFloat(method.cost).toFixed(2)} €`}
                                  </p>
                                </div>
                              </Label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {(!useDeliveryBatch || (useDeliveryBatch && !activeBatch)) && selectedShippingMethod &&
               selectedAddressId &&
               (() => {
                 const method = shippingMethods.find(m => m.id === selectedShippingMethod);
                 const isRelayDelivery = method?.is_relay === true;
                 const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);

                 if (!isRelayDelivery || !selectedAddress) return null;

                 return (
                   <div className="space-y-6">
                     <MondialRelaySelector
                       postalCode={selectedAddress.postal_code}
                       country={selectedAddress.country}
                       onRelaySelected={setSelectedRelayPoint}
                       selectedRelay={selectedRelayPoint}
                       deliveryMode="24R"
                     />
                     <MondialRelaySelector
                       postalCode={selectedAddress.postal_code}
                       country={selectedAddress.country}
                       onRelaySelected={setSelectedRelayPoint}
                       selectedRelay={selectedRelayPoint}
                       deliveryMode="24L"
                     />
                   </div>
                 );
               })()
              }

              {(!useDeliveryBatch || (useDeliveryBatch && !activeBatch)) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-[#b8933d]" />
                      Assurance facultative
                    </CardTitle>
                    <CardDescription>
                      Protégez votre commande contre la casse et la perte
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={selectedInsurance} onValueChange={setSelectedInsurance}>
                      <div className="space-y-4">
                        {insuranceOptions.map((option) => (
                          <div
                            key={option.id}
                            className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                              selectedInsurance === option.id
                                ? 'border-[#b8933d] bg-[#b8933d]/5'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedInsurance(option.id)}
                          >
                            <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                            <div className="flex-1">
                              <Label htmlFor={option.id} className="cursor-pointer">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-semibold text-gray-900">{option.label}</p>
                                    <p className="text-sm text-gray-600">{option.description}</p>
                                  </div>
                                  <p className="font-bold text-[#b8933d]">
                                    {option.price === 0 ? 'Gratuit' : `+${option.price.toFixed(2)} €`}
                                  </p>
                                </div>
                              </Label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-[#b8933d]" />
                    Mode de paiement
                  </CardTitle>
                  <CardDescription>
                    {useDeliveryBatch
                      ? activeBatch
                        ? 'Choisissez votre méthode de paiement pour ces articles supplémentaires'
                        : 'Choisissez votre méthode de paiement pour votre colis ouvert'
                      : 'Choisissez votre méthode de paiement'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                    <div className="space-y-4">
                      <div
                        className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                          selectedPaymentMethod === 'stripe'
                            ? 'border-[#b8933d] bg-[#b8933d]/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedPaymentMethod('stripe')}
                      >
                        <RadioGroupItem value="stripe" id="stripe" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="stripe" className="cursor-pointer">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900">Carte bancaire</p>
                              <svg className="h-6 w-auto" viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="60" height="25" rx="4" fill="#635BFF"/>
                                <path d="M13.3 11.5c0-.4.3-.7.7-.7h2.6c.4 0 .7.3.7.7v2.2c0 .4-.3.7-.7.7H14c-.4 0-.7-.3-.7-.7v-2.2zm4 0c0-.4.3-.7.7-.7h2.6c.4 0 .7.3.7.7v2.2c0 .4-.3.7-.7.7h-2.6c-.4 0-.7-.3-.7-.7v-2.2zm4 0c0-.4.3-.7.7-.7h2.6c.4 0 .7.3.7.7v2.2c0 .4-.3.7-.7.7h-2.6c-.4 0-.7-.3-.7-.7v-2.2z" fill="white"/>
                                <path d="M36.2 11.8h-2.3l1.5 5h2.3l1.5-5h-2.3l-.7 3.3-.7-3.3z" fill="white"/>
                                <path d="M41.8 11.8h-2v5h2v-5zm8.5 0h-2.3l-1.5 5h2.3l.2-.8h1.3l.2.8h2.3l-2.5-5zm-.8 3.2l.3-1.2.3 1.2h-.6z" fill="white"/>
                              </svg>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">Paiement sécurisé par carte bancaire (Stripe)</p>
                          </Label>
                        </div>
                      </div>

                      <div
                        className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                          selectedPaymentMethod === 'paypal'
                            ? 'border-[#b8933d] bg-[#b8933d]/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedPaymentMethod('paypal')}
                      >
                        <RadioGroupItem value="paypal" id="paypal" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="paypal" className="cursor-pointer">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900">PayPal</p>
                              <svg className="h-6 w-auto" viewBox="0 0 124 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M46.211 6.749h-6.839a.95.95 0 0 0-.939.802l-2.766 17.537a.57.57 0 0 0 .564.658h3.265a.95.95 0 0 0 .939-.803l.746-4.73a.95.95 0 0 1 .938-.803h2.165c4.505 0 7.105-2.18 7.784-6.5.306-1.89.013-3.375-.872-4.415-.972-1.142-2.696-1.746-4.985-1.746zm.789 6.405c-.374 2.454-2.249 2.454-4.062 2.454h-1.032l.724-4.583a.57.57 0 0 1 .563-.481h.473c1.235 0 2.4 0 3.002.704.359.42.469 1.044.332 1.906zM66.654 13.075h-3.275a.57.57 0 0 0-.563.481l-.145.916-.229-.332c-.709-1.029-2.29-1.373-3.868-1.373-3.619 0-6.71 2.741-7.312 6.586-.313 1.918.132 3.752 1.22 5.031.998 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .562.66h2.95a.95.95 0 0 0 .939-.803l1.77-11.209a.568.568 0 0 0-.561-.658zm-4.565 6.374c-.316 1.871-1.801 3.127-3.695 3.127-.951 0-1.711-.305-2.199-.883-.484-.574-.668-1.391-.514-2.301.295-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.499.589.697 1.411.554 2.317zM84.096 13.075h-3.291a.954.954 0 0 0-.787.417l-4.539 6.686-1.924-6.425a.953.953 0 0 0-.912-.678h-3.234a.57.57 0 0 0-.541.754l3.625 10.638-3.408 4.811a.57.57 0 0 0 .465.9h3.287a.949.949 0 0 0 .781-.408l10.946-15.8a.57.57 0 0 0-.468-.895z" fill="#253B80"/>
                                <path d="M94.992 6.749h-6.84a.95.95 0 0 0-.938.802l-2.766 17.537a.569.569 0 0 0 .562.658h3.51a.665.665 0 0 0 .656-.562l.785-4.971a.95.95 0 0 1 .938-.803h2.164c4.506 0 7.105-2.18 7.785-6.5.307-1.89.012-3.375-.873-4.415-.971-1.142-2.694-1.746-4.983-1.746zm.789 6.405c-.373 2.454-2.248 2.454-4.062 2.454h-1.031l.725-4.583a.568.568 0 0 1 .562-.481h.473c1.234 0 2.4 0 3.002.704.359.42.468 1.044.331 1.906zM115.434 13.075h-3.273a.567.567 0 0 0-.562.481l-.145.916-.23-.332c-.709-1.029-2.289-1.373-3.867-1.373-3.619 0-6.709 2.741-7.311 6.586-.312 1.918.131 3.752 1.219 5.031 1 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .564.66h2.949a.95.95 0 0 0 .938-.803l1.771-11.209a.571.571 0 0 0-.565-.658zm-4.565 6.374c-.314 1.871-1.801 3.127-3.695 3.127-.949 0-1.711-.305-2.199-.883-.484-.574-.666-1.391-.514-2.301.297-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.501.589.699 1.411.554 2.317zM119.295 7.23l-2.807 17.858a.569.569 0 0 0 .562.658h2.822c.469 0 .867-.34.939-.803l2.768-17.536a.57.57 0 0 0-.562-.659h-3.16a.571.571 0 0 0-.562.482z" fill="#179BD7"/>
                                <path d="M7.266 29.154l.523-3.322-1.165-.027H1.061L4.927 1.292a.316.316 0 0 1 .314-.268h9.38c3.114 0 5.263.648 6.385 1.927.526.6.861 1.227 1.023 1.917.17.724.173 1.589.007 2.644l-.012.077v.676l.526.298a3.69 3.69 0 0 1 1.065.812c.45.513.741 1.165.864 1.938.127.795.085 1.741-.123 2.812-.24 1.232-.628 2.305-1.152 3.183a6.547 6.547 0 0 1-1.825 2c-.696.494-1.523.869-2.458 1.109-.906.236-1.939.355-3.072.355h-.73c-.522 0-1.029.188-1.427.525a2.21 2.21 0 0 0-.744 1.328l-.055.299-.924 5.855-.042.215c-.011.068-.03.102-.058.125a.155.155 0 0 1-.096.035H7.266z" fill="#253B80"/>
                                <path d="M23.048 7.667c-.028.179-.06.362-.096.55-1.237 6.351-5.469 8.545-10.874 8.545H9.326c-.661 0-1.218.48-1.321 1.132L6.596 26.83l-.399 2.533a.704.704 0 0 0 .695.814h4.881c.578 0 1.069-.42 1.16-.99l.048-.248.919-5.832.059-.32c.09-.572.582-.992 1.16-.992h.73c4.729 0 8.431-1.92 9.513-7.476.452-2.321.218-4.259-.978-5.622a4.667 4.667 0 0 0-1.336-1.03z" fill="#179BD7"/>
                                <path d="M21.754 7.151a9.757 9.757 0 0 0-1.203-.267 15.284 15.284 0 0 0-2.426-.177h-7.352a1.172 1.172 0 0 0-1.159.992L8.05 17.605l-.045.289a1.336 1.336 0 0 1 1.321-1.132h2.752c5.405 0 9.637-2.195 10.874-8.545.037-.188.068-.371.096-.55a6.594 6.594 0 0 0-1.017-.429 9.045 9.045 0 0 0-.277-.087z" fill="#222D65"/>
                                <path d="M9.614 7.699a1.169 1.169 0 0 1 1.159-.991h7.352c.871 0 1.684.057 2.426.177a9.757 9.757 0 0 1 1.481.353c.365.121.704.264 1.017.429.368-2.347-.003-3.945-1.272-5.392C20.378.682 17.853 0 14.622 0h-9.38c-.66 0-1.223.48-1.325 1.133L.01 25.898a.806.806 0 0 0 .795.932h5.791l1.454-9.225 1.564-9.906z" fill="#253B80"/>
                              </svg>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">Paiement sécurisé via PayPal</p>
                          </Label>
                        </div>
                      </div>
                      {paymentGateways.map((gateway) => (
                        <div
                          key={gateway.id}
                          className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                            selectedPaymentMethod === gateway.id
                              ? 'border-[#b8933d] bg-[#b8933d]/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedPaymentMethod(gateway.id)}
                        >
                          <RadioGroupItem value={gateway.id} id={gateway.id} className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor={gateway.id} className="cursor-pointer">
                              <div>
                                <p className="font-semibold text-gray-900">{gateway.title}</p>
                                {gateway.description && (
                                  <p className="text-sm text-gray-600">{stripHtmlTags(gateway.description)}</p>
                                )}
                              </div>
                            </Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {selectedPaymentMethod === 'bacs' && (
                <Card className="border-2 border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-900">
                      <Info className="h-5 w-5 text-blue-600" />
                      Coordonnées bancaires pour le virement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="bg-white rounded-lg p-4 space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Compte Courant</p>
                        <p className="text-base font-medium text-gray-900">31822952121 - SAS A U MORGANE DEWANIN</p>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-700">IBAN</p>
                          <p className="text-base font-mono text-gray-900">FR76 1350 7000 4331 8229 5212 127</p>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-700">BIC</p>
                          <p className="text-base font-mono text-gray-900">CCBPFRPPLIL</p>
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <p className="text-xs font-semibold text-gray-700">Code banque</p>
                          <p className="text-sm font-mono text-gray-900">13507</p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-gray-700">Code guichet</p>
                          <p className="text-sm font-mono text-gray-900">00043</p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-gray-700">N° du compte</p>
                          <p className="text-sm font-mono text-gray-900">31822952121</p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-gray-700">Clé RIB</p>
                          <p className="text-sm font-mono text-gray-900">27</p>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <p className="text-sm font-semibold text-gray-700">Banque</p>
                        <p className="text-base font-medium text-gray-900">BANQUE POPULAIRE DU NORD</p>
                        <p className="text-sm text-gray-600">Agence : AG CENTRALE</p>
                      </div>
                    </div>

                    <Alert className="bg-blue-100 border-blue-300">
                      <Info className="h-4 w-4 text-blue-700" />
                      <AlertDescription className="text-blue-900">
                        Veuillez effectuer le virement en indiquant votre numéro de commande en référence.
                        Votre commande sera expédiée dès réception du paiement.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-[#b8933d]" />
                    Récapitulatif de la commande
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cart.map((item) => {
                      const price = parseFloat(
                        item.price?.replace('€', '').replace(',', '.').replace(/\s/g, '') || '0'
                      );
                      const total = price * item.quantity;

                      return (
                        <div key={item.id} className="flex gap-4">
                          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                            {item.image?.sourceUrl ? (
                              <Image
                                src={item.image.sourceUrl}
                                alt={item.name}
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <ShoppingBag className="h-6 w-6 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-1 justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{item.name}</p>
                              {item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 && (
                                <div className="mt-1 space-y-0.5">
                                  {Object.entries(item.selectedAttributes).map(([key, value]) => {
                                    const formattedKey = key
                                      .replace(/^pa_/, '')
                                      .replace(/-/g, ' ')
                                      .replace(/_/g, ' ')
                                      .split(' ')
                                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                      .join(' ');

                                    return (
                                      <div key={key} className="text-xs text-gray-600">
                                        <span className="font-semibold">{formattedKey}:</span> {value}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              <p className="text-sm text-gray-500 mt-1">Quantité: {item.quantity}</p>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">
                              {total.toFixed(2)} €
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-xl font-bold text-gray-900">Total</h2>
                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sous-total TTC</span>
                      <span className="font-medium">{cartTotal.toFixed(2)} €</span>
                    </div>
                    {selectedCoupon && calculateDiscount() > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Réduction ({selectedCoupon.coupon_types.description})</span>
                        <span className="font-medium text-green-600">-{calculateDiscount().toFixed(2)} €</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Frais de port</span>
                      <span className="font-medium">
                        {useDeliveryBatch && activeBatch ? (
                          <span className="text-green-600 font-semibold">Offerts</span>
                        ) : calculateShippingCost() === 0 ? (
                          selectedCoupon?.coupon_types.type === 'free_delivery' ? (
                            <span className="text-green-600 font-semibold">Offerts (coupon)</span>
                          ) : (
                            '0.00 €'
                          )
                        ) : (
                          `${calculateShippingCost().toFixed(2)} €`
                        )}
                      </span>
                    </div>
                    {calculateInsuranceCost() > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Assurance</span>
                        <span className="font-medium">{calculateInsuranceCost().toFixed(2)} €</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total HT</span>
                      <span className="font-medium">
                        {useDeliveryBatch ? (() => {
                          const subtotalAfterDiscount = cartTotal - calculateCartDiscount();
                          const totalTTC = activeBatch
                            ? (subtotalAfterDiscount + calculateInsuranceCost())
                            : (subtotalAfterDiscount + calculateShippingCost() + calculateInsuranceCost());
                          return (totalTTC / 1.20).toFixed(2);
                        })() : (calculateTotal() / 1.20).toFixed(2)} €
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">TVA (20%)</span>
                      <span className="font-medium">
                        {useDeliveryBatch ? (() => {
                          const subtotalAfterDiscount = cartTotal - calculateCartDiscount();
                          const totalTTC = activeBatch
                            ? (subtotalAfterDiscount + calculateInsuranceCost())
                            : (subtotalAfterDiscount + calculateShippingCost() + calculateInsuranceCost());
                          return (totalTTC - (totalTTC / 1.20)).toFixed(2);
                        })() : calculateTax().toFixed(2)} €
                      </span>
                    </div>
                  </div>

                  <CouponSelector
                    selectedCouponId={selectedCoupon?.id || null}
                    onSelectCoupon={setSelectedCoupon}
                    subtotal={cartTotal}
                  />

                  <Separator />

                  {useDeliveryBatch ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total TTC</span>
                        <span className="text-[#b8933d]">
                          {(() => {
                            const subtotalAfterDiscount = cartTotal - calculateCartDiscount();
                            const totalTTC = activeBatch
                              ? (subtotalAfterDiscount + calculateInsuranceCost())
                              : (subtotalAfterDiscount + calculateShippingCost() + calculateInsuranceCost());
                            return totalTTC.toFixed(2);
                          })()
                          } €
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {activeBatch
                          ? 'Pas de frais de livraison supplémentaires'
                          : 'Frais de livraison inclus - Valable 5 jours'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total TTC</span>
                      <span className="text-[#b8933d]">{calculateTotalBeforeWallet().toFixed(2)} €</span>
                    </div>
                  )}

                  <WalletSelector
                    cartTotal={calculateTotalBeforeWallet()}
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
                        <span className="text-[#b8933d]">{calculateTotal().toFixed(2)} €</span>
                      </div>
                    </div>
                  )}

                  {isFirstOrder && calculateTotal() < MINIMUM_ORDER_AMOUNT && (
                    <Alert className="bg-orange-50 border-orange-200">
                      <Info className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800">
                        Pour votre première commande, le montant minimum est de {MINIMUM_ORDER_AMOUNT.toFixed(2)} €.
                        Il vous manque {(MINIMUM_ORDER_AMOUNT - calculateTotal()).toFixed(2)} €.
                      </AlertDescription>
                    </Alert>
                  )}

                  <GDPRConsent
                    type="order"
                    checked={gdprConsent}
                    onCheckedChange={setGdprConsent}
                    error={gdprError}
                  />

                  <Button
                    onClick={proceedToPayment}
                    disabled={
                      processing ||
                      addresses.length === 0 ||
                      !selectedAddressId ||
                      (!useDeliveryBatch && !selectedShippingMethod) ||
                      (useDeliveryBatch && !activeBatch && !selectedShippingMethod) ||
                      !selectedPaymentMethod ||
                      (isFirstOrder && calculateTotal() < MINIMUM_ORDER_AMOUNT)
                    }
                    className="w-full bg-[#b8933d] hover:bg-[#a07c2f] text-white"
                    size="lg"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Traitement en cours...
                      </>
                    ) : useDeliveryBatch ? (
                      activeBatch ? (
                        <>
                          <Clock className="mr-2 h-4 w-4" />
                          Ajouter au colis ouvert
                        </>
                      ) : (
                        <>
                          <Clock className="mr-2 h-4 w-4" />
                          Créer un colis ouvert
                        </>
                      )
                    ) : (
                      'Valider la commande'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
      </div>

      <Dialog open={showStripeModal} onOpenChange={setShowStripeModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <CreditCard className="h-6 w-6 text-[#b8933d]" />
              Paiement sécurisé par carte bancaire
            </DialogTitle>
            <DialogDescription>
              Complétez votre paiement pour valider votre commande #{pendingOrderNumber}
            </DialogDescription>
          </DialogHeader>

          {stripeClientSecret && (
            <StripeCheckoutForm
              clientSecret={stripeClientSecret}
              amount={calculateTotal()}
              onSuccess={handleStripeSuccess}
              onError={handleStripeError}
              returnUrl={`${window.location.origin}/order-confirmation/${pendingOrderNumber}`}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
