'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProfilePictureUpload } from '@/components/profile-picture-upload';
import { PasswordInput } from '@/components/PasswordInput';
import { LoyaltyEuroBar } from '@/components/LoyaltyEuroBar';
import { User, Mail, Phone, Calendar, Save, Loader2, PiggyBank, Lock, Sparkles, Star, Coins, Award } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AccountPage() {
  const { profile, updateProfile, updatePassword } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setPhone(profile.phone || '');
      setBirthDate(profile.birth_date || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

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

    const { error } = await updateProfile({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim(),
      birth_date: birthDate || null,
      avatar_url: avatarUrl,
    });

    if (error) {
      console.error('❌ ERREUR COMPLÈTE:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        full: error
      });
      toast.error(`Erreur: ${error.message || 'Inconnue'}`, { id: toastId });
      setIsUpdating(false);
      return;
    }

    toast.success('Profil mis à jour avec succès!', { id: toastId });
    setIsUpdating(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setIsUpdatingPassword(true);
    const toastId = toast.loading('Mise à jour du mot de passe...');

    const { error } = await updatePassword(newPassword);

    if (error) {
      toast.error(error.message || 'Erreur lors de la mise à jour', { id: toastId });
      setIsUpdatingPassword(false);
      return;
    }

    toast.success('Mot de passe mis à jour avec succès!', { id: toastId });
    setNewPassword('');
    setConfirmPassword('');
    setIsUpdatingPassword(false);
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#C6A15B]/10 border border-[#D4AF37]/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${firstName} ${lastName}`}
              className="h-16 w-16 rounded-full object-cover border-2 border-[#D4AF37] flex-shrink-0"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-[#D4AF37] flex items-center justify-center text-white text-2xl font-semibold flex-shrink-0">
              {firstName.charAt(0)}{lastName.charAt(0)}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Bienvenue, {firstName} !
            </h1>
            <p className="text-gray-700 leading-relaxed mb-2">
              Ici, chaque visite, chaque échange en live et chaque coup de cœur te rapproche de ta prochaine pépite.
              Ta fidélité a de la valeur, et je suis ravie de la récompenser chaque jour.
            </p>
            <p className="text-sm text-gray-600">
              Membre depuis le {formatMemberSince(profile.created_at)}
            </p>
          </div>
        </div>
      </div>

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
                {((Number(profile.wallet_balance) || 0) + (Number(profile.loyalty_euros) || 0)).toFixed(2)}€
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <LoyaltyEuroBar />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {/* MODIFICATION : LIEN SECRET ADMIN */}
            {profile?.is_admin ? (
              <Link href="/account/admin-invoices" title="Accès Factures Admin">
                <User className="h-5 w-5 text-[#D4AF37] hover: cursor-pointer transition-transform hover:scale-110" />
              </Link>
            ) : (
              <User className="h-5 w-5 text-[#D4AF37]" />
            )}
            {/* FIN MODIFICATION */}
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

            <Button
              type="submit"
              disabled={isUpdating}
              className="w-full bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d] text-white gap-2"
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
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-[#D4AF37]" />
            <CardTitle>Sécurité</CardTitle>
          </div>
          <CardDescription>Modifier votre mot de passe</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">
                Nouveau mot de passe <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                <PasswordInput
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 pr-10"
                  disabled={isUpdatingPassword}
                />
              </div>
              <p className="text-xs text-gray-500">Minimum 8 caractères</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirmer le mot de passe <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  disabled={isUpdatingPassword}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isUpdatingPassword}
              className="w-full bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d] text-white gap-2"
            >
              {isUpdatingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Changer le mot de passe
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}