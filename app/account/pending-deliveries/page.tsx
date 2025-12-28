'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Calendar, Package, Clock, CheckCircle, Truck } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import Image from 'next/image';

interface DeliveryBatch {
  id: string;
  status: string;
  created_at: string;
  validate_at: string;
  validated_at: string | null;
  shipping_cost: number;
  woocommerce_order_id: string | null;
  notes: string | null;
}

interface BatchItem {
  id: string;
  product_name: string;
  product_slug: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  image_url: string | null;
}

export default function PendingDeliveriesPage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<DeliveryBatch[]>([]);
  const [batchItems, setBatchItems] = useState<Record<string, BatchItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [validatingBatch, setValidatingBatch] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadBatches();
    }
  }, [user]);

  const loadBatches = async () => {
    try {
      setLoading(true);

      const { data: batchesData, error: batchesError } = await supabase
        .from('delivery_batches')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (batchesError) throw batchesError;

      setBatches(batchesData || []);

      if (batchesData && batchesData.length > 0) {
        const items: Record<string, BatchItem[]> = {};

        for (const batch of batchesData) {
          const { data: itemsData, error: itemsError } = await supabase
            .from('delivery_batch_items')
            .select('*')
            .eq('batch_id', batch.id)
            .order('created_at', { ascending: true });

          if (!itemsError && itemsData) {
            items[batch.id] = itemsData;
          }
        }

        setBatchItems(items);
      }
    } catch (error) {
      console.error('Error loading batches:', error);
      toast.error('Erreur lors du chargement des colis');
    } finally {
      setLoading(false);
    }
  };

  const validateBatch = async (batchId: string) => {
    try {
      setValidatingBatch(batchId);

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Not authenticated');
      }

      const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/validate-delivery-batch`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ batchId }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la validation');
      }

      toast.success('Colis validé ! Votre commande a été créée.');
      await loadBatches();
    } catch (error) {
      console.error('Error validating batch:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la validation');
    } finally {
      setValidatingBatch(null);
    }
  };

  const getStatusBadge = (batch: DeliveryBatch) => {
    if (batch.status === 'validated') {
      return <Badge className="bg-green-600">Validée</Badge>;
    }
    if (batch.status === 'cancelled') {
      return <Badge variant="destructive">Annulée</Badge>;
    }
    if (isPast(new Date(batch.validate_at))) {
      return <Badge className="bg-orange-600">Validation automatique en attente</Badge>;
    }
    return <Badge className="bg-blue-600">En attente</Badge>;
  };

  const getBatchTotal = (batchId: string, shippingCost: number) => {
    const items = batchItems[batchId] || [];
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    return subtotal + shippingCost;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon colis ouvert</h1>
          <p className="text-gray-600">Gérez vos colis ouverts</p>
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-96" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const pendingBatches = batches.filter(b => b.status === 'pending');
  const validatedBatches = batches.filter(b => b.status === 'validated');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon colis ouvert</h1>
        <p className="text-gray-600">
          Groupez vos commandes sur 5 jours pour ne payer les frais de livraison qu&apos;une seule fois
        </p>
      </div>

      <Alert className="border-blue-500 bg-blue-50">
        <Clock className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900">Comment ça marche ?</AlertTitle>
        <AlertDescription className="text-blue-800">
          Lorsque vous créez un colis ouvert, vous avez 5 jours pour ajouter d&apos;autres produits sans payer de frais de livraison supplémentaires.
          Vous pouvez expédier le colis à tout moment, ou il sera automatiquement expédié au bout de 5 jours.
        </AlertDescription>
      </Alert>

      {pendingBatches.length === 0 && validatedBatches.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Aucun colis ouvert</AlertTitle>
          <AlertDescription>
            Vous n&apos;avez aucun colis ouvert. Créez-en un lors de votre prochain achat !
          </AlertDescription>
        </Alert>
      )}

      {pendingBatches.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Colis ouverts ({pendingBatches.length})
          </h2>
          {pendingBatches.map((batch) => {
            const items = batchItems[batch.id] || [];
            const total = getBatchTotal(batch.id, batch.shipping_cost);
            const timeLeft = formatDistanceToNow(new Date(batch.validate_at), { locale: fr, addSuffix: true });
            const isExpired = isPast(new Date(batch.validate_at));

            return (
              <Card key={batch.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        Mon colis ouvert
                        {getStatusBadge(batch)}
                      </CardTitle>
                      <CardDescription>
                        Créée le {format(new Date(batch.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#b8933d]">
                        {formatPrice(total.toString())}
                      </p>
                      <p className="text-xs text-gray-500">
                        dont {formatPrice(batch.shipping_cost.toString())} de livraison
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className={isExpired ? 'text-orange-600 font-semibold' : 'text-gray-700'}>
                        {isExpired ? 'Validation automatique en cours' : `Validation automatique ${timeLeft}`}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900">
                        Articles ({items.length})
                      </h3>
                      {items.map((item) => (
                        <div key={item.id} className="flex gap-4 pb-3 border-b last:border-b-0">
                          <div className="relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded">
                            {item.image_url ? (
                              <Image
                                src={item.image_url}
                                alt={item.product_name}
                                fill
                                sizes="80px"
                                className="object-cover rounded"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-8 w-8 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">
                              {item.product_name}
                            </h4>
                            <p className="text-sm text-gray-500">
                              Quantité: {item.quantity}
                            </p>
                            <p className="text-sm font-semibold text-[#b8933d]">
                              {formatPrice(item.total_price.toString())}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50 flex-col gap-3 items-stretch">
                  <Button
                    onClick={() => validateBatch(batch.id)}
                    disabled={validatingBatch === batch.id}
                    className="w-full bg-[#b8933d] hover:bg-[#a07c2f] text-white"
                  >
                    <Truck className="mr-2 h-4 w-4" />
                    {validatingBatch === batch.id ? 'Expédition en cours...' : 'Expédier le colis maintenant'}
                  </Button>
                  <p className="text-xs text-center text-gray-500">
                    Vous pouvez encore ajouter des produits à ce colis pendant {isExpired ? '0 jour' : timeLeft}
                  </p>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {validatedBatches.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Colis validés ({validatedBatches.length})
          </h2>
          {validatedBatches.map((batch) => {
            const items = batchItems[batch.id] || [];
            const total = getBatchTotal(batch.id, batch.shipping_cost);

            return (
              <Card key={batch.id} className="opacity-75">
                <CardHeader className="bg-green-50">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        Mon colis ouvert
                        {getStatusBadge(batch)}
                      </CardTitle>
                      <CardDescription>
                        Validée le {batch.validated_at ? format(new Date(batch.validated_at), 'dd MMMM yyyy à HH:mm', { locale: fr }) : '-'}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-700">
                        {formatPrice(total.toString())}
                      </p>
                      {batch.woocommerce_order_id && (
                        <p className="text-xs text-gray-600">
                          Commande #{batch.woocommerce_order_id}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">
                      Articles ({items.length})
                    </h3>
                    {items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center gap-3 text-sm">
                        <span className="font-medium">{item.quantity}x</span>
                        <span className="text-gray-700">{item.product_name}</span>
                      </div>
                    ))}
                    {items.length > 3 && (
                      <p className="text-sm text-gray-500">
                        et {items.length - 3} autre{items.length - 3 > 1 ? 's' : ''} article{items.length - 3 > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
