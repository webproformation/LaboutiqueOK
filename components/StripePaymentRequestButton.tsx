'use client';

import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'sonner';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface StripePaymentRequestButtonProps {
  amount: number;
  currency?: string;
  label: string;
  onSuccess?: (paymentMethod: any) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
}

export function StripePaymentRequestButton({
  amount,
  currency = 'eur',
  label,
  onSuccess,
  onError,
  disabled = false
}: StripePaymentRequestButtonProps) {
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);

  useEffect(() => {
    async function initializePaymentRequest() {
      const stripe = await stripePromise;
      if (!stripe) return;

      const pr = stripe.paymentRequest({
        country: 'FR',
        currency: currency.toLowerCase(),
        total: {
          label,
          amount: Math.round(amount * 100),
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      pr.canMakePayment().then((result) => {
        if (result) {
          setCanMakePayment(true);
          setPaymentRequest(pr);
        }
      });

      pr.on('paymentmethod', async (event) => {
        if (onSuccess) {
          try {
            await onSuccess(event.paymentMethod);
            event.complete('success');
          } catch (error) {
            event.complete('fail');
            if (onError) {
              onError(error as Error);
            }
          }
        } else {
          event.complete('success');
        }
      });
    }

    if (amount > 0 && !disabled) {
      initializePaymentRequest();
    }
  }, [amount, currency, label, disabled]);

  useEffect(() => {
    if (paymentRequest) {
      paymentRequest.update({
        total: {
          label,
          amount: Math.round(amount * 100),
        },
      });
    }
  }, [amount, label, paymentRequest]);

  if (!canMakePayment || disabled) {
    return null;
  }

  return (
    <div className="stripe-payment-request-button-container">
      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-gray-500">Ou payer avec</span>
          </div>
        </div>
      </div>

      <div
        id="payment-request-button"
        onClick={() => {
          if (paymentRequest) {
            paymentRequest.show();
          }
        }}
        className="cursor-pointer"
      >
        <div className="w-full py-3 px-4 bg-black text-white rounded-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.5 9.5c-.3 0-.5.2-.5.5v4c0 .3.2.5.5.5s.5-.2.5-.5v-4c0-.3-.2-.5-.5-.5zm-11 0c-.3 0-.5.2-.5.5v4c0 .3.2.5.5.5s.5-.2.5-.5v-4c0-.3-.2-.5-.5-.5zm5.5 6c-1.4 0-2.5-1.1-2.5-2.5S10.6 10.5 12 10.5s2.5 1.1 2.5 2.5S13.4 15.5 12 15.5z"/>
          </svg>
          <span className="font-medium">Apple Pay / Google Pay</span>
        </div>
      </div>

      <p className="text-xs text-gray-500 text-center mt-2">
        Paiement sécurisé disponible sur les appareils compatibles
      </p>
    </div>
  );
}
