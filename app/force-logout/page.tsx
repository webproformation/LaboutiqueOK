"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, LogOut, CheckCircle } from 'lucide-react';

export default function ForceLogoutPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    performForceLogout();
  }, []);

  const performForceLogout = async () => {
    try {
      setStep(1);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Étape 1 : Déconnexion Supabase
      setStep(2);
      await supabase.auth.signOut({ scope: 'global' });
      await new Promise(resolve => setTimeout(resolve, 500));

      // Étape 2 : Nettoyage localStorage
      setStep(3);
      localStorage.clear();
      sessionStorage.clear();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Étape 3 : Suppression des cookies
      setStep(4);
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      await new Promise(resolve => setTimeout(resolve, 500));

      // Étape 4 : Nettoyage des cookies Supabase spécifiques
      setStep(5);
      const cookies = [
        'sb-access-token',
        'sb-refresh-token',
        'supabase-auth-token',
        'sb-qcqbtmvbvipsxwjlgjvk-auth-token',
        'sb-qcqbtmvbvipsxwjlgjvk-auth-token.0',
        'sb-qcqbtmvbvipsxwjlgjvk-auth-token.1',
      ];

      cookies.forEach(cookie => {
        document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.laboutiquedemorgane.com`;
        document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=laboutiquedemorgane.com`;
        document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      });
      await new Promise(resolve => setTimeout(resolve, 500));

      setStep(6);
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (err) {
      console.error('Erreur lors du nettoyage:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  const handleReconnect = () => {
    // Force un rechargement complet pour vider tous les caches
    window.location.href = '/auth/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            {step < 6 ? (
              <LogOut className="h-6 w-6 text-amber-600 animate-pulse" />
            ) : (
              <CheckCircle className="h-6 w-6 text-green-600" />
            )}
            <CardTitle>
              {step < 6 ? 'Nettoyage en cours...' : 'Nettoyage terminé'}
            </CardTitle>
          </div>
          <CardDescription>
            {step < 6
              ? 'Suppression des données corrompues'
              : 'Votre session a été complètement réinitialisée'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div className="space-y-3">
            <StepItem
              stepNumber={1}
              currentStep={step}
              label="Démarrage du nettoyage"
            />
            <StepItem
              stepNumber={2}
              currentStep={step}
              label="Déconnexion Supabase"
            />
            <StepItem
              stepNumber={3}
              currentStep={step}
              label="Nettoyage localStorage"
            />
            <StepItem
              stepNumber={4}
              currentStep={step}
              label="Suppression des cookies"
            />
            <StepItem
              stepNumber={5}
              currentStep={step}
              label="Nettoyage cookies Supabase"
            />
            <StepItem
              stepNumber={6}
              currentStep={step}
              label="Finalisation"
            />
          </div>

          {step >= 6 && (
            <div className="pt-4">
              <Button
                onClick={handleReconnect}
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                Se reconnecter
              </Button>
              <p className="text-xs text-center text-gray-500 mt-3">
                Utilisez votre email <strong>gregory.demeulenaere@gmail.com</strong> pour vous reconnecter
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StepItem({
  stepNumber,
  currentStep,
  label
}: {
  stepNumber: number;
  currentStep: number;
  label: string;
}) {
  const isComplete = currentStep > stepNumber;
  const isCurrent = currentStep === stepNumber;

  return (
    <div className="flex items-center gap-3">
      <div className={`
        w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold
        ${isComplete ? 'bg-green-600 text-white' : ''}
        ${isCurrent ? 'bg-amber-600 text-white animate-pulse' : ''}
        ${!isComplete && !isCurrent ? 'bg-gray-200 text-gray-500' : ''}
      `}>
        {isComplete ? '✓' : stepNumber}
      </div>
      <span className={`text-sm ${isComplete || isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
        {label}
      </span>
    </div>
  );
}
