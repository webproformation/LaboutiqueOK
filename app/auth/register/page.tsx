'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GDPRConsent } from '@/components/gdpr-consent-auth';
import { UserPlus, Eye, EyeOff, Loader2, Mail, Phone, Calendar, Gift } from 'lucide-react';
import { toast } from 'sonner';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp, user } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [gdprError, setGdprError] = useState('');
  const [loading, setLoading] = useState(false);

  const referralCode = searchParams.get('ref');
  const prizePending = searchParams.get('prize_pending') === 'true';
  const hasPendingPrize = typeof window !== 'undefined' && localStorage.getItem('pending_prize');

  useEffect(() => {
    if (user) {
      router.push('/account');
    }
  }, [user, router]);

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGdprError('');

    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Le nom et le prénom sont obligatoires');
      return;
    }

    if (password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (!gdprConsent) {
      setGdprError('Vous devez accepter la politique de confidentialité');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Création de votre compte...');

    try {
      const { error } = await signUp(
        email,
        password,
        firstName,
        lastName,
        phone || undefined,
        birthDate || null,
        referralCode || undefined
      );

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Un compte existe déjà avec cet email', { id: toastId });
        } else {
          toast.error(error.message || 'Une erreur est survenue', { id: toastId });
        }
        setLoading(false);
        return;
      }

      toast.success('Compte créé avec succès! Bienvenue!', { id: toastId });

      if (prizePending && hasPendingPrize) {
        router.push('/account/coupons');
      } else {
        router.push('/account');
      }
    } catch (error) {
      console.error('Register error:', error);
      toast.error('Une erreur est survenue', { id: toastId });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            {prizePending && hasPendingPrize ? (
              <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center">
                <Gift className="h-8 w-8 text-yellow-600" />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 bg-opacity-10 flex items-center justify-center">
                <UserPlus className="h-8 w-8 text-pink-600" />
              </div>
            )}
          </div>
          <div className="text-center space-y-2">
            <CardTitle className="text-2xl bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Créer un compte
            </CardTitle>
            <CardDescription>
              Rejoignez notre communauté et profitez d'avantages exclusifs
            </CardDescription>
          </div>

          {prizePending && hasPendingPrize && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-3">
              <Gift className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Vous avez gagné un prix au jeu concours !</p>
                <p className="text-yellow-700">Créez un compte pour le récupérer.</p>
              </div>
            </div>
          )}

          {referralCode && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-3">
              <Gift className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <p className="font-medium">Code parrainage: {referralCode}</p>
                <p className="text-green-700">Vous et votre parrain recevrez 5€ après votre première commande</p>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="claire@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
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
              <p className="text-xs text-gray-500">Recevez un cadeau spécial pour votre anniversaire</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Mot de passe <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
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
              <p className="text-xs text-gray-500">Minimum 8 caractères</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirmer le mot de passe <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
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

            <GDPRConsent
              type="account"
              checked={gdprConsent}
              onCheckedChange={setGdprConsent}
              error={gdprError}
            />

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Créer mon compte
                </>
              )}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Vous avez déjà un compte ?{' '}
              <Link
                href="/auth/login"
                className="text-pink-600 hover:underline font-medium"
              >
                Se connecter
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-pink-600" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
