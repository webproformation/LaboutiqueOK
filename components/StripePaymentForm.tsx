'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';

// Assurez-vous que votre clé publique est bien dans .env.local
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({ orderId, total, onSuccess, customerEmail }: { orderId: string | null, total: number, onSuccess: () => void, customerEmail?: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stripe) return;

    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );

    if (!clientSecret) return;

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case 'succeeded':
          setMessage('Paiement réussi !');
          break;
        case 'processing':
          setMessage('Votre paiement est en cours de traitement.');
          break;
        case 'requires_payment_method':
          setMessage('Le paiement a échoué, veuillez réessayer.');
          break;
        default:
          setMessage('Une erreur est survenue.');
          break;
      }
    });
  }, [stripe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsLoading(true);

    // C'EST ICI QUE LA MAGIE OPÈRE
    // On construit l'URL de retour en incluant l'ID de la commande
    const returnUrl = `${window.location.origin}/checkout/confirmation?order_id=${orderId}`;

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl, // Redirection forcée ici
        receipt_email: customerEmail,
      },
    });

    // Ce code ne s'exécute que si une erreur survient (car sinon Stripe redirige)
    if (error.type === 'card_error' || error.type === 'validation_error') {
      setMessage(error.message || 'Une erreur est survenue.');
      toast.error(error.message || 'Erreur de paiement');
    } else {
      setMessage('Une erreur inattendue est survenue.');
      toast.error('Erreur inattendue');
    }

    setIsLoading(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement id="payment-element" options={{ layout: 'tabs' }} />
      
      {message && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md">
          {message}
        </div>
      )}

      <Button
        disabled={isLoading || !stripe || !elements}
        id="submit"
        className="w-full bg-[#D4AF37] hover:bg-[#b8933d] text-white h-12 text-lg"
      >
        <span id="button-text">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Traitement...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Payer {total.toFixed(2)} €
            </div>
          )}
        </span>
      </Button>
    </form>
  );
}

interface StripePaymentFormProps {
  userId: string;
  total: number;
  orderId: string | null;
  onSuccess: () => void;
  customerEmail?: string;
  orderNumber?: string;
}

export function StripePaymentForm({ userId, total, orderId, onSuccess, customerEmail, orderNumber }: StripePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // On ne crée l'intention que si on a un ID de commande
    if (orderId) {
        fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            amount: total, 
            orderId: orderId, // Important pour le webhook
            userId: userId,
            customerEmail: customerEmail 
        }),
        })
        .then((res) => res.json())
        .then((data) => setClientSecret(data.clientSecret));
    }
  }, [total, userId, orderId, customerEmail]);

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#D4AF37',
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-[#D4AF37]/20">
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold text-gray-900">Paiement sécurisé par Carte Bancaire</h3>
        {orderNumber && <p className="text-sm text-gray-500 mt-1">Commande {orderNumber}</p>}
      </div>
      
      {clientSecret ? (
        <Elements options={options} stripe={stripePromise}>
          <CheckoutForm orderId={orderId} total={total} onSuccess={onSuccess} customerEmail={customerEmail} />
        </Elements>
      ) : (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]"></div>
        </div>
      )}
    </div>
  );
}