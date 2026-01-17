'use client';

import { PayPalButtons as PayPalButtonsSDK, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { useState } from 'react';

interface PayPalButtonsProps {
  amount: number;
  currency?: string;
  onSuccess?: (orderId: string) => void;
  onError?: (error: any) => void;
  disabled?: boolean;
}

export function PayPalButtons({
  amount,
  currency = 'EUR',
  onSuccess,
  onError,
  disabled = false,
}: PayPalButtonsProps) {
  const [error, setError] = useState<string | null>(null);

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  if (!clientId) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
        Configuration PayPal manquante
      </div>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId,
        currency,
        intent: 'capture',
      }}
    >
      <div className="paypal-buttons-container">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}

        <PayPalButtonsSDK
          disabled={disabled}
          style={{
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal',
          }}
          createOrder={async () => {
            try {
              const response = await fetch('/api/paypal/create-order', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  amount: amount.toFixed(2),
                  currency,
                }),
              });

              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.error || 'Failed to create order');
              }

              return data.id;
            } catch (err: any) {
              setError(err.message || 'Erreur lors de la création de la commande');
              if (onError) onError(err);
              throw err;
            }
          }}
          onApprove={async (data) => {
            try {
              const response = await fetch('/api/paypal/capture-order', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  orderID: data.orderID,
                }),
              });

              const captureData = await response.json();

              if (!response.ok) {
                throw new Error(captureData.error || 'Failed to capture payment');
              }

              if (onSuccess) {
                onSuccess(data.orderID);
              }
            } catch (err: any) {
              setError(err.message || 'Erreur lors de la capture du paiement');
              if (onError) onError(err);
            }
          }}
          onError={(err) => {
            setError('Une erreur est survenue avec PayPal');
            if (onError) onError(err);
          }}
        />
      </div>
    </PayPalScriptProvider>
  );
}
