'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  User,
  ShieldCheck,
  Ban,
  PiggyBank,
  RefreshCw,
  Loader2,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  Search,
  Eye,
  Package,
  Edit2,
  Save,
  ShoppingBag,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';

interface SupabaseProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  birth_date: string | null;
  avatar_url: string | null;
  wallet_balance: number;
  is_admin: boolean;
  blocked: boolean;
  blocked_reason: string | null;
  cancelled_orders_count: number;
  created_at: string;
}

interface WooCommerceCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  billing: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    postcode: string;
    country: string;
    phone: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    postcode: string;
    country: string;
  };
  orders_count: number;
  total_spent: string;
  date_created: string;
}

interface Order {
  id: number;
  number: string;
  status: string;
  total: string;
  date_created: string;
  line_items: any[];
}

interface Stats {
  total: number;
  admins: number;
  blocked: number;
  totalWallet: number;
  wooCommerceCustomers: number;
  supabaseOnly: number;
}

export default function ClientsPage() {
  const [profiles, setProfiles] = useState<SupabaseProfile[]>([]);
  const [wooCustomers, setWooCustomers] = useState<WooCommerceCustomer[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<SupabaseProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [updatingAdmin, setUpdatingAdmin] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<SupabaseProfile | WooCommerceCustomer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    admins: 0,
    blocked: 0,
    totalWallet: 0,
    wooCommerceCustomers: 0,
    supabaseOnly: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const filtered = profiles.filter(
      (profile) =>
        profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.phone?.includes(searchTerm)
    );
    setFilteredProfiles(filtered);
  }, [searchTerm, profiles]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadProfiles(), loadWooCustomers()]);
    } finally {
      setLoading(false);
    }
  };

  const loadProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erreur lors du chargement des profils');
      return;
    }

    setProfiles(data || []);

    const totalWallet = (data || []).reduce((sum, p) => sum + (Number(p.wallet_balance) || 0), 0);
    const admins = (data || []).filter(p => p.is_admin).length;
    const blocked = (data || []).filter(p => p.blocked).length;

    setStats(prev => ({
      ...prev,
      total: data?.length || 0,
      admins,
      blocked,
      totalWallet,
      supabaseOnly: data?.length || 0,
    }));
  };

  const loadWooCustomers = async () => {
    try {
      const response = await fetch('/api/woocommerce/customers?per_page=100');
      const result = await response.json();

      if (response.ok) {
        setWooCustomers(result.customers || []);
        setStats(prev => ({
          ...prev,
          wooCommerceCustomers: result.customers?.length || 0,
        }));
      }
    } catch (error) {
      console.error('Error loading WooCommerce customers:', error);
    }
  };

  const syncAuthUsers = async () => {
    setSyncing(true);
    try {
      const { data: { users: authUsers }, error } = await supabase.auth.admin.listUsers();

      if (error) throw error;

      let syncedCount = 0;
      for (const authUser of authUsers) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', authUser.id)
          .maybeSingle();

        if (!existingProfile) {
          const { error: insertError } = await supabase.from('profiles').insert({
            id: authUser.id,
            email: authUser.email || '',
            first_name: authUser.user_metadata?.first_name || '',
            last_name: authUser.user_metadata?.last_name || '',
            phone: authUser.user_metadata?.phone || '',
            birth_date: authUser.user_metadata?.birth_date || null,
            wallet_balance: 0,
            is_admin: false,
            blocked: false,
            cancelled_orders_count: 0,
          });

          if (!insertError) {
            syncedCount++;
          }
        }
      }

      toast.success(`${syncedCount} profil(s) synchronisé(s)`);
      await loadProfiles();
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  const toggleAdmin = async (profileId: string, currentValue: boolean) => {
    setUpdatingAdmin(profileId);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentValue })
        .eq('id', profileId);

      if (error) throw error;

      setProfiles(profiles.map(p =>
        p.id === profileId ? { ...p, is_admin: !currentValue } : p
      ));

      toast.success(!currentValue ? 'Administrateur activé' : 'Administrateur désactivé');
    } catch (error) {
      toast.error('Erreur lors de la modification');
    } finally {
      setUpdatingAdmin(null);
    }
  };

  const openCustomerDetail = async (customer: SupabaseProfile | WooCommerceCustomer) => {
    setSelectedCustomer(customer);
    setEditMode(false);
    setEditedData(customer);

    if ('id' in customer && typeof customer.id === 'string') {
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', customer.id)
        .order('created_at', { ascending: false });

      setCustomerOrders(ordersData || []);
    } else if ('id' in customer && typeof customer.id === 'number') {
      try {
        const response = await fetch(`/api/woocommerce/orders?customer=${customer.id}`);
        if (response.ok) {
          const data = await response.json();
          setCustomerOrders(data.orders || []);
        }
      } catch (error) {
        console.error('Error loading customer orders:', error);
      }
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      toast.success('Email de réinitialisation envoyé');
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de l\'email');
    }
  };

  const saveCustomerData = async () => {
    if (!selectedCustomer || !('id' in selectedCustomer && typeof selectedCustomer.id === 'string')) {
      toast.error('Impossible de modifier ce client');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: editedData.first_name,
          last_name: editedData.last_name,
          phone: editedData.phone,
          birth_date: editedData.birth_date,
        })
        .eq('id', selectedCustomer.id);

      if (error) throw error;

      toast.success('Informations mises à jour');
      setEditMode(false);
      await loadProfiles();
      setSelectedCustomer({ ...selectedCustomer, ...editedData });
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getCustomerType = (customer: SupabaseProfile | WooCommerceCustomer): 'supabase' | 'woocommerce' => {
    return 'id' in customer && typeof customer.id === 'string' ? 'supabase' : 'woocommerce';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Clients</h1>
          <p className="text-gray-600 mt-1">
            Liste complète des clients (Supabase + WooCommerce)
          </p>
        </div>
        <Button
          onClick={syncAuthUsers}
          disabled={syncing}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {syncing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Synchronisation...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Synchroniser auth.users
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Clients</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <User className="w-12 h-12 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Administrateurs</p>
                <p className="text-3xl font-bold text-pink-600">{stats.admins}</p>
              </div>
              <ShieldCheck className="w-12 h-12 text-pink-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Comptes bloqués</p>
                <p className="text-3xl font-bold text-red-600">{stats.blocked}</p>
              </div>
              <Ban className="w-12 h-12 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Porte-monnaie</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalWallet.toFixed(2)}€</p>
              </div>
              <PiggyBank className="w-12 h-12 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rechercher un client</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Rechercher par nom, email ou téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="supabase">
        <TabsList>
          <TabsTrigger value="supabase">
            Clients Supabase ({profiles.length})
          </TabsTrigger>
          <TabsTrigger value="woocommerce">
            Clients WooCommerce ({wooCustomers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="supabase" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Porte-monnaie</TableHead>
                    <TableHead>Date d'inscription</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-center">Admin</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {profile.avatar_url ? (
                            <img
                              src={profile.avatar_url}
                              alt={`${profile.first_name} ${profile.last_name}`}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                              {profile.first_name?.[0]?.toUpperCase() || profile.email[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {profile.first_name} {profile.last_name}
                            </p>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {profile.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {profile.phone ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {profile.phone}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                        {profile.birth_date && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(profile.birth_date).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-green-600">
                          {Number(profile.wallet_balance || 0).toFixed(2)}€
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {new Date(profile.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </TableCell>
                      <TableCell>
                        {profile.blocked ? (
                          <Badge variant="destructive" className="gap-1">
                            <Ban className="w-3 h-3" />
                            Bloqué
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 border-green-200 text-green-700">
                            <CheckCircle className="w-3 h-3" />
                            Actif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={profile.is_admin}
                            onCheckedChange={() => toggleAdmin(profile.id, profile.is_admin)}
                            disabled={updatingAdmin === profile.id}
                          />
                          {profile.is_admin && (
                            <ShieldCheck className="w-4 h-4 text-pink-600" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openCustomerDetail(profile)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Voir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="woocommerce" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Commandes</TableHead>
                    <TableHead>Total dépensé</TableHead>
                    <TableHead>Date d'inscription</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wooCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold">
                            {customer.first_name?.[0]?.toUpperCase() || customer.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {customer.first_name} {customer.last_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              <ShoppingBag className="w-3 h-3 inline mr-1" />
                              WooCommerce
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="w-3 h-3 text-gray-400" />
                          {customer.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{customer.orders_count} commande(s)</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-green-600">{customer.total_spent}€</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {new Date(customer.date_created).toLocaleDateString('fr-FR')}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openCustomerDetail(customer)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Voir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Détails du client{' '}
              <Badge className="ml-2">
                {selectedCustomer && getCustomerType(selectedCustomer) === 'supabase' ? 'Supabase' : 'WooCommerce'}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Informations complètes et gestion du compte client
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prénom</Label>
                  {editMode ? (
                    <Input
                      value={editedData.first_name}
                      onChange={(e) => setEditedData({ ...editedData, first_name: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium">{('first_name' in selectedCustomer ? selectedCustomer.first_name : '')}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Nom</Label>
                  {editMode ? (
                    <Input
                      value={editedData.last_name}
                      onChange={(e) => setEditedData({ ...editedData, last_name: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium">{('last_name' in selectedCustomer ? selectedCustomer.last_name : '')}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <p className="text-sm font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {'email' in selectedCustomer ? selectedCustomer.email : ''}
                </p>
              </div>

              {getCustomerType(selectedCustomer) === 'supabase' && (
                <>
                  <div className="space-y-2">
                    <Label>Téléphone</Label>
                    {editMode ? (
                      <Input
                        value={editedData.phone || ''}
                        onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm font-medium">
                        {('phone' in selectedCustomer ? selectedCustomer.phone : '') || '-'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Date de naissance</Label>
                    {editMode ? (
                      <Input
                        type="date"
                        value={editedData.birth_date || ''}
                        onChange={(e) => setEditedData({ ...editedData, birth_date: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm font-medium">
                        {('birth_date' in selectedCustomer && selectedCustomer.birth_date)
                          ? new Date(selectedCustomer.birth_date).toLocaleDateString('fr-FR')
                          : '-'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Porte-monnaie</Label>
                    <p className="text-sm font-medium text-green-600">
                      {('wallet_balance' in selectedCustomer ? Number(selectedCustomer.wallet_balance).toFixed(2) : '0.00')}€
                    </p>
                  </div>
                </>
              )}

              {getCustomerType(selectedCustomer) === 'woocommerce' && 'billing' in selectedCustomer && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">Adresse de facturation</Label>
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg space-y-1 text-sm">
                      <p className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span>
                          {selectedCustomer.billing.address_1}<br />
                          {selectedCustomer.billing.address_2 && <>{selectedCustomer.billing.address_2}<br /></>}
                          {selectedCustomer.billing.postcode} {selectedCustomer.billing.city}<br />
                          {selectedCustomer.billing.country}
                        </span>
                      </p>
                      {selectedCustomer.billing.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {selectedCustomer.billing.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {'shipping' in selectedCustomer && (
                    <div>
                      <Label className="text-base font-semibold">Adresse de livraison</Label>
                      <div className="mt-2 p-4 bg-gray-50 rounded-lg space-y-1 text-sm">
                        <p className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                          <span>
                            {selectedCustomer.shipping.address_1}<br />
                            {selectedCustomer.shipping.address_2 && <>{selectedCustomer.shipping.address_2}<br /></>}
                            {selectedCustomer.shipping.postcode} {selectedCustomer.shipping.city}<br />
                            {selectedCustomer.shipping.country}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3 border-t pt-4">
                <Label className="text-base font-semibold">Actions</Label>
                <div className="flex flex-wrap gap-2">
                  {getCustomerType(selectedCustomer) === 'supabase' && (
                    <>
                      {!editMode ? (
                        <Button
                          variant="outline"
                          onClick={() => setEditMode(true)}
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Modifier les informations
                        </Button>
                      ) : (
                        <>
                          <Button onClick={saveCustomerData}>
                            <Save className="w-4 h-4 mr-2" />
                            Enregistrer
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditMode(false);
                              setEditedData(selectedCustomer);
                            }}
                          >
                            Annuler
                          </Button>
                        </>
                      )}
                    </>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => sendPasswordReset('email' in selectedCustomer ? selectedCustomer.email : '')}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Réinitialiser le mot de passe
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-base font-semibold mb-3 block">
                  <Package className="w-4 h-4 inline mr-2" />
                  Commandes ({customerOrders.length})
                </Label>
                {customerOrders.length > 0 ? (
                  <div className="space-y-2">
                    {customerOrders.map((order) => (
                      <div key={order.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">Commande #{order.number}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(order.date_created).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <Badge>{order.status}</Badge>
                        </div>
                        <p className="text-sm font-semibold mt-2">{order.total}€</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Aucune commande</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
