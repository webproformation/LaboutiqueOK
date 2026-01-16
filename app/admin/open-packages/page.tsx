'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Package, Clock, User, Truck, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';

interface OpenPackageAdmin {
  id: string;
  user_id: string;
  status: string;
  shipping_cost_paid: boolean;
  opened_at: string;
  closes_at: string;
  shipped_at: string | null;
  profiles: {
    email: string;
    first_name: string;
    last_name: string;
  };
}

interface PackageOrderDetails {
  id: string;
  order: {
    order_number: string;
    total: number;
    status: string;
    created_at: string;
  };
}

export default function AdminOpenPackagesPage() {
  const [packages, setPackages] = useState<OpenPackageAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'closed' | 'shipped'>('active');
  const [packageOrders, setPackageOrders] = useState<Record<string, PackageOrderDetails[]>>({});

  useEffect(() => {
    loadPackages();
  }, [filter]);

  async function loadPackages() {
    try {
      let query = supabase
        .from('open_packages')
        .select(`
          *,
          profiles(email, first_name, last_name)
        `)
        .order('opened_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPackages(data || []);

      const ordersMap: Record<string, PackageOrderDetails[]> = {};
      for (const pkg of data || []) {
        const { data: orders, error: ordersError } = await supabase
          .from('open_package_orders')
          .select(`
            id,
            order:orders(order_number, total, status, created_at)
          `)
          .eq('open_package_id', pkg.id);

        if (!ordersError && orders) {
          ordersMap[pkg.id] = orders as unknown as PackageOrderDetails[];
        }
      }

      setPackageOrders(ordersMap);
    } catch (error) {
      console.error('Error loading packages:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  async function markAsShipped(packageId: string) {
    try {
      const { error } = await supabase
        .from('open_packages')
        .update({
          status: 'shipped',
          shipped_at: new Date().toISOString()
        })
        .eq('id', packageId);

      if (error) throw error;
      toast.success('Colis marqué comme expédié');
      loadPackages();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
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

  function calculateTimeRemaining(closesAt: string) {
    const now = new Date().getTime();
    const closes = new Date(closesAt).getTime();
    const diff = closes - now;

    if (diff <= 0) return 'Expiré';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return `${days}j ${hours}h`;
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Colis Ouverts</h1>
        <p className="text-gray-600">
          Gérez tous les colis ouverts des clients
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          Tous
        </Button>
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          onClick={() => setFilter('active')}
        >
          Actifs
        </Button>
        <Button
          variant={filter === 'closed' ? 'default' : 'outline'}
          onClick={() => setFilter('closed')}
        >
          Fermés
        </Button>
        <Button
          variant={filter === 'shipped' ? 'default' : 'outline'}
          onClick={() => setFilter('shipped')}
        >
          Expédiés
        </Button>
      </div>

      {packages.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Aucun colis trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {packages.map((pkg) => (
            <Card key={pkg.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      {pkg.profiles.first_name} {pkg.profiles.last_name}
                    </CardTitle>
                    <CardDescription>{pkg.profiles.email}</CardDescription>
                  </div>
                  {getStatusBadge(pkg.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Ouvert le</p>
                    <p className="font-semibold">
                      {new Date(pkg.opened_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Temps restant
                    </p>
                    <p className="font-semibold">
                      {pkg.status === 'active' ? calculateTimeRemaining(pkg.closes_at) : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                      <Truck className="w-4 h-4" />
                      Frais de port
                    </p>
                    <p className="font-semibold">{pkg.shipping_cost_paid ? 'Payés ✓' : 'Non payés'}</p>
                  </div>
                  <div className="flex items-end gap-2">
                    <Link href={`/admin/open-packages/${pkg.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Voir détails
                      </Button>
                    </Link>

                    {pkg.status === 'closed' && (
                      <Button
                        size="sm"
                        onClick={() => markAsShipped(pkg.id)}
                        className="bg-[#D4AF37] hover:bg-[#C5A028]"
                      >
                        Marquer comme expédié
                      </Button>
                    )}
                    {pkg.status === 'shipped' && pkg.shipped_at && (
                      <p className="text-sm text-gray-600">
                        Expédié le {new Date(pkg.shipped_at).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>

                {packageOrders[pkg.id] && packageOrders[pkg.id].length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5 text-[#D4AF37]" />
                      Commandes dans ce colis ({packageOrders[pkg.id].length})
                    </h4>
                    <div className="space-y-2">
                      {packageOrders[pkg.id].map((orderItem) => (
                        <div key={orderItem.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">#{orderItem.order.order_number}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(orderItem.order.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{orderItem.order.total.toFixed(2)}€</p>
                            <Badge className="text-xs">
                              {orderItem.order.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
