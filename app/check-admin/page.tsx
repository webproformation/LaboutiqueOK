"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase-client';
import { Loader2, CheckCircle2, XCircle, Shield, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CheckAdminPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [settingAdmin, setSettingAdmin] = useState(false);

  useEffect(() => {
    checkRole();
  }, [user]);

  const checkRole = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-user-role`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      setRole(result.role);
    } catch (error) {
      console.error('Error checking role:', error);
    } finally {
      setLoading(false);
    }
  };

  const setAsAdmin = async () => {
    if (!user) return;

    setSettingAdmin(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Non authentifié');
      }

      const response = await fetch('/api/admin/set-role', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          role: 'admin'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la définition du rôle');
      }

      toast.success('Rôle admin défini avec succès');
      checkRole();

      // Redirection vers l'admin après 1 seconde
      setTimeout(() => {
        window.location.href = '/admin';
      }, 1000);
    } catch (error) {
      console.error('Error setting admin role:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la définition du rôle');
    } finally {
      setSettingAdmin(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-16 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="w-6 h-6 text-red-600" />
              Non connecté
            </CardTitle>
            <CardDescription>
              Vous devez être connecté pour accéder à cette page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/auth/login'}>
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-16 px-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Vérification du statut administrateur
          </CardTitle>
          <CardDescription>
            Vérifiez et gérez vos permissions d'administration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">ID utilisateur</p>
                <p className="font-mono text-xs">{user.id}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Rôle actuel</p>
                <div className="mt-1">
                  {role === 'admin' ? (
                    <Badge className="bg-green-600">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Administrateur
                    </Badge>
                  ) : role === 'customer' ? (
                    <Badge variant="secondary">
                      Client
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      Aucun rôle
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {role === 'admin' ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Vous avez les droits administrateur. Vous pouvez accéder au panneau d'administration.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Vous n'avez pas les droits administrateur. Cliquez sur le bouton ci-dessous pour vous définir comme administrateur.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            {role !== 'admin' && (
              <Button
                onClick={setAsAdmin}
                disabled={settingAdmin}
                className="w-full"
              >
                {settingAdmin ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Définition en cours...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Me définir comme administrateur
                  </>
                )}
              </Button>
            )}

            {role === 'admin' && (
              <Button
                onClick={() => window.location.href = '/admin'}
                className="w-full"
              >
                Accéder au panneau d'administration
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
