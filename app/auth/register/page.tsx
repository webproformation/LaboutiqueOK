"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { UserPlus, Loader2, Eye, EyeOff, Calendar, Gift } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import GDPRConsent from '@/components/GDPRConsent';

function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasPendingPrize, setHasPendingPrize] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [gdprError, setGdprError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const prizePending = searchParams.get('prize_pending');
    const pendingPrize = localStorage.getItem('pending_prize');
    setHasPendingPrize(prizePending === 'true' && !!pendingPrize);

    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGdprError('');

    if (!gdprConsent) {
      setGdprError('Vous devez accepter la politique de confidentialité pour continuer');
      toast.error('Veuillez accepter la politique de confidentialité');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Le nom et le prénom sont obligatoires');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Création de votre compte...');

    try {
      // 1. CRÉER LE COMPTE SUPABASE AUTH
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: phone.trim() || '',
            birth_date: birthDate || null,
          },
          emailRedirectTo: `${window.location.origin}/auth/login`,
        },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('Erreur lors de la création du compte');

      // 2. CRÉER LE PROFIL DANS PUBLIC.PROFILES
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: email.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim() || '',
          birth_date: birthDate || null,
          wallet_balance: 0,
          is_admin: false,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Ne pas bloquer l'inscription si le profil existe déjà
        if (!profileError.message.includes('duplicate')) {
          throw new Error('Erreur lors de la création du profil');
        }
      }

      // 3. GÉRER LE CODE PARRAINAGE
      if (referralCode.trim()) {
        try {
          const { data: referrer } = await supabase
            .from('profiles')
            .select('id, first_name')
            .eq('id', referralCode.trim())
            .maybeSingle();

          if (referrer) {
            const { error: referralError } = await supabase
              .from('referrals')
              .insert({
                referrer_id: referrer.id,
                referred_id: authData.user.id,
                status: 'pending',
              });

            if (!referralError) {
              toast.success(`Vous avez été parrainé par ${referrer.first_name}!`);
            }
          }
        } catch (err) {
          console.error('Referral error:', err);
        }
      }

      // 4. GÉRER LE PRIX EN ATTENTE (SCRATCH CARD)
      if (hasPendingPrize) {
        try {
          const pendingPrize = localStorage.getItem('pending_prize');
          if (pendingPrize) {
            const prizeData = JSON.parse(pendingPrize);

            const { error: prizeError } = await supabase
              .from('pending_prizes')
              .update({
                user_id: authData.user.id,
                claimed: true,
                claimed_at: new Date().toISOString(),
              })
              .eq('session_id', prizeData.session_id);

            if (!prizeError) {
              localStorage.removeItem('pending_prize');
              toast.success('🎁 Votre prix a été ajouté à votre compte!');
            }
          }
        } catch (err) {
          console.error('Prize claim error:', err);
        }
      }

      toast.success('Compte créé avec succès! Bienvenue!', { id: toastId });

      // 5. REDIRECTION IMMÉDIATE
      setTimeout(() => {
        router.push('/account');
        router.refresh();
      }, 1000);

    } catch (error: any) {
      console.error('Registration error:', error);

      if (error.message?.includes('User already registered')) {
        toast.error('Un compte existe déjà avec cet email', { id: toastId });
      } else if (error.message?.includes('Password')) {
        toast.error('Le mot de passe ne respecte pas les critères de sécurité', { id: toastId });
      } else {
        toast.error(error.message || 'Erreur lors de la création du compte', { id: toastId });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Créer un compte
          </CardTitle>
          <CardDescription className="text-base">
            {hasPendingPrize && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <Gift className="w-5 h-5" />
                  <span className="font-medium">Vous avez un prix en attente!</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Créez votre compte pour récupérer votre cadeau
                </p>
              </div>
            )}
            Rejoignez notre communauté et profitez d'avantages exclusifs
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Claire"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Dupont"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                placeholder="claire@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone (optionnel)</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                placeholder="+33 6 12 34 56 78"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date de naissance (optionnel)
              </Label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                disabled={loading}
                max={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-gray-500">
                Recevez un cadeau spécial pour votre anniversaire
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="••••••••"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Minimum 8 caractères
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="••••••••"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {referralCode && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800 font-medium">
                  Code parrainage: {referralCode}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Vous et votre parrain recevrez 5€ après votre première commande
                </p>
              </div>
            )}

            <div className="space-y-2">
              <GDPRConsent
                checked={gdprConsent}
                onChange={setGdprConsent}
                error={gdprError}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Créer mon compte
                </>
              )}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Vous avez déjà un compte?{' '}
              <Link href="/auth/login" className="text-pink-600 hover:text-pink-700 font-medium">
                Se connecter
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
