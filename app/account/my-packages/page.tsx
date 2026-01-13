'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Clock, CheckCircle, Truck, ShoppingBag, Euro, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';

interface OpenPackage {
  id: string;
  user_id: string;
  status: string;
  shipping_cost_paid: number;
  opened_at: string;
  closes_at: string;
  shipped_at: string | null;
  created_at: string;
}

interface PackageOrder {
  id: string;
  open_package_id: string;
  order_id: string;
  is_paid: boolean;
  added_at: string;
  order: {
    order_number: string;
    total: number;
    created_at: string;
    order_items: Array<{
      product_name: string;
      quantity: number;
      price: number;
    }>;
  };
}

export default function MyPackagesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<OpenPackage[]>([]);
  const [packageOrders, setPackageOrders] = useState<Record<string, PackageOrder[]>>({});

  useEffect(() => {
    if (user) {
      loadPackages();
    }
  }, [user]);

  async function loadPackages() {
    if (!user) return;

    setLoading(true);
    try {
      const { data: packagesData, error: packagesError } = await supabase
        .from('open_packages')
        .select('*')
        .eq('user_id', user.id)
        .order('opened_at', { ascending: false });

      if (packagesError) throw packagesError;

      const packages = packagesData || [];
      setPackages(packages);

      const ordersMap: Record<string, PackageOrder[]> = {};
      for (const pkg of packages) {
        const { data: orders, error: ordersError } = await supabase
          .from('open_package_orders')
          .select(`
            *,
            order:orders(
              order_number,
              total,
              created_at,
              order_items(product_name, quantity, price)
            )
          `)
          .eq('open_package_id', pkg.id);

        if (!ordersError && orders) {
          ordersMap[pkg.id] = orders as unknown as PackageOrder[];
        }
      }

      setPackageOrders(ordersMap);
    } catch (error) {
      console.error('Error loading packages:', error);
      toast.error('Erreur lors du chargement des colis');
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, { color: string; label: string; icon: any }> = {
      active: { color: 'bg-green-100 text-green-800', label: 'Actif', icon: Package },
      closed: { color: 'bg-orange-100 text-orange-800', label: 'Fermé', icon: CheckCircle },
      shipped: { color: 'bg-blue-100 text-blue-800', label: 'Expédié', icon: Truck }
    };

    const variant = variants[status] || variants.active;
    const Icon = variant.icon;

    return (
      <Badge className={`${variant.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {variant.label}
      </Badge>
    );
  }

  function formatDate(dateString: string) {
    try {
      return format(new Date(dateString), 'd MMMM yyyy à HH:mm', { locale: fr });
    } catch {
      return dateString;
    }
  }

  function calculateTimeRemaining(closesAt: string) {
    const now = new Date().getTime();
    const closes = new Date(closesAt).getTime();
    const diff = closes - now;

    if (diff <= 0) return 'Expiré';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days}j ${hours}h restantes`;
    }
    return `${hours}h restantes`;
  }

  function calculateTotalItems(packageId: string) {
    const orders = packageOrders[packageId] || [];
    return orders.reduce((sum, order) => {
      const orderTotal = order.order?.order_items?.reduce((s, item) => s + item.quantity, 0) || 0;
      return sum + orderTotal;
    }, 0);
  }

  function calculateTotalValue(packageId: string) {
    const orders = packageOrders[packageId] || [];
    return orders.reduce((sum, order) => sum + (order.order?.total || 0), 0);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#C6A15B]/10 border border-[#D4AF37]/20 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#D4AF37] flex items-center justify-center">
              <Package className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mes Colis Ouverts</h1>
              <p className="text-gray-600 mt-1">
                Gérez vos colis en attente de regroupement
              </p>
            </div>
          </div>
          <Link href="/account/open-package">
            <Button className="bg-[#D4AF37] hover:bg-[#C6A15B]">
              <Package className="h-4 w-4 mr-2" />
              Ouvrir un nouveau colis
            </Button>
          </Link>
        </div>
      </div>

      {packages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center mb-4">
              Vous n'avez pas de colis ouvert pour le moment
            </p>
            <Link href="/account/open-package">
              <Button className="bg-[#D4AF37] hover:bg-[#C6A15B]">
                Ouvrir un colis
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900">Comment ça marche ?</p>
                <p className="text-sm text-blue-700 mt-1">
                  Les colis ouverts vous permettent de regrouper plusieurs achats en une seule expédition pour économiser sur les frais de port.
                  Ajoutez des articles à votre colis ouvert et nous les expédierons ensemble quand vous serez prêt.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            {packages.map((pkg) => {
              const orders = packageOrders[pkg.id] || [];
              const totalItems = calculateTotalItems(pkg.id);
              const totalValue = calculateTotalValue(pkg.id);

              return (
                <Card key={pkg.id} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-[#D4AF37]/5 to-transparent">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-3">
                          <Package className="h-6 w-6 text-[#D4AF37]" />
                          Colis ouvert
                        </CardTitle>
                        <CardDescription className="mt-2">
                          Ouvert le {formatDate(pkg.opened_at)}
                        </CardDescription>
                      </div>
                      {getStatusBadge(pkg.status)}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-gray-600">
                          <Clock className="h-5 w-5 text-[#D4AF37]" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Temps restant</p>
                            <p className="text-base font-semibold text-gray-900">
                              {pkg.status === 'active' ? calculateTimeRemaining(pkg.closes_at) : 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-gray-600">
                          <Calendar className="h-5 w-5 text-[#D4AF37]" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Fermeture prévue</p>
                            <p className="text-base font-semibold text-gray-900">
                              {formatDate(pkg.closes_at)}
                            </p>
                          </div>
                        </div>

                        {pkg.shipped_at && (
                          <div className="flex items-center gap-3 text-gray-600">
                            <Truck className="h-5 w-5 text-[#D4AF37]" />
                            <div>
                              <p className="text-sm font-medium text-gray-500">Expédié le</p>
                              <p className="text-base font-semibold text-gray-900">
                                {formatDate(pkg.shipped_at)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-gray-600">
                          <ShoppingBag className="h-5 w-5 text-[#D4AF37]" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Articles</p>
                            <p className="text-base font-semibold text-gray-900">
                              {totalItems} article{totalItems > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-gray-600">
                          <Euro className="h-5 w-5 text-[#D4AF37]" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Valeur totale</p>
                            <p className="text-base font-semibold text-gray-900">
                              {Number(totalValue || 0).toFixed(2)}€
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-gray-600">
                          <Truck className="h-5 w-5 text-[#D4AF37]" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Frais de port</p>
                            <p className="text-base font-semibold text-gray-900">
                              {Number(pkg.shipping_cost_paid || 0).toFixed(2)}€
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {orders.length > 0 && (
                      <div className="border-t pt-6">
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <ShoppingBag className="h-5 w-5 text-[#D4AF37]" />
                          Commandes dans ce colis ({orders.length})
                        </h4>
                        <div className="space-y-3">
                          {orders.map((orderItem) => (
                            <div key={orderItem.id} className="p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-medium text-gray-900">
                                  Commande #{orderItem.order?.order_number}
                                </p>
                                <Badge className={orderItem.is_paid ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                                  {orderItem.is_paid ? 'Payée' : 'En attente'}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                Ajoutée le {formatDate(orderItem.added_at)}
                              </p>
                              {orderItem.order?.order_items && orderItem.order.order_items.length > 0 && (
                                <div className="mt-3 space-y-1">
                                  {orderItem.order.order_items.map((item, idx) => (
                                    <p key={idx} className="text-sm text-gray-700">
                                      • {item.product_name} × {item.quantity}
                                    </p>
                                  ))}
                                </div>
                              )}
                              <p className="text-sm font-semibold text-gray-900 mt-2">
                                Total: {Number(orderItem.order?.total || 0).toFixed(2)}€
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
