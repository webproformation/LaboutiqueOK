'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface StripePaymentFormProps {
  orderId: string;
  userId: string;
  total: number;
  onSuccess: () => void;
  customerEmail?: string;
  orderNumber?: string;
}

function CheckoutForm({ orderId, total, onSuccess, orderNumber }: Omit<StripePaymentFormProps, 'userId' | 'customerEmail'>) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(submitError.message || 'Erreur lors de la soumission du formulaire');
        setIsProcessing(false);
        return;
      }

      const origin = window.location.origin;
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${origin}/checkout/confirmation?order=${orderId}`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'Une erreur est survenue lors du paiement');
        setIsProcessing(false);
        toast.error(error.message || 'Erreur de paiement');
      } else {
        setPaymentSuccess(true);
        toast.success('Paiement validé avec succès !', {
          position: 'bottom-right'
        });

        setTimeout(() => {
          onSuccess();
          router.push(`/checkout/confirmation?order=${orderId}`);
        }, 1500);
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setErrorMessage('Une erreur inattendue est survenue');
      setIsProcessing(false);
      toast.error('Erreur lors du paiement');
    }
  };

  if (paymentSuccess) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-green-900 mb-2">Paiement validé !</h3>
              <p className="text-green-700">Redirection vers la confirmation...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-6 border-2 border-[#D4AF37]/30">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-2">
            <CreditCard className="h-5 w-5 text-[#D4AF37]" />
            Informations de paiement
          </h3>
          <p className="text-sm text-gray-600">Paiement sécurisé par Stripe</p>
        </div>

        <PaymentElement
          options={{
            layout: 'tabs',
            defaultValues: {
              billingDetails: {
                email: '',
              },
            },
          }}
        />
      </div>

      {errorMessage && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4" />
          <AlertDescription className="text-red-900">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-gradient-to-br from-[#F2F2E8] to-white rounded-lg p-4 border-2 border-[#D4AF37]/40">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-700 font-medium">Montant à payer</span>
          <span className="text-2xl font-bold text-[#D4AF37]">
            {total.toFixed(2)} €
          </span>
        </div>
        {orderNumber && (
          <p className="text-xs text-gray-500 text-center">
            Commande n° {orderNumber}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d] text-white text-lg py-6"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Traitement en cours...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5 mr-2" />
            Payer {total.toFixed(2)} €
          </>
        )}
      </Button>

      <div className="text-xs text-gray-500 text-center space-y-1">
        <p>🔒 Paiement 100% sécurisé</p>
        <p>Vos informations bancaires ne sont jamais stockées sur notre serveur</p>
      </div>
    </form>
  );
}

export function StripePaymentForm({
  orderId,
  userId,
  total,
  onSuccess,
  customerEmail,
  orderNumber,
}: StripePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createPaymentIntent();
  }, []);

  const createPaymentIntent = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          userId,
          total,
          metadata: {
            email: customerEmail || '',
            orderNumber: orderNumber || '',
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création du paiement');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (err: any) {
      console.error('Error creating PaymentIntent:', err);
      setError(err.message || 'Impossible de créer le paiement');
      toast.error('Erreur lors de l\'initialisation du paiement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4 py-8">
            <Loader2 className="h-12 w-12 animate-spin text-[#D4AF37] mx-auto" />
            <p className="text-gray-600">Initialisation du paiement sécurisé...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">Erreur d'initialisation</p>
              <p>{error}</p>
            </AlertDescription>
          </Alert>
          <Button
            onClick={createPaymentIntent}
            variant="outline"
            className="w-full mt-4"
          >
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!clientSecret) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-600">Aucun secret de paiement disponible</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#D4AF37',
            colorBackground: '#ffffff',
            colorText: '#1f2937',
            colorDanger: '#ef4444',
            fontFamily: 'system-ui, sans-serif',
            borderRadius: '8px',
          },
        },
      }}
    >
      <CheckoutForm
        orderId={orderId}
        total={total}
        onSuccess={onSuccess}
        orderNumber={orderNumber}
      />
    </Elements>
  );
}
