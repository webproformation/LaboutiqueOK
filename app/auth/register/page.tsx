"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { UserPlus, Loader2, Gift, Calendar, Eye, EyeOff } from 'lucide-react';
import GDPRConsent from '@/components/GDPRConsent';

function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasPendingPrize, setHasPendingPrize] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [gdprError, setGdprError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp } = useAuth();
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

    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (!gdprConsent) {
      setGdprError('Vous devez accepter les conditions pour créer un compte');
      return;
    }

    setGdprError('');
    setLoading(true);

    const { error } = await signUp(email, password, firstName, lastName, birthDate || null, referralCode || undefined);

    if (error) {
      toast.error(error.message || 'Une erreur est survenue lors de l\'inscription');
    } else {
      if (referralCode && referralCode.trim()) {
        toast.success('Compte créé avec succès ! Vous et votre parrain avez chacun reçu un coupon de 5€ !');
        router.push('/account/coupons');
      } else if (hasPendingPrize) {
        toast.success('Compte créé avec succès ! Votre gain a été ajouté à votre compte.');
        router.push('/account/coupons');
      } else {
        toast.success('Compte créé avec succès !');
        router.push('/account');
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className={`p-3 ${hasPendingPrize ? 'bg-yellow-500' : 'bg-[#b8933d]'} rounded-full`}>
              {hasPendingPrize ? <Gift className="h-6 w-6 text-white" /> : <UserPlus className="h-6 w-6 text-white" />}
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Créer un compte</CardTitle>
          <CardDescription className="text-center">
            {hasPendingPrize
              ? 'Créez votre compte pour récupérer votre gain du jeu concours !'
              : 'Rejoignez-nous pour profiter de toutes nos fonctionnalités'
            }
          </CardDescription>
        </CardHeader>
        {hasPendingPrize && (
          <div className="mx-6 mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 text-center">
              Vous avez gagné un prix au jeu concours ! Créez votre compte pour le récupérer.
            </p>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Prénom"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Nom"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Date d&apos;anniversaire (optionnel)</Label>
              <div className="relative">
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  disabled={loading}
                  max={new Date().toISOString().split('T')[0]}
                  className="pl-10"
                />
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nom@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="referralCode">Code de parrainage (optionnel)</Label>
              <Input
                id="referralCode"
                type="text"
                placeholder="Entrez un code de parrainage"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Si vous avez été parrainé(e), entrez le code de votre parrain/marraine
              </p>
            </div>
            <GDPRConsent
              type="account"
              checked={gdprConsent}
              onCheckedChange={setGdprConsent}
              error={gdprError}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full bg-[#b8933d] hover:bg-[#a07c2f]"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                'Créer mon compte'
              )}
            </Button>
            <div className="text-sm text-center text-gray-600">
              Vous avez déjà un compte ?{' '}
              <Link href="/auth/login" className="text-[#b8933d] hover:text-[#a07c2f] font-semibold">
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4 py-12">
        <Card className="w-full max-w-md p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#b8933d]" />
          </div>
        </Card>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
