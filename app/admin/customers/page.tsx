"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Mail, Phone, User, ShoppingCart, Users, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Customer {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  created_at: string;
  source?: 'supabase' | 'woocommerce' | 'wordpress';
  username?: string;
  roles?: string[];
}

export default function AdminCustomers() {
  const router = useRouter();
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const perPage = 10;

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const [supabaseResponse, woocommerceResponse] = await Promise.all([
        fetch('/api/supabase/users'),
        fetch('/api/woocommerce/customers?action=list&per_page=100')
      ]);

      const supabaseUsers = supabaseResponse.ok
        ? (await supabaseResponse.json()).users || []
        : [];

      const woocommerceCustomers = woocommerceResponse.ok
        ? (await woocommerceResponse.json()).customers || []
        : [];

      const emailMap = new Map<string, Customer>();

      woocommerceCustomers.forEach((c: any) => {
        const email = (c.email || '').toLowerCase();
        if (email) {
          emailMap.set(email, {
            id: `woo-${c.id}`,
            email: c.email || '',
            first_name: c.first_name || '',
            last_name: c.last_name || '',
            phone: c.billing?.phone || '',
            created_at: c.date_created || new Date().toISOString(),
            source: 'woocommerce'
          });
        }
      });

      supabaseUsers.forEach((u: Customer) => {
        const email = (u.email || '').toLowerCase();
        if (email && !emailMap.has(email)) {
          emailMap.set(email, {
            ...u,
            source: 'supabase'
          });
        }
      });

      const allCustomers = Array.from(emailMap.values());

      setAllCustomers(allCustomers);
    } catch (error: any) {
      const errorMsg = error.message || 'Erreur lors du chargement des clients';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return allCustomers;

    const searchLower = search.toLowerCase();
    return allCustomers.filter(c =>
      c.email.toLowerCase().includes(searchLower) ||
      (c.first_name?.toLowerCase() || '').includes(searchLower) ||
      (c.last_name?.toLowerCase() || '').includes(searchLower)
    );
  }, [allCustomers, search]);

  const paginatedCustomers = useMemo(() => {
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return filteredCustomers.slice(start, end);
  }, [filteredCustomers, page, perPage]);

  const totalPages = Math.ceil(filteredCustomers.length / perPage);

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Gestion des Clients</h1>
        <div className="text-sm text-gray-500">
          {filteredCustomers.length} clients au total
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Rechercher un client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-xl font-bold text-red-600 mb-4">
                Erreur de chargement
              </h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={fetchCustomers} className="mt-6">
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : paginatedCustomers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">
              {search ? 'Aucun client trouvé pour cette recherche' : 'Aucun client'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {paginatedCustomers.map((customer) => (
              <Card key={customer.id}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg">
                          {customer.first_name && customer.last_name
                            ? `${customer.first_name} ${customer.last_name}`
                            : 'Utilisateur'}
                        </h3>
                        {customer.source === 'woocommerce' ? (
                          <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 flex items-center gap-1">
                            <ShoppingCart className="w-3 h-3" />
                            WooCommerce
                          </span>
                        ) : customer.source === 'wordpress' ? (
                          <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            WordPress
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            Supabase
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>{customer.email}</span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4">
                      <div className="text-left sm:text-right">
                        <p className="text-sm text-gray-500">Inscrit le</p>
                        <p className="text-sm font-medium">
                          {new Date(customer.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/admin/customers/${customer.id}`)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Détails
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Précédent
              </Button>
              <span className="px-4 py-2">
                Page {page} sur {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Suivant
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
