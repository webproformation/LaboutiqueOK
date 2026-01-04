'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await resetPassword(email);

      if (error) {
        toast.error("Erreur lors de l'envoi de l'email");
        setLoading(false);
        return;
      }

      setEmailSent(true);
      toast.success('Email envoyé avec succès');
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('Une erreur est survenue');
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <CardTitle className="text-2xl">Email envoyé</CardTitle>
              <CardDescription>
                Un email de réinitialisation a été envoyé à{' '}
                <span className="font-medium">{email}</span>
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Consultez votre boîte de réception et cliquez sur le lien pour
              réinitialiser votre mot de passe.
            </p>
            <p className="text-xs text-gray-500 text-center">
              Si vous ne recevez pas l'email, vérifiez votre dossier spam.
            </p>

            <Link href="/auth/login">
              <Button variant="outline" className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                Retour à la connexion
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-[#b8933d] bg-opacity-10 flex items-center justify-center">
              <Mail className="h-8 w-8 text-[#b8933d]" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <CardTitle className="text-2xl">Mot de passe oublié</CardTitle>
            <CardDescription>
              Entrez votre email pour recevoir un lien de réinitialisation
            </CardDescription>
          </div>
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

            <Button
              type="submit"
              className="w-full bg-[#b8933d] hover:bg-[#a07c2f]"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                'Envoyer le lien'
              )}
            </Button>

            <Link href="/auth/login">
              <Button variant="ghost" className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                Retour à la connexion
              </Button>
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
