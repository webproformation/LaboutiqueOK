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
  Search,
  Eye,
  Edit2,
  Save,
  Trash2
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

interface Stats {
  total: number;
  admins: number;
  blocked: number;
  totalWallet: number;
}

export default function ClientsPage() {
  const [profiles, setProfiles] = useState<SupabaseProfile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<SupabaseProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [updatingAdmin, setUpdatingAdmin] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<SupabaseProfile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [deletingClient, setDeletingClient] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    admins: 0,
    blocked: 0,
    totalWallet: 0,
  });

  useEffect(() => {
    loadProfiles();
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

  const loadProfiles = async () => {
    setLoading(true);
    try {
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

      setStats({
        total: data?.length || 0,
        admins,
        blocked,
        totalWallet,
      });
    } finally {
      setLoading(false);
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
          .single();

        if (!existingProfile) {
          await supabase.from('profiles').insert({
            id: authUser.id,
            email: authUser.email,
            created_at: authUser.created_at,
          });
          syncedCount++;
        }
      }

      toast.success(`${syncedCount} nouveau(x) profil(s) synchronisé(s)`);
      await loadProfiles();
    } catch (error) {
      toast.error('Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  const toggleAdmin = async (profileId: string, currentStatus: boolean) => {
    setUpdatingAdmin(profileId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', profileId)
        .select();

      if (error) {
        console.error('[ADMIN TOGGLE] Error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error('[ADMIN TOGGLE] No rows updated');
        toast.error('Aucune modification effectuée. Vérifiez vos permissions.');
        return;
      }

      console.log('[ADMIN TOGGLE] Success:', data);
      toast.success(`Statut admin ${!currentStatus ? 'activé' : 'désactivé'}`);
      await loadProfiles();
    } catch (error: any) {
      console.error('[ADMIN TOGGLE] Exception:', error);
      toast.error(`Erreur: ${error.message || 'Mise à jour impossible'}`);
    } finally {
      setUpdatingAdmin(null);
    }
  };

  const toggleBlocked = async (profileId: string, currentStatus: boolean) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ blocked: !currentStatus })
        .eq('id', profileId)
        .select();

      if (error) {
        console.error('[BLOCKED TOGGLE] Error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error('[BLOCKED TOGGLE] No rows updated');
        toast.error('Aucune modification effectuée. Vérifiez vos permissions.');
        return;
      }

      console.log('[BLOCKED TOGGLE] Success:', data);
      toast.success(`Client ${!currentStatus ? 'bloqué' : 'débloqué'}`);
      await loadProfiles();
    } catch (error: any) {
      console.error('[BLOCKED TOGGLE] Exception:', error);
      toast.error(`Erreur: ${error.message || 'Mise à jour impossible'}`);
    }
  };

  const updateWalletBalance = async (profileId: string, newBalance: number) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('id', profileId);

      if (error) throw error;

      toast.success('Solde wallet mis à jour');
      await loadProfiles();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du wallet');
    }
  };

  const openCustomerDetail = (customer: SupabaseProfile) => {
    setSelectedCustomer(customer);
    setEditedData(customer);
    setEditMode(false);
  };

  const saveCustomerChanges = async () => {
    if (!selectedCustomer || !editedData) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          first_name: editedData.first_name,
          last_name: editedData.last_name,
          phone: editedData.phone,
          birth_date: editedData.birth_date,
        })
        .eq('id', selectedCustomer.id)
        .select();

      if (error) {
        console.error('[SAVE CUSTOMER] Error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error('[SAVE CUSTOMER] No rows updated');
        toast.error('Aucune modification effectuée. Vérifiez vos permissions.');
        return;
      }

      console.log('[SAVE CUSTOMER] Success:', data);
      toast.success('Profil mis à jour');
      setEditMode(false);
      await loadProfiles();
      setSelectedCustomer(null);
    } catch (error: any) {
      console.error('[SAVE CUSTOMER] Exception:', error);
      toast.error(`Erreur: ${error.message || 'Mise à jour impossible'}`);
    }
  };

  const deleteClient = async (clientId: string, clientEmail: string) => {
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer le client ${clientEmail} ?\n\nCette action est irréversible et supprimera :\n- Le profil\n- Les commandes\n- Les adresses\n- L'historique complet`
    );

    if (!confirmed) return;

    setDeletingClient(clientId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', clientId)
        .select();

      if (error) {
        console.error('[DELETE CLIENT] Error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error('[DELETE CLIENT] No rows deleted');
        toast.error('Aucune suppression effectuée. Vérifiez vos permissions.');
        return;
      }

      console.log('[DELETE CLIENT] Success:', data);
      toast.success('Client supprimé avec succès');
      await loadProfiles();
      setSelectedCustomer(null);
    } catch (error: any) {
      console.error('[DELETE CLIENT] Exception:', error);
      toast.error(`Erreur: ${error.message || 'Suppression impossible'}`);
    } finally {
      setDeletingClient(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Clients</h1>
          <p className="text-gray-600 mt-2">
            Gérez les profils clients Supabase
          </p>
        </div>
        <Button
          onClick={syncAuthUsers}
          disabled={syncing}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {syncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Synchronisation...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Synchroniser avec Auth
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <User className="h-5 w-5 text-blue-600 mr-2" />
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Administrateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ShieldCheck className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-2xl font-bold">{stats.admins}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Bloqués</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Ban className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-2xl font-bold">{stats.blocked}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Wallets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <PiggyBank className="h-5 w-5 text-purple-600 mr-2" />
              <p className="text-2xl font-bold">{(Number(stats.totalWallet) || 0).toFixed(2)} €</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Liste des Clients</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Bloqué</TableHead>
                  <TableHead>Date création</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.email}</TableCell>
                    <TableCell>
                      {profile.first_name} {profile.last_name}
                    </TableCell>
                    <TableCell>{profile.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{(Number(profile.wallet_balance) || 0).toFixed(2)} €</Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={profile.is_admin}
                        onCheckedChange={() => toggleAdmin(profile.id, profile.is_admin)}
                        disabled={updatingAdmin === profile.id}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={profile.blocked}
                        onCheckedChange={() => toggleBlocked(profile.id, profile.blocked)}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(profile.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openCustomerDetail(profile)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteClient(profile.id, profile.email)}
                          disabled={deletingClient === profile.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {deletingClient === profile.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Détails du Client</span>
              {!editMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode(true)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              )}
              {editMode && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={saveCustomerChanges}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <div className="flex items-center mt-1">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                </div>
                <div>
                  <Label>Téléphone</Label>
                  {editMode ? (
                    <Input
                      value={editedData?.phone || ''}
                      onChange={(e) => setEditedData({...editedData, phone: e.target.value})}
                    />
                  ) : (
                    <div className="flex items-center mt-1">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{selectedCustomer.phone || '-'}</span>
                    </div>
                  )}
                </div>
                <div>
                  <Label>Prénom</Label>
                  {editMode ? (
                    <Input
                      value={editedData?.first_name || ''}
                      onChange={(e) => setEditedData({...editedData, first_name: e.target.value})}
                    />
                  ) : (
                    <span className="block mt-1">{selectedCustomer.first_name}</span>
                  )}
                </div>
                <div>
                  <Label>Nom</Label>
                  {editMode ? (
                    <Input
                      value={editedData?.last_name || ''}
                      onChange={(e) => setEditedData({...editedData, last_name: e.target.value})}
                    />
                  ) : (
                    <span className="block mt-1">{selectedCustomer.last_name}</span>
                  )}
                </div>
                <div>
                  <Label>Date de naissance</Label>
                  {editMode ? (
                    <Input
                      type="date"
                      value={editedData?.birth_date || ''}
                      onChange={(e) => setEditedData({...editedData, birth_date: e.target.value})}
                    />
                  ) : (
                    <div className="flex items-center mt-1">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span>
                        {selectedCustomer.birth_date
                          ? new Date(selectedCustomer.birth_date).toLocaleDateString('fr-FR')
                          : '-'}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <Label>Wallet Balance</Label>
                  <div className="flex items-center mt-1">
                    <PiggyBank className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{(Number(selectedCustomer.wallet_balance) || 0).toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-4">
                  <Badge variant={selectedCustomer.is_admin ? 'default' : 'secondary'}>
                    {selectedCustomer.is_admin ? 'Admin' : 'Client'}
                  </Badge>
                  {selectedCustomer.blocked && (
                    <Badge variant="destructive">Bloqué</Badge>
                  )}
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteClient(selectedCustomer.id, selectedCustomer.email)}
                  disabled={deletingClient === selectedCustomer.id}
                >
                  {deletingClient === selectedCustomer.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer le client
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
