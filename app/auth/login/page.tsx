'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, Eye, EyeOff, Loader2, Mail, Gift, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, user, profile } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const prizePending = searchParams.get('prize_pending') === 'true';
  const hasPendingPrize = typeof window !== 'undefined' && localStorage.getItem('pending_prize');

  useEffect(() => {
    if (user) {
      router.push('/account');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        toast.error('Email ou mot de passe incorrect');
        setLoading(false);
        return;
      }

      toast.success('Connexion réussie !');

      if (prizePending && hasPendingPrize) {
        router.push('/account/coupons');
      } else {
        router.push('/account');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Une erreur est survenue');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            {prizePending && hasPendingPrize ? (
              <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center">
                <Gift className="h-8 w-8 text-yellow-600" />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-full bg-[#b8933d] bg-opacity-10 flex items-center justify-center">
                <LogIn className="h-8 w-8 text-[#b8933d]" />
              </div>
            )}
          </div>
          <div className="text-center space-y-2">
            <CardTitle className="text-2xl">Connexion</CardTitle>
            <CardDescription>
              {prizePending && hasPendingPrize
                ? 'Connectez-vous pour récupérer votre prix !'
                : 'Accédez à votre espace client'}
            </CardDescription>
          </div>

          {prizePending && hasPendingPrize && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-3">
              <Gift className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Vous avez gagné un prix au jeu concours !</p>
                <p className="text-yellow-700">Connectez-vous pour le récupérer.</p>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nom@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-[#b8933d] hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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

            <Button
              type="submit"
              className="w-full bg-[#b8933d] hover:bg-[#a07c2f]"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                'Se connecter'
              )}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Pas encore de compte ?{' '}
              <Link
                href="/auth/register"
                className="text-[#b8933d] hover:underline font-medium"
              >
                Créer un compte
              </Link>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t">
            <Link href="/admin">
              <Button
                variant="outline"
                className="w-full border-pink-200 hover:bg-pink-50 text-pink-700"
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Accès administration
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#b8933d]" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
