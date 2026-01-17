'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useOpenPackage } from '@/hooks/use-open-package';
import { supabase } from '@/lib/supabase';
import { Package, Clock, ShoppingBag, Truck, CheckCircle, XCircle, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface PackageOrder {
  id: string;
  order_id: string;
  added_at: string;
  paid_at: string | null;
  is_paid: boolean;
  order: {
    order_number: string;
    total: number;
    items: any[];
  };
}

function CreateOpenPackageForm() {
  const { user } = useAuth();
  const { createOpenPackage } = useOpenPackage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [shippingMethods, setShippingMethods] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');

  useEffect(() => {
    loadAddresses();
    loadShippingMethods();
  }, []);

  async function loadAddresses() {
    if (!user) return;
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .eq('address_type', 'shipping');
    setAddresses(data || []);
  }

  async function loadShippingMethods() {
    const { data } = await supabase
      .from('shipping_methods')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });
    setShippingMethods(data || []);
    if (data && data.length > 0) {
      setSelectedMethod(data[0].id);
    }
  }

  async function handleCreate() {
    if (!selectedAddress || !selectedMethod) {
      toast.error('Veuillez sélectionner une adresse et une méthode de livraison');
      return;
    }

    setLoading(true);
    try {
      await createOpenPackage(true, selectedMethod, selectedAddress);
      toast.success('Colis créé avec succès!');
      router.refresh();
    } catch (error: any) {
      console.error('Error creating package:', error);
      toast.error('Erreur lors de la création du colis: ' + (error.message || 'Erreur inconnue'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-[#D4AF37]" />
          <CardTitle>Créer un nouveau colis ouvert</CardTitle>
          <CardDescription>
            Regroupez plusieurs achats en une seule livraison pour économiser sur les frais de port
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Comment ça fonctionne ?</strong><br />
              Votre colis reste ouvert pendant 5 jours. Ajoutez autant de commandes que vous le souhaitez,
              vous ne payez les frais de port qu'une seule fois !
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Adresse de livraison</Label>
              <Select value={selectedAddress} onValueChange={setSelectedAddress}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une adresse" />
                </SelectTrigger>
                <SelectContent>
                  {addresses.map(addr => (
                    <SelectItem key={addr.id} value={addr.id}>
                      {addr.first_name} {addr.last_name} - {addr.address_line1}, {addr.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {addresses.length === 0 && (
                <p className="text-sm text-gray-500">
                  Vous devez d'abord ajouter une adresse de livraison
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Méthode de livraison</Label>
              <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une méthode" />
                </SelectTrigger>
                <SelectContent>
                  {shippingMethods.map(method => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name} - {Number(method.price || 0).toFixed(2)}€
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleCreate}
            disabled={loading || !selectedAddress || !selectedMethod || addresses.length === 0}
            className="w-full bg-[#D4AF37] hover:bg-[#C6A15B]"
          >
            {loading ? 'Création...' : 'Créer le colis'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OpenPackagePage() {
  const { user } = useAuth();
  const { openPackage, loading, timeRemaining, hasActivePackage, closePackage } = useOpenPackage();
  const [orders, setOrders] = useState<PackageOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (openPackage) {
      loadOrders();
    }
  }, [openPackage]);

  async function loadOrders() {
    if (!openPackage) return;

    try {
      const { data, error } = await supabase
        .from('open_package_orders')
        .select(`
          *,
          order:orders(
            order_number,
            total,
            items
          )
        `)
        .eq('open_package_id', openPackage.id)
        .order('added_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  }

  async function handleClosePackage() {
    if (!confirm('Êtes-vous sûr de vouloir fermer le colis ? Il sera expédié automatiquement.')) {
      return;
    }

    try {
      await closePackage();
      toast.success('Colis fermé avec succès');
    } catch (error) {
      toast.error('Erreur lors de la fermeture du colis');
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!hasActivePackage) {
    return (
      <CreateOpenPackageForm />
    );
  }

  const totalOrders = orders.length;
  const paidOrders = orders.filter(o => o.is_paid).length;
  const unpaidOrders = totalOrders - paidOrders;
  const totalAmount = orders.reduce((sum, o) => sum + Number(o.order.total), 0);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon Colis Ouvert</h1>
          <p className="text-gray-600">
            Votre colis reste ouvert pendant 5 jours. Ajoutez plusieurs commandes sans payer de frais de livraison supplémentaires !
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-[#D4AF37]" />
                Temps restant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#D4AF37]">
                {timeRemaining.days}j {timeRemaining.hours}h {timeRemaining.minutes}m
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Fermeture automatique le {new Date(openPackage!.closes_at).toLocaleDateString('fr-FR')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
                Commandes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalOrders}</div>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> {paidOrders} payées
                </span>
                <span className="text-orange-600 flex items-center gap-1">
                  <XCircle className="w-4 h-4" /> {unpaidOrders} à payer
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Truck className="w-5 h-5 text-[#D4AF37]" />
                Frais de port
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {openPackage!.shipping_cost_paid ? 'Frais payés ✓' : 'Non payés'}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {openPackage!.shipping_cost_paid ? 'Une seule fois pour tout le colis' : 'À payer lors de la fermeture'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Commandes dans le colis</CardTitle>
            <CardDescription>
              Total : {Number(totalAmount || 0).toFixed(2)}€ (hors frais de port déjà payés)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingOrders ? (
              <p className="text-center py-4">Chargement des commandes...</p>
            ) : orders.length === 0 ? (
              <p className="text-center py-4 text-gray-500">Aucune commande dans ce colis</p>
            ) : (
              <div className="space-y-4">
                {orders.map((packageOrder) => (
                  <div
                    key={packageOrder.id}
                    className="border rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">
                          Commande #{packageOrder.order.order_number}
                        </h3>
                        {packageOrder.is_paid ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Payée
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            <XCircle className="w-3 h-3 mr-1" />
                            À payer
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Ajoutée le {new Date(packageOrder.added_at).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {packageOrder.order.items?.length || 0} article(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">
                        {Number(packageOrder.order.total).toFixed(2)}€
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleClosePackage}
            variant="outline"
            className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white"
          >
            <Package className="w-4 h-4 mr-2" />
            Fermer et expédier maintenant
          </Button>
        </div>
      </div>
    </div>
  );
}
