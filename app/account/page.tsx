'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProfilePictureUpload } from '@/components/profile-picture-upload';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Save,
  LogOut,
  ShieldCheck,
  PiggyBank,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, loading, updateProfile, signOut } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?redirect=/account');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (profile) {
      if (profile.blocked) {
        toast.error('Votre compte a été suspendu. Contactez le service client.');
        signOut();
        return;
      }

      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setPhone(profile.phone || '');
      setBirthDate(profile.birth_date || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile, signOut]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#b8933d]" />
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const formatMemberSince = (dateString: string) => {
    try {
      return format(new Date(dateString), 'd MMMM yyyy', { locale: fr });
    } catch {
      return dateString;
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Le nom et le prénom sont obligatoires');
      return;
    }

    setIsUpdating(true);
    const toastId = toast.loading('Enregistrement en cours...');

    try {
      const { error } = await updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        birth_date: birthDate || null,
        avatar_url: avatarUrl,
      });

      if (error) {
        toast.error('Erreur lors de la mise à jour', { id: toastId });
        setIsUpdating(false);
        return;
      }

      toast.success('Profil mis à jour avec succès!', { id: toastId });
      setIsUpdating(false);
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Une erreur est survenue', { id: toastId });
      setIsUpdating(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Mon Compte</h2>
          <p className="text-gray-600">Gérez vos informations personnelles</p>
        </div>
        <div className="flex gap-2">
          {profile.is_admin && (
            <Link href="/admin">
              <Button variant="outline" className="gap-2">
                <ShieldCheck className="h-4 w-4" />
                Administration
              </Button>
            </Link>
          )}
          <Button variant="outline" onClick={handleSignOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </div>

      {profile.is_admin && (
        <Card className="bg-gradient-to-r from-black to-gray-900 border-[#b8933d]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-[#b8933d]/20 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-[#b8933d]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#b8933d]">Compte Administrateur</h3>
                <p className="text-sm text-gray-300">
                  Vous avez accès aux fonctionnalités d'administration
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gradient-to-r from-[#b8933d] to-[#d4af37] border-[#b8933d]">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <PiggyBank className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Solde du Porte-monnaie</h3>
                <p className="text-sm text-white/90">Utilisable sur vos prochaines commandes</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">
                {profile.wallet_balance.toFixed(2)}€
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-[#b8933d]" />
            <CardTitle>Informations personnelles</CardTitle>
          </div>
          <CardDescription>Mettez à jour vos informations de compte</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex justify-center">
              <ProfilePictureUpload
                currentUrl={avatarUrl}
                firstName={firstName}
                lastName={lastName}
                onUploadComplete={setAvatarUrl}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  Prénom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Claire"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Nom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Dupont"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="pl-10 bg-gray-100"
                />
              </div>
              <p className="text-xs text-gray-500">L'email ne peut pas être modifié</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+33 6 12 34 56 78"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Date de naissance</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  max={getTodayDate()}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-gray-500">
                Recevez un cadeau spécial pour votre anniversaire
              </p>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600">
                Membre depuis le{' '}
                <span className="font-medium">{formatMemberSince(profile.created_at)}</span>
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/')}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isUpdating}
                className="flex-1 bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d] text-white gap-2"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
