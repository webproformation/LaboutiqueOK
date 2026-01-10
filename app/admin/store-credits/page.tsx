'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2, PiggyBank, Plus, Euro, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface StoreCredit {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  status: string;
  created_at: string;
  expires_at: string | null;
  used_at: string | null;
  order_id: string | null;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export default function AdminStoreCreditsPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [storeCredits, setStoreCredits] = useState<StoreCredit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  useEffect(() => {
    if (profile && !profile.is_admin) {
      router.push('/');
      return;
    }
    if (profile) {
      loadStoreCredits();
      loadUsers();
    }
  }, [profile, router]);

  const loadStoreCredits = async () => {
    try {
      const { data, error } = await supabase
        .from('store_credits')
        .select(`
          *,
          profiles!store_credits_user_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStoreCredits(data || []);
    } catch (error) {
      console.error('Error loading store credits:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .order('first_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleCreateCredit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId || !amount || !reason) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.from('store_credits').insert({
        user_id: selectedUserId,
        amount: parseFloat(amount),
        reason,
        status: 'available',
        expires_at: expiresAt || null,
        created_by: profile?.id,
      });

      if (error) throw error;

      toast.success('Avoir créé avec succès');
      setDialogOpen(false);
      resetForm();
      loadStoreCredits();
    } catch (error) {
      console.error('Error creating store credit:', error);
      toast.error('Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedUserId('');
    setAmount('');
    setReason('');
    setExpiresAt('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'used':
        return <CheckCircle className="h-4 w-4 text-gray-400" />;
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'used':
        return 'Utilisé';
      case 'expired':
        return 'Expiré';
      default:
        return status;
    }
  };

  const getTotalAvailable = () => {
    return storeCredits
      .filter((c) => c.status === 'available')
      .reduce((sum, c) => sum + Number(c.amount), 0);
  };

  const getTotalUsed = () => {
    return storeCredits
      .filter((c) => c.status === 'used')
      .reduce((sum, c) => sum + Number(c.amount), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Gestion des Avoirs</h2>
          <p className="text-gray-600">
            Créez et gérez les avoirs clients (crédits boutique)
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d] text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Créer un avoir
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Créer un avoir</DialogTitle>
              <DialogDescription>
                Générez un crédit boutique pour un client
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCredit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user">
                  Client <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.first_name} {user.last_name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">
                  Montant (€) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="10.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">
                  Raison <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Retour produit, Geste commercial..."
                  required
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresAt">Date d'expiration (optionnel)</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500">
                  Laisser vide pour un avoir sans expiration
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d] text-white"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    'Créer'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Disponible
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {getTotalAvailable().toFixed(2)}€
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Utilisé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">
              {getTotalUsed().toFixed(2)}€
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Nombre d'Avoirs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#D4AF37]">
              {storeCredits.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Avoirs</CardTitle>
          <CardDescription>Tous les avoirs créés pour vos clients</CardDescription>
        </CardHeader>
        <CardContent>
          {storeCredits.length === 0 ? (
            <div className="text-center py-12">
              <PiggyBank className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun avoir créé pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {storeCredits.map((credit) => (
                <div
                  key={credit.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">
                          {credit.profiles.first_name} {credit.profiles.last_name}
                        </h3>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(credit.status)}
                          <span className="text-xs text-gray-600">
                            {getStatusLabel(credit.status)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{credit.profiles.email}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#D4AF37]">
                        {Number(credit.amount).toFixed(2)}€
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p className="text-gray-700">
                      <span className="font-medium">Raison:</span> {credit.reason}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Créé le:</span>{' '}
                      {format(new Date(credit.created_at), 'd MMMM yyyy', { locale: fr })}
                    </p>
                    {credit.expires_at && (
                      <p className="text-gray-600">
                        <span className="font-medium">Expire le:</span>{' '}
                        {format(new Date(credit.expires_at), 'd MMMM yyyy', { locale: fr })}
                      </p>
                    )}
                    {credit.used_at && (
                      <p className="text-gray-600">
                        <span className="font-medium">Utilisé le:</span>{' '}
                        {format(new Date(credit.used_at), 'd MMMM yyyy', { locale: fr })}
                      </p>
                    )}
                    {credit.order_id && (
                      <p className="text-gray-600">
                        <span className="font-medium">Commande:</span> {credit.order_id}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
