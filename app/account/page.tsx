'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProfilePictureUpload } from '@/components/profile-picture-upload';
import { PasswordInput } from '@/components/PasswordInput';
import { User, Mail, Phone, Calendar, Save, Loader2, Lock, Coins, Wallet } from 'lucide-react';
import { toast } from 'sonner';

export default function AccountPage() {
  const { profile, updateProfile, updatePassword, loading } = useAuth();
  
  // États formulaire profil
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // États formulaire mot de passe
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    const { error } = await updateProfile({
      first_name: firstName,
      last_name: lastName,
      phone,
      birth_date: birthDate || null,
      avatar_url: avatarUrl,
    });
    setIsUpdating(false);
    if (error) toast.error('Erreur mise à jour profil');
    else toast.success('Profil mis à jour');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    setIsUpdatingPassword(true);
    const { error } = await updatePassword(newPassword);
    setIsUpdatingPassword(false);
    if (error) toast.error(error.message);
    else {
      toast.success('Mot de passe modifié');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" /></div>;
  if (!profile) return null;

  return (
    <div className="space-y-6">
      
      {/* --- BLOC CAGNOTTE & PORTE-MONNAIE --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cagnotte Fidélité */}
        <Card className="bg-gradient-to-br from-[#D4AF37]/10 to-white border-[#D4AF37]/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#D4AF37]">
              Cagnotte Fidélité
            </CardTitle>
            <Coins className="h-4 w-4 text-[#D4AF37]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.loyalty_points || 0} pts</div>
            <p className="text-xs text-gray-500">
              {/* Exemple de conversion, ajustez selon votre logique */}
              Valeur estimée : {((profile.loyalty_points || 0) * 0.1).toFixed(2)} €
            </p>
          </CardContent>
        </Card>

        {/* Porte-monnaie */}
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">
              Porte-monnaie
            </CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Number(profile.wallet_balance || 0).toFixed(2)} €</div>
            <p className="text-xs text-gray-500">
              Disponible pour vos prochains achats
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Mes informations</h2>
        <p className="text-gray-500">Gérez vos informations personnelles et votre sécurité.</p>
      </div>

      {/* Formulaire Profil */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-[#D4AF37]" />
            <CardTitle>Informations personnelles</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-6">
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
                <Label>Prénom</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input value={profile.email} disabled className="pl-10 bg-gray-100" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date de naissance</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="pl-10" />
              </div>
            </div>
            <Button type="submit" disabled={isUpdating} className="w-full bg-[#D4AF37] hover:bg-[#b8933d] text-white">
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Enregistrer</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Formulaire Mot de passe */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-[#D4AF37]" />
            <CardTitle>Sécurité</CardTitle>
          </div>
          <CardDescription>Changer votre mot de passe</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label>Nouveau mot de passe</Label>
              <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={isUpdatingPassword} />
            </div>
            <div className="space-y-2">
              <Label>Confirmer</Label>
              <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isUpdatingPassword} />
            </div>
            <Button type="submit" disabled={isUpdatingPassword} className="w-full bg-[#D4AF37] hover:bg-[#b8933d] text-white">
              {isUpdatingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Mettre à jour'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}