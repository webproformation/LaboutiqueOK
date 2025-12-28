"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Phone, User, Calendar, ShoppingCart, Ban, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CustomerProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  birth_date: string | null;
  created_at: string;
  wordpress_user_id: number | null;
  blocked: boolean;
  blocked_reason: string | null;
  blocked_at: string | null;
  cancelled_orders_count: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  woocommerce_order_id: number;
}

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showUnblockDialog, setShowUnblockDialog] = useState(false);

  useEffect(() => {
    fetchCustomerDetails();
  }, [customerId]);

  const fetchCustomerDetails = async () => {
    setLoading(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', customerId)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profileData) {
        toast.error('Client non trouvé');
        router.push('/admin/customers');
        return;
      }

      setProfile(profileData);

      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', customerId)
        .order('created_at', { ascending: false });

      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error fetching customer details:', error);
      toast.error('Erreur lors du chargement des détails du client');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockCustomer = async () => {
    if (!profile) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          blocked: true,
          blocked_reason: 'Bloqué manuellement par un administrateur',
          blocked_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success('Client bloqué avec succès');
      await fetchCustomerDetails();
      setShowBlockDialog(false);
    } catch (error) {
      console.error('Error blocking customer:', error);
      toast.error('Erreur lors du blocage du client');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockCustomer = async () => {
    if (!profile) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          blocked: false,
          blocked_reason: null,
          blocked_at: null,
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success('Client débloqué avec succès');
      await fetchCustomerDetails();
      setShowUnblockDialog(false);
    } catch (error) {
      console.error('Error unblocking customer:', error);
      toast.error('Erreur lors du déblocage du client');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-gray-500">Client non trouvé</p>
          <Button
            onClick={() => router.push('/admin/customers')}
            className="mt-6"
          >
            Retour à la liste
          </Button>
        </CardContent>
      </Card>
    );
  }

  const cancelledOrders = orders.filter(o => o.status === 'cancelled');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/admin/customers')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-3xl font-bold">Détails du client</h1>
      </div>

      {profile.blocked && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900">Client bloqué</h3>
                <p className="text-sm text-red-700">{profile.blocked_reason}</p>
                {profile.blocked_at && (
                  <p className="text-xs text-red-600 mt-1">
                    Bloqué le {new Date(profile.blocked_at).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>Détails du compte client</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Nom complet</p>
              <p className="font-medium">
                {profile.first_name} {profile.last_name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{profile.email}</p>
              </div>
            </div>
            {profile.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Téléphone</p>
                  <p className="font-medium">{profile.phone}</p>
                </div>
              </div>
            )}
            {profile.birth_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Date de naissance</p>
                  <p className="font-medium">
                    {new Date(profile.birth_date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Inscrit le</p>
              <p className="font-medium">
                {new Date(profile.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
            {profile.wordpress_user_id && (
              <div>
                <p className="text-sm text-gray-500">ID WordPress</p>
                <p className="font-medium">{profile.wordpress_user_id}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-full">
                <ShoppingCart className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <CardTitle>Statistiques commandes</CardTitle>
                <CardDescription>Historique et comportement</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total commandes</p>
                <p className="text-2xl font-bold text-blue-600">{orders.length}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Annulées</p>
                <p className="text-2xl font-bold text-red-600">
                  {profile.cancelled_orders_count}
                </p>
              </div>
            </div>

            {profile.cancelled_orders_count >= 3 && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <p className="text-sm font-semibold text-orange-900">
                    Attention : 3 commandes annulées ou plus
                  </p>
                </div>
                <p className="text-xs text-orange-700 mt-1">
                  Ce client a un historique d&apos;annulations élevé
                </p>
              </div>
            )}

            <div className="pt-4">
              {profile.blocked ? (
                <Button
                  onClick={() => setShowUnblockDialog(true)}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Débloquer le client
                </Button>
              ) : (
                <Button
                  onClick={() => setShowBlockDialog(true)}
                  variant="destructive"
                  className="w-full"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Ban className="w-4 h-4 mr-2" />
                  )}
                  Bloquer le client
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique des commandes</CardTitle>
          <CardDescription>
            Liste complète des commandes passées par ce client
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Aucune commande pour ce client
            </p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">#{order.order_number}</p>
                      <Badge
                        variant={
                          order.status === 'completed'
                            ? 'default'
                            : order.status === 'cancelled'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {order.status === 'completed'
                          ? 'Complétée'
                          : order.status === 'cancelled'
                          ? 'Annulée'
                          : order.status === 'processing'
                          ? 'En cours'
                          : order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(order.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{order.total_amount.toFixed(2)} €</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bloquer ce client ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action empêchera le client de passer de nouvelles commandes.
              Vous pourrez le débloquer manuellement à tout moment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlockCustomer}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Blocage en cours...
                </>
              ) : (
                'Confirmer le blocage'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showUnblockDialog} onOpenChange={setShowUnblockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Débloquer ce client ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action permettra au client de passer à nouveau des commandes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnblockCustomer}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Déblocage en cours...
                </>
              ) : (
                'Confirmer le déblocage'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
