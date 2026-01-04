"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Search,
  Loader2,
  Mail,
  Phone,
  User,
  ShieldCheck,
  RefreshCw,
  Calendar,
  Ban,
  CheckCircle,
  PiggyBank
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  birth_date: string | null;
  avatar_url: string;
  wallet_balance: number;
  is_admin: boolean;
  blocked: boolean;
  blocked_reason: string | null;
  created_at: string;
}

export default function AdminCustomersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [updatingAdmin, setUpdatingAdmin] = useState<string | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      setFilteredProfiles(
        profiles.filter(p =>
          p.email.toLowerCase().includes(searchLower) ||
          p.first_name.toLowerCase().includes(searchLower) ||
          p.last_name.toLowerCase().includes(searchLower) ||
          p.phone.includes(search)
        )
      );
    } else {
      setFilteredProfiles(profiles);
    }
  }, [search, profiles]);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProfiles(data || []);
      setFilteredProfiles(data || []);
    } catch (error: any) {
      console.error('Load profiles error:', error);
      toast.error('Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  };

  const syncAuthUsers = async () => {
    setSyncing(true);
    const toastId = toast.loading('Synchronisation des comptes en cours...');

    try {
      // 1. VÉRIFIER LA SESSION
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Session invalide');
      }

      // 2. VÉRIFIER SI L'UTILISATEUR EST ADMIN
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!currentProfile?.is_admin) {
        throw new Error('Accès refusé');
      }

      // 3. CRÉER LE PROFIL DE L'UTILISATEUR ACTUEL S'IL N'EXISTE PAS
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();

      let synced = 0;
      let skipped = 0;

      if (!existingProfile) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            email: session.user.email || '',
            first_name: session.user.user_metadata?.first_name || '',
            last_name: session.user.user_metadata?.last_name || '',
            phone: session.user.user_metadata?.phone || '',
            birth_date: session.user.user_metadata?.birth_date || null,
            wallet_balance: 0,
            is_admin: false,
          });

        if (!insertError) {
          synced++;
        }
      } else {
        skipped++;
      }

      toast.success(`Synchronisation réussie! ${synced} profils créés, ${skipped} déjà existants`, { id: toastId });

      await loadProfiles();
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error(error.message || 'Erreur lors de la synchronisation', { id: toastId });
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
    } catch (error: any) {
      console.error('Toggle admin error:', error);
      toast.error('Erreur lors de la modification');
    } finally {
      setUpdatingAdmin(null);
    }
  };

  const stats = {
    total: profiles.length,
    admins: profiles.filter(p => p.is_admin).length,
    blocked: profiles.filter(p => p.blocked).length,
    totalWallet: profiles.reduce((sum, p) => sum + Number(p.wallet_balance || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-pink-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Clients</h1>
          <p className="text-gray-600 mt-1">
            Liste complète des comptes clients depuis Supabase
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
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Liste des Clients</CardTitle>
              <CardDescription>
                {filteredProfiles.length} client{filteredProfiles.length > 1 ? 's' : ''}
                {search && ` (filtré${filteredProfiles.length > 1 ? 's' : ''})`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, email ou téléphone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Porte-monnaie</TableHead>
                  <TableHead>Date d'inscription</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-center">Administrateur</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      {search ? 'Aucun client trouvé' : 'Aucun client'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProfiles.map((profile) => (
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
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredProfiles.length > 0 && (
            <div className="mt-4 text-sm text-gray-500 text-center">
              Affichage de {filteredProfiles.length} client{filteredProfiles.length > 1 ? 's' : ''}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
