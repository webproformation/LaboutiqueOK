"use client";

import { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CheckoutFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  returnUrl: string;
}

function CheckoutForm({ onSuccess, onError, returnUrl }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isReady, setIsReady] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !isReady) {
      setErrorMessage('Le formulaire de paiement n\'est pas encore prêt. Veuillez patienter...');
      return;
    }

    setProcessing(true);
    setErrorMessage('');

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'Une erreur est survenue lors du paiement');
        onError(error.message || 'Erreur de paiement');
      } else {
        onSuccess();
      }
    } catch (err: any) {
      const message = err.message || 'Une erreur est survenue';
      setErrorMessage(message);
      onError(message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
        <div className="mb-4 flex items-center gap-2 text-gray-900 font-semibold">
          <CreditCard className="h-5 w-5 text-[#b8933d]" />
          <span>Informations de paiement</span>
        </div>
        <PaymentElement
          onReady={() => setIsReady(true)}
          onLoadError={(error) => {
            const errorMsg = error.error?.message || 'Erreur lors du chargement du formulaire de paiement';
            setErrorMessage(errorMsg);
            onError(errorMsg);
          }}
        />
        {!isReady && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-[#b8933d] mr-2" />
            <span className="text-sm text-gray-600">Chargement du formulaire...</span>
          </div>
        )}
      </div>

      <Alert className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Paiement sécurisé par Stripe. Vos informations bancaires sont chiffrées et ne sont jamais stockées sur nos serveurs.
        </AlertDescription>
      </Alert>

      <Button
        type="submit"
        disabled={!stripe || !isReady || processing}
        className="w-full bg-[#b8933d] hover:bg-[#a07c2f] text-white disabled:opacity-50 disabled:cursor-not-allowed"
        size="lg"
      >
        {processing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Paiement en cours...
          </>
        ) : !isReady ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Chargement...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Payer maintenant
          </>
        )}
      </Button>
    </form>
  );
}

interface StripeCheckoutFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
  returnUrl: string;
}

export default function StripeCheckoutForm({
  clientSecret,
  amount,
  onSuccess,
  onError,
  returnUrl,
}: StripeCheckoutFormProps) {
  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#b8933d',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        borderRadius: '8px',
      },
    },
    locale: 'fr',
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm onSuccess={onSuccess} onError={onError} returnUrl={returnUrl} />
    </Elements>
  );
}
