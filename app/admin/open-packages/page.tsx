'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Package, Clock, User, Truck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface OpenPackageAdmin {
  id: string;
  user_id: string;
  status: string;
  shipping_cost_paid: number;
  opened_at: string;
  closes_at: string;
  shipped_at: string | null;
  profiles: {
    email: string;
    first_name: string;
    last_name: string;
  };
}

export default function AdminOpenPackagesPage() {
  const [packages, setPackages] = useState<OpenPackageAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'closed' | 'shipped'>('active');

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
      shipped: { color: 'bg-blue-100 text-blue-800', label: 'Expédié' }
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
                    <p className="font-semibold">{pkg.shipping_cost_paid.toFixed(2)}€</p>
                  </div>
                  <div className="flex items-end">
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
