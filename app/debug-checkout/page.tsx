"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Trash2, RefreshCw } from 'lucide-react';

export default function DebugCheckoutPage() {
  const [checkoutOptions, setCheckoutOptions] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const clearCache = () => {
    try {
      localStorage.removeItem('checkout_options_cache_v2');
      localStorage.removeItem('checkout_options_cache_time_v2');
      toast.success('Cache vidé avec succès');
      setCheckoutOptions(null);
    } catch (error) {
      toast.error('Erreur lors du vidage du cache');
      console.error(error);
    }
  };

  const fetchCheckoutOptions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/woocommerce/checkout-options');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setCheckoutOptions(data);
      toast.success('Options récupérées avec succès');
    } catch (error: any) {
      toast.error('Erreur: ' + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const viewCache = () => {
    try {
      const cached = localStorage.getItem('checkout_options_cache_v2');
      const cachedTime = localStorage.getItem('checkout_options_cache_time_v2');

      if (cached) {
        const data = JSON.parse(cached);
        const time = cachedTime ? new Date(parseInt(cachedTime)).toLocaleString() : 'Unknown';
        setCheckoutOptions({ ...data, _cached: true, _cachedTime: time });
        toast.info('Cache chargé');
      } else {
        toast.info('Aucun cache trouvé');
        setCheckoutOptions(null);
      }
    } catch (error) {
      toast.error('Erreur lors de la lecture du cache');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Debug Checkout - Options de livraison</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={clearCache} variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Vider le cache
              </Button>
              <Button onClick={fetchCheckoutOptions} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Récupérer les options (API)
              </Button>
              <Button onClick={viewCache} variant="secondary">
                Voir le cache
              </Button>
            </div>

            {checkoutOptions && (
              <div className="mt-4 space-y-4">
                {checkoutOptions._cached && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900">
                      Données du cache (mis en cache le: {checkoutOptions._cachedTime})
                    </p>
                  </div>
                )}

                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-semibold mb-2 text-lg">
                    Méthodes de livraison ({checkoutOptions.shippingMethods?.length || 0})
                  </h3>
                  {checkoutOptions.shippingMethods?.length > 0 ? (
                    <ul className="space-y-2">
                      {checkoutOptions.shippingMethods.map((method: any) => (
                        <li key={method.id} className="border-b pb-2 last:border-0">
                          <div className="font-medium">{method.title}</div>
                          <div className="text-sm text-gray-600">
                            Code: {method.method_id} | Prix: {method.cost}€
                            {method.is_relay && ' | Point relais'}
                          </div>
                          {method.description && (
                            <div className="text-sm text-gray-500">{method.description}</div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-red-600 font-medium">
                      ❌ Aucune méthode de livraison trouvée !
                    </p>
                  )}
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-semibold mb-2 text-lg">
                    Méthodes de paiement ({checkoutOptions.paymentGateways?.length || 0})
                  </h3>
                  {checkoutOptions.paymentGateways?.length > 0 ? (
                    <ul className="space-y-2">
                      {checkoutOptions.paymentGateways.map((gateway: any) => (
                        <li key={gateway.id} className="border-b pb-2 last:border-0">
                          <div className="font-medium">{gateway.title}</div>
                          <div className="text-sm text-gray-600">{gateway.description}</div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-yellow-600">Aucune méthode de paiement</p>
                  )}
                </div>

                <div className="bg-gray-50 border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">JSON complet</h3>
                  <pre className="text-xs overflow-auto max-h-96 bg-gray-900 text-gray-100 p-4 rounded">
                    {JSON.stringify(checkoutOptions, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
