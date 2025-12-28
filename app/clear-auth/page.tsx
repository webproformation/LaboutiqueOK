"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { clearSupabaseAuth } from '@/lib/auth-cleanup';

export default function ClearAuthPage() {
  const router = useRouter();
  const [cleared, setCleared] = useState(false);

  const handleClearAuth = () => {
    clearSupabaseAuth();
    setCleared(true);

    setTimeout(() => {
      router.push('/auth/login');
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Nettoyer l'authentification</CardTitle>
          <CardDescription>
            Si vous rencontrez des problèmes de connexion (erreur "Invalid Refresh Token"),
            cliquez sur le bouton ci-dessous pour nettoyer vos données d'authentification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!cleared ? (
            <>
              <div className="text-sm text-gray-600 space-y-2">
                <p>Cette action va :</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Supprimer les tokens d'authentification expirés</li>
                  <li>Nettoyer le cache local</li>
                  <li>Vous déconnecter automatiquement</li>
                </ul>
                <p className="mt-4 font-medium">
                  Vous devrez vous reconnecter après cette opération.
                </p>
              </div>
              <Button onClick={handleClearAuth} className="w-full">
                Nettoyer et déconnecter
              </Button>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-green-600 text-lg font-medium">
                ✓ Nettoyage effectué avec succès
              </div>
              <p className="text-sm text-gray-600">
                Redirection vers la page de connexion...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
