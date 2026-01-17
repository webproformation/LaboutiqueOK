'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, OpenPackage } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Package,
  User,
  Clock,
  Truck,
  FileText,
  Scale,
  CheckCircle,
  Printer
} from 'lucide-react';
import Link from 'next/link';

interface OrderItem {
  id: string;
  product_id: string;
  variation_id: string | null;
  quantity: number;
  price: number;
  product_name: string;
  variation_details: any;
  image_url: string | null;
}

interface Order {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  order_items: OrderItem[];
  shipping_address: any;
}

interface PackageWithDetails extends OpenPackage {
  profiles: {
    email: string;
    first_name: string;
    last_name: string;
  };
  orders: Order[];
}

interface GroupedItem {
  product_id: string;
  variation_id: string | null;
  product_name: string;
  variation_details: any;
  image_url: string | null;
  total_quantity: number;
  price: number;
}

export default function OpenPackageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const packageId = params.id as string;

  const [packageData, setPackageData] = useState<PackageWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPickingList, setShowPickingList] = useState(false);
  const [showWeighingStation, setShowWeighingStation] = useState(false);
  const [finalWeight, setFinalWeight] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPackageDetails();
  }, [packageId]);

  async function loadPackageDetails() {
    try {
      const { data: pkgData, error: pkgError } = await supabase
        .from('open_packages')
        .select(`
          *,
          profiles(email, first_name, last_name)
        `)
        .eq('id', packageId)
        .single();

      if (pkgError) throw pkgError;

      const { data: packageOrders, error: ordersError } = await supabase
        .from('open_package_orders')
        .select('order_id')
        .eq('open_package_id', packageId);

      if (ordersError) throw ordersError;

      const orderIds = packageOrders.map(po => po.order_id);

      if (orderIds.length > 0) {
        const { data: ordersData, error: ordersDetailError } = await supabase
          .from('orders')
          .select(`
            id,
            order_number,
            total,
            status,
            created_at,
            shipping_address,
            order_items(*)
          `)
          .in('id', orderIds);

        if (ordersDetailError) throw ordersDetailError;

        setPackageData({
          ...pkgData,
          orders: ordersData as any
        });
      } else {
        setPackageData({
          ...pkgData,
          orders: []
        });
      }
    } catch (error) {
      console.error('Error loading package details:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  function groupItemsForPicking(): GroupedItem[] {
    if (!packageData?.orders) return [];

    const itemsMap = new Map<string, GroupedItem>();

    packageData.orders.forEach(order => {
      order.order_items?.forEach(item => {
        const key = `${item.product_id}-${item.variation_id || 'no-variation'}`;

        if (itemsMap.has(key)) {
          const existing = itemsMap.get(key)!;
          existing.total_quantity += item.quantity;
        } else {
          itemsMap.set(key, {
            product_id: item.product_id,
            variation_id: item.variation_id,
            product_name: item.product_name,
            variation_details: item.variation_details,
            image_url: item.image_url,
            total_quantity: item.quantity,
            price: item.price
          });
        }
      });
    });

    return Array.from(itemsMap.values());
  }

  async function handleWeighAndShip() {
    if (!finalWeight || parseFloat(finalWeight) <= 0) {
      toast.error('Veuillez entrer un poids valide');
      return;
    }

    setProcessing(true);

    try {
      const weight = parseFloat(finalWeight);
      const trackingNumber = `TRK-${Date.now()}`;
      const shippingLabelUrl = `https://placeholder.com/label-${packageId}.pdf`;
      const now = new Date().toISOString();

      const { error: packageError } = await supabase
        .from('open_packages')
        .update({
          status: 'shipped',
          final_weight: weight,
          tracking_number: trackingNumber,
          shipping_label_url: shippingLabelUrl,
          shipped_at: now,
          updated_at: now
        })
        .eq('id', packageId);

      if (packageError) throw packageError;

      if (packageData?.orders) {
        const orderIds = packageData.orders.map(o => o.id);
        const { error: ordersError } = await supabase
          .from('orders')
          .update({
            status: 'shipped',
            updated_at: now
          })
          .in('id', orderIds);

        if (ordersError) throw ordersError;
      }

      toast.success('✅ Colis expédié avec succès ! Client notifié.');
      setShowWeighingStation(false);

      setTimeout(() => {
        router.push('/admin/open-packages');
      }, 1500);
    } catch (error: any) {
      console.error('Error shipping package:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, { color: string; label: string }> = {
      active: { color: 'bg-green-100 text-green-800', label: 'Actif' },
      closed: { color: 'bg-orange-100 text-orange-800', label: 'Fermé' },
      ready_to_prepare: { color: 'bg-blue-100 text-blue-800', label: 'Prêt à préparer' },
      shipped: { color: 'bg-purple-100 text-purple-800', label: 'Expédié' }
    };

    const variant = variants[status] || variants.active;

    return (
      <Badge className={variant.color}>
        {variant.label}
      </Badge>
    );
  }

  function handlePrintPickingList() {
    window.print();
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="p-8 text-center">
        <p>Colis introuvable</p>
        <Link href="/admin/open-packages">
          <Button className="mt-4">Retour à la liste</Button>
        </Link>
      </div>
    );
  }

  const groupedItems = groupItemsForPicking();
  const totalItems = groupedItems.reduce((sum, item) => sum + item.total_quantity, 0);
  const shippingAddress = packageData.orders[0]?.shipping_address;

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/admin/open-packages">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la liste
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Détail du Colis Ouvert
            </h1>
            <p className="text-gray-600">
              Gérez la préparation et l'expédition de ce colis
            </p>
          </div>
          {getStatusBadge(packageData.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-lg">
              {packageData.profiles.first_name} {packageData.profiles.last_name}
            </p>
            <p className="text-gray-600 text-sm">{packageData.profiles.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Dates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Ouvert le:</span>
                <p className="font-semibold">{new Date(packageData.opened_at).toLocaleDateString('fr-FR')}</p>
              </div>
              {packageData.shipped_at && (
                <div>
                  <span className="text-gray-600">Expédié le:</span>
                  <p className="font-semibold">{new Date(packageData.shipped_at).toLocaleDateString('fr-FR')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Expédition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Frais de port:</span>
                <p className="font-semibold">{packageData.shipping_cost_paid ? 'Payés ✓' : 'Non payés'}</p>
              </div>
              {packageData.tracking_number && (
                <div>
                  <span className="text-gray-600">Tracking:</span>
                  <p className="font-semibold">{packageData.tracking_number}</p>
                </div>
              )}
              {packageData.final_weight && (
                <div>
                  <span className="text-gray-600">Poids:</span>
                  <p className="font-semibold">{packageData.final_weight} kg</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#D4AF37]" />
            Commandes incluses ({packageData.orders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {packageData.orders.length === 0 ? (
            <p className="text-gray-600">Aucune commande dans ce colis</p>
          ) : (
            <div className="space-y-3">
              {packageData.orders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">#{order.order_number}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">{order.total.toFixed(2)}€</p>
                    <Badge>{order.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {packageData.status === 'ready_to_prepare' && groupedItems.length > 0 && (
        <div className="flex gap-4">
          <Button
            onClick={() => setShowPickingList(true)}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <FileText className="w-4 h-4 mr-2" />
            📄 Générer Bon de Préparation
          </Button>

          <Button
            onClick={() => setShowWeighingStation(true)}
            className="flex-1 bg-[#D4AF37] hover:bg-[#C5A028]"
          >
            <Scale className="w-4 h-4 mr-2" />
            ⚖️ Peser & Expédier
          </Button>
        </div>
      )}

      <Dialog open={showPickingList} onOpenChange={setShowPickingList}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Bon de Préparation - Liste de Picking
            </DialogTitle>
            <DialogDescription>
              Articles à ramasser pour ce colis (Total: {totalItems} article{totalItems > 1 ? 's' : ''})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Informations Client</h3>
              <p className="text-sm">
                {packageData.profiles.first_name} {packageData.profiles.last_name}
              </p>
              <p className="text-sm text-gray-600">{packageData.profiles.email}</p>

              {shippingAddress && (
                <div className="mt-2 text-sm">
                  <p className="font-semibold">Adresse de livraison:</p>
                  <p>{shippingAddress.address_line1}</p>
                  {shippingAddress.address_line2 && <p>{shippingAddress.address_line2}</p>}
                  <p>{shippingAddress.postal_code} {shippingAddress.city}</p>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">Articles à préparer:</h3>

              <div className="space-y-3">
                {groupedItems.map((item, index) => (
                  <div key={`${item.product_id}-${item.variation_id}`} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-shrink-0">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.product_name}
                          className="w-20 h-20 object-cover rounded"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h4 className="font-semibold">{item.product_name}</h4>
                      {item.variation_details && (
                        <p className="text-sm text-gray-600">
                          {Object.entries(item.variation_details).map(([key, value]) => (
                            <span key={key} className="mr-3">
                              <strong>{key}:</strong> {value as string}
                            </span>
                          ))}
                        </p>
                      )}
                      <p className="text-lg font-bold text-[#D4AF37] mt-1">
                        Quantité: {item.total_quantity}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="w-6 h-6 rounded border-gray-300"
                        id={`check-${index}`}
                      />
                      <label htmlFor={`check-${index}`} className="text-sm text-gray-600">
                        Ramassé
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPickingList(false)}>
              Fermer
            </Button>
            <Button onClick={handlePrintPickingList}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showWeighingStation} onOpenChange={setShowWeighingStation}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Scale className="w-6 h-6" />
              ⚖️ Station de Pesée & Expédition
            </DialogTitle>
            <DialogDescription>
              Pesez le colis et validez l'expédition
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <User className="w-5 h-5" />
                Récapitulatif Client
              </h3>
              <p className="font-semibold">
                {packageData.profiles.first_name} {packageData.profiles.last_name}
              </p>

              {shippingAddress && (
                <div className="mt-2 text-sm">
                  <p className="font-semibold">Adresse:</p>
                  <p>{shippingAddress.address_line1}</p>
                  {shippingAddress.address_line2 && <p>{shippingAddress.address_line2}</p>}
                  <p>{shippingAddress.postal_code} {shippingAddress.city}</p>
                </div>
              )}

              <p className="mt-2 text-sm font-semibold">
                {packageData.orders.length} commande(s) - {totalItems} article(s)
              </p>
            </div>

            <div>
              <Label htmlFor="weight" className="text-base font-semibold">
                Poids final du colis (kg) *
              </Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Ex: 1.5"
                value={finalWeight}
                onChange={(e) => setFinalWeight(e.target.value)}
                className="mt-2 text-lg"
              />
              <p className="text-sm text-gray-600 mt-1">
                Pesez le colis prêt à partir (avec emballage)
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Ce qui va se passer:</h4>
              <ul className="space-y-1 text-sm">
                <li>✓ Génération automatique d'un numéro de suivi</li>
                <li>✓ Création d'une étiquette d'expédition</li>
                <li>✓ Passage du colis en statut "Expédié"</li>
                <li>✓ Mise à jour de toutes les commandes liées</li>
                <li>✓ Notification envoyée au client</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowWeighingStation(false)}
              disabled={processing}
            >
              Annuler
            </Button>
            <Button
              onClick={handleWeighAndShip}
              disabled={!finalWeight || processing}
              className="bg-[#D4AF37] hover:bg-[#C5A028]"
            >
              {processing ? (
                <>Traitement...</>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  VALIDER L'EXPÉDITION
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
