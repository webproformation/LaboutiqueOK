'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Truck, Package, MapPin, Printer, Search, Calendar, User, Phone } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  shipping_address: any;
  relay_point_data: any;
  shipping_method_id: string;
  user_id: string;
  total: number;
}

interface ShippingMethod {
  id: string;
  name: string;
  is_relay: boolean;
}

export default function ExpeditionsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ordersResult, shippingMethodsResult] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .not('shipping_method_id', 'is', null)
          .order('created_at', { ascending: false }),
        supabase
          .from('shipping_methods')
          .select('id, name, is_relay')
      ]);

      if (ordersResult.error) throw ordersResult.error;
      if (shippingMethodsResult.error) throw shippingMethodsResult.error;

      setOrders(ordersResult.data || []);
      setShippingMethods(shippingMethodsResult.data || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const getShippingMethod = (methodId: string) => {
    return shippingMethods.find(m => m.id === methodId);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handlePrintLabel = (order: Order) => {
    toast.info('Impression d\'étiquette', {
      description: `Fonctionnalité à venir pour la commande ${order.order_number}`
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des expéditions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Truck className="h-8 w-8 text-[#D4AF37]" />
          Expéditions
        </h1>
        <p className="text-gray-600 mt-2">
          Gérez les expéditions et imprimez les étiquettes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Rechercher par numéro de commande</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="CMD-123456"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="processing">En cours</option>
                <option value="shipped">Expédié</option>
                <option value="delivered">Livré</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600">Aucune expédition trouvée</p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const shippingMethod = getShippingMethod(order.shipping_method_id);
            const isRelay = shippingMethod?.is_relay || false;

            return (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Commande {order.order_number}
                      </CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(order.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={order.status === 'shipped' ? 'default' : 'secondary'}>
                        {order.status === 'pending' && 'En attente'}
                        {order.status === 'processing' && 'En cours'}
                        {order.status === 'shipped' && 'Expédié'}
                        {order.status === 'delivered' && 'Livré'}
                      </Badge>
                      {isRelay && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                          Point Relais
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                          <Truck className="h-4 w-4 text-[#D4AF37]" />
                          Mode de livraison
                        </h4>
                        <p className="text-sm">{shippingMethod?.name || 'Non défini'}</p>
                      </div>

                      {isRelay && order.relay_point_data ? (
                        <div>
                          <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-[#D4AF37]" />
                            Point relais sélectionné
                          </h4>
                          <p className="text-sm font-medium">{order.relay_point_data.name}</p>
                          <p className="text-sm text-gray-600">{order.relay_point_data.address}</p>
                        </div>
                      ) : order.shipping_address ? (
                        <div>
                          <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-[#D4AF37]" />
                            Adresse de livraison
                          </h4>
                          <div className="text-sm space-y-1">
                            <p className="font-medium">
                              {order.shipping_address.first_name} {order.shipping_address.last_name}
                            </p>
                            <p>{order.shipping_address.address_line1}</p>
                            {order.shipping_address.address_line2 && (
                              <p>{order.shipping_address.address_line2}</p>
                            )}
                            <p>
                              {order.shipping_address.postal_code} {order.shipping_address.city}
                            </p>
                            <p>{order.shipping_address.country}</p>
                            <p className="flex items-center gap-1 text-gray-600 mt-2">
                              <Phone className="h-3 w-3" />
                              {order.shipping_address.phone}
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-sm text-gray-700 mb-2">Montant total</h4>
                        <p className="text-2xl font-bold text-[#D4AF37]">
                          {typeof order.total === 'number' ? order.total.toFixed(2) : '0.00'} €
                        </p>
                      </div>

                      <div className="pt-4 border-t">
                        <Button
                          onClick={() => handlePrintLabel(order)}
                          className="w-full bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d]"
                        >
                          <Printer className="h-4 w-4 mr-2" />
                          Imprimer l'étiquette
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
