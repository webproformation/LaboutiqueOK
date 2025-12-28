"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { User, Mail, Phone, Loader2, Calendar, PiggyBank, TrendingDown, Package } from 'lucide-react';
import Image from 'next/image';
import ProfilePictureUpload from '@/components/ProfilePictureUpload';
import { useAdmin } from '@/hooks/use-admin';
import Link from 'next/link';

interface SavingsData {
  totalSavings: number;
  monthlySavings: number;
  openBatches: number;
}

export default function AccountPage() {
  const { profile, updateProfile, user } = useAuth();
  const { isAdmin } = useAdmin();
  const [loading, setLoading] = useState(false);
  const [savingsData, setSavingsData] = useState<SavingsData>({
    totalSavings: 0,
    monthlySavings: 0,
    openBatches: 0,
  });
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    birth_date: '',
    avatar_url: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        birth_date: profile.birth_date || '',
        avatar_url: profile.avatar_url || '',
      });
    }
    if (user) {
      fetchSavingsData();
    }
  }, [profile, user]);

  const fetchSavingsData = async () => {
    if (!user?.id) {
      console.warn('No user ID available for fetching savings data');
      return;
    }

    try {
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const { data: batches, error } = await supabase
        .from('delivery_batches')
        .select('id, status, created_at, shipping_cost')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching batches:', error);
        return;
      }

      const estimatedShippingCostPerBatch = 5.90;
      const openBatches = batches?.length || 0;
      const totalSavings = openBatches > 1 ? (openBatches - 1) * estimatedShippingCostPerBatch : 0;

      const batchesThisMonth = batches?.filter(batch =>
        new Date(batch.created_at) >= firstDayOfMonth
      ) || [];
      const monthlySavings = batchesThisMonth.length > 1 ? (batchesThisMonth.length - 1) * estimatedShippingCostPerBatch : 0;

      setSavingsData({
        totalSavings: Math.round(totalSavings * 100) / 100,
        monthlySavings: Math.round(monthlySavings * 100) / 100,
        openBatches,
      });
    } catch (error) {
      console.error('Erreur lors du chargement des économies:', error);
    }
  };

  const handleAvatarUpdate = async (newAvatarUrl: string) => {
    const { error } = await updateProfile({ avatar_url: newAvatarUrl });
    if (error) {
      toast.error('Erreur lors de la mise à jour de la photo');
    } else {
      setFormData({ ...formData, avatar_url: newAvatarUrl });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await updateProfile(formData);

    if (error) {
      toast.error('Erreur lors de la mise à jour du profil');
    } else {
      toast.success('Profil mis à jour avec succès !');
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {savingsData.openBatches > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <PiggyBank className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-green-900">
                    {savingsData.totalSavings.toFixed(2)}€ économisés
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    En cumulant votre panier ({savingsData.openBatches} commande{savingsData.openBatches > 1 ? 's' : ''} ouverte{savingsData.openBatches > 1 ? 's' : ''})
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-6">
                <div className="text-center">
                  <div className="flex items-center gap-2 justify-center">
                    <TrendingDown className="h-5 w-5 text-green-600" />
                    <p className="text-3xl font-bold text-green-900">
                      {savingsData.monthlySavings.toFixed(2)}€
                    </p>
                  </div>
                  <p className="text-xs text-green-700 mt-1">Ce mois-ci</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-2 justify-center">
                    <Package className="h-5 w-5 text-green-600" />
                    <p className="text-3xl font-bold text-green-900">
                      {savingsData.openBatches}
                    </p>
                  </div>
                  <p className="text-xs text-green-700 mt-1">Colis ouverts</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <Link href="/account/invoices-management" title="Gestion des factures (Admin)">
                <div className="p-3 bg-[#b8933d] rounded-full hover:bg-[#a07c2f] transition-colors cursor-pointer">
                  <User className="h-6 w-6 text-white" />
                </div>
              </Link>
            ) : (
              <div className="p-3 bg-[#b8933d] rounded-full">
                <User className="h-6 w-6 text-white" />
              </div>
            )}
            <div>
              <CardTitle>Photo de profil</CardTitle>
              <CardDescription>
                Ta photo sera visible lors des lives pour une expérience plus conviviale
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <ProfilePictureUpload
            currentAvatarUrl={formData.avatar_url}
            firstName={formData.first_name}
            lastName={formData.last_name}
            onAvatarUpdate={handleAvatarUpdate}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#b8933d] rounded-full">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                Gérez vos informations de profil
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Prénom</Label>
                <Input
                  id="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Nom</Label>
                <Input
                  id="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <p className="text-xs text-gray-500">
                L'email ne peut pas être modifié
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+33 6 12 34 56 78"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_date">Date d'anniversaire</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) =>
                    setFormData({ ...formData, birth_date: e.target.value })
                  }
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-500">
                Optionnel - pour recevoir des offres spéciales pour votre anniversaire
              </p>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="bg-[#b8933d] hover:bg-[#a07c2f]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer les modifications'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
