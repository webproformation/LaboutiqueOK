"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { User, Mail, Phone, Loader2, Calendar, PiggyBank, Save, LogOut, ShieldCheck } from 'lucide-react';
import ProfilePictureUpload from '@/components/ProfilePictureUpload';
import Link from 'next/link';

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
  created_at: string;
}

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    birth_date: '',
    avatar_url: '',
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/login?redirect=/account');
        return;
      }

      await loadProfile(session.user.id);
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/auth/login');
    }
  };

  const loadProfile = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error('Profil introuvable');
        router.push('/auth/login');
        return;
      }

      if (data.blocked) {
        toast.error('Votre compte a été suspendu');
        await supabase.auth.signOut();
        router.push('/auth/login');
        return;
      }

      setProfile(data);
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone: data.phone || '',
        birth_date: data.birth_date || '',
        avatar_url: data.avatar_url || '',
      });
    } catch (error: any) {
      console.error('Load profile error:', error);
      toast.error('Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile) return;

    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast.error('Le nom et le prénom sont obligatoires');
      return;
    }

    setSaving(true);
    const toastId = toast.loading('Enregistrement...');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          phone: formData.phone.trim(),
          birth_date: formData.birth_date || null,
          avatar_url: formData.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      await loadProfile(profile.id);

      toast.success('Profil mis à jour avec succès!', { id: toastId });
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    const toastId = toast.loading('Déconnexion...');
    try {
      await supabase.auth.signOut();
      toast.success('Déconnexion réussie', { id: toastId });
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Erreur lors de la déconnexion', { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-pink-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mon Compte</h1>
            <p className="text-gray-600 mt-1">
              Gérez vos informations personnelles
            </p>
          </div>
          <div className="flex gap-3">
            {profile.is_admin && (
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Administration
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>

        {profile.is_admin && (
          <Card className="border-pink-200 bg-pink-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-pink-600" />
                <div>
                  <h3 className="font-semibold text-pink-900">Compte Administrateur</h3>
                  <p className="text-sm text-pink-700">
                    Vous avez accès aux fonctionnalités d'administration
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PiggyBank className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">Solde du Porte-monnaie</h3>
                  <p className="text-sm text-green-700">
                    Utilisable sur vos prochaines commandes
                  </p>
                </div>
              </div>
              <div className="text-3xl font-bold text-green-900">
                {(profile.wallet_balance || 0).toFixed(2)}€
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informations personnelles
              </CardTitle>
              <CardDescription>
                Mettez à jour vos informations de compte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <ProfilePictureUpload
                  currentUrl={formData.avatar_url}
                  onUploadComplete={(url) => setFormData({ ...formData, avatar_url: url })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">
                    Prénom *
                  </Label>
                  <Input
                    id="first_name"
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                    disabled={saving}
                    placeholder="Claire"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">
                    Nom *
                  </Label>
                  <Input
                    id="last_name"
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                    disabled={saving}
                    placeholder="Dupont"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-xs text-gray-500">
                  L'email ne peut pas être modifié
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Téléphone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={saving}
                  placeholder="+33 6 12 34 56 78"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_date">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date de naissance
                </Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date || ''}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  disabled={saving}
                  max={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500">
                  Recevez un cadeau spécial pour votre anniversaire
                </p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-4">
                  Membre depuis le {new Date(profile.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/')}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
