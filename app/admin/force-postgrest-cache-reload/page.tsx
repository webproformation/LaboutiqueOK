'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase-client';

export default function ForcePostgrestCacheReloadPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const forceReload = async () => {
    setLoading(true);
    setResult(null);

    try {
      const supabase = createClient();

      // Méthode 1 : Via SQL NOTIFY
      const { error: notifyError } = await supabase.rpc('force_postgrest_reload' as any);

      if (notifyError) {
        // Si la fonction n'existe pas, créer la commande SQL directement
        const { error: sqlError } = await supabase.rpc('execute_sql', {
          query: `
            NOTIFY pgrst, 'reload schema';
            NOTIFY pgrst, 'reload config';
          `
        } as any);

        if (sqlError) {
          throw new Error(`Erreur lors du rechargement : ${sqlError.message}`);
        }
      }

      setResult({
        type: 'success',
        message: 'Cache PostgREST rechargé avec succès ! Le schéma a été actualisé. Attendez 10-30 secondes pour que les changements prennent effet.'
      });

      // Test de vérification après 5 secondes
      setTimeout(async () => {
        try {
          const { data, error } = await supabase.from('user_profiles').select('count').limit(1);

          if (!error) {
            setResult({
              type: 'success',
              message: 'Cache PostgREST rechargé et vérifié avec succès ! Le schéma est à jour et fonctionnel.'
            });
          }
        } catch (e) {
          // Ignore les erreurs de vérification
        }
      }, 5000);

    } catch (error: any) {
      console.error('Erreur lors du rechargement du cache PostgREST:', error);
      setResult({
        type: 'error',
        message: `Erreur : ${error.message}. Essayez d'exécuter manuellement dans l'éditeur SQL Supabase : NOTIFY pgrst, 'reload schema';`
      });
    } finally {
      setLoading(false);
    }
  };

  const testSupabaseConnection = async () => {
    setLoading(true);
    setResult(null);

    try {
      const supabase = createClient();

      // Vérifier les variables d'environnement
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const isCorrectUrl = supabaseUrl.includes('qcqbtmvbvipsxwjlgjvk');

      if (!isCorrectUrl) {
        setResult({
          type: 'error',
          message: `❌ URL Supabase incorrecte détectée ! URL actuelle : ${supabaseUrl}. Doit contenir : qcqbtmvbvipsxwjlgjvk`
        });
        setLoading(false);
        return;
      }

      // Tester une requête simple
      const { data, error } = await supabase.from('user_profiles').select('count').limit(1);

      if (error) {
        setResult({
          type: 'error',
          message: `Erreur de connexion : ${error.message}. Code : ${error.code}`
        });
      } else {
        setResult({
          type: 'success',
          message: `✅ Connexion Supabase OK ! URL : ${supabaseUrl.substring(0, 40)}...`
        });
      }
    } catch (error: any) {
      setResult({
        type: 'error',
        message: `Erreur : ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Forcer le rechargement du cache PostgREST</h1>
          <p className="text-muted-foreground mt-2">
            Utilisez cet outil pour forcer Supabase à recharger le schéma de la base de données et les politiques RLS.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Actions de maintenance
            </CardTitle>
            <CardDescription>
              Choisissez une action pour diagnostiquer ou résoudre les problèmes de cache
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">1. Tester la connexion Supabase</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Vérifie que l'URL et les clés Supabase sont correctes et que la connexion fonctionne.
                </p>
                <Button
                  onClick={testSupabaseConnection}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Test en cours...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Tester la connexion
                    </>
                  )}
                </Button>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">2. Forcer le rechargement du cache</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Force PostgREST à recharger le schéma de la base de données. Utilisez cette option si vous avez :
                </p>
                <ul className="text-sm text-muted-foreground mb-3 list-disc list-inside space-y-1">
                  <li>Erreurs 404 sur des tables/fonctions qui existent</li>
                  <li>Erreurs 400 sur des requêtes valides</li>
                  <li>Anciennes politiques RLS appliquées</li>
                  <li>Modifications de schéma non prises en compte</li>
                </ul>
                <Button
                  onClick={forceReload}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Rechargement en cours...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Forcer le rechargement
                    </>
                  )}
                </Button>
              </div>
            </div>

            {result && (
              <Alert variant={result.type === 'error' ? 'destructive' : 'default'} className="mt-4">
                {result.type === 'success' && <CheckCircle className="h-4 w-4" />}
                {result.type === 'error' && <XCircle className="h-4 w-4" />}
                {result.type === 'info' && <AlertCircle className="h-4 w-4" />}
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Solution manuelle (si l'outil ne fonctionne pas)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Méthode 1 : Via l'éditeur SQL Supabase</h4>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>Aller sur <a href="https://supabase.com/dashboard/project/qcqbtmvbvipsxwjlgjvk/sql/new" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">l'éditeur SQL Supabase</a></li>
                <li>Coller ce code :</li>
              </ol>
              <pre className="bg-slate-100 p-3 rounded-md text-sm mt-2 overflow-x-auto">
{`NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';`}
              </pre>
              <ol className="text-sm space-y-2 list-decimal list-inside mt-2" start={3}>
                <li>Cliquer sur "Run"</li>
                <li>Attendre 30 secondes</li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Méthode 2 : Redémarrer le serveur PostgREST</h4>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>Aller sur <a href="https://supabase.com/dashboard/project/qcqbtmvbvipsxwjlgjvk/settings/api" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Settings → API</a></li>
                <li>Cliquer sur "Restart Server" (si disponible)</li>
                <li>Ou attendre 5 minutes pour un redémarrage automatique</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Informations sur le cache</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p>
              <strong>Où se trouve le cache PostgREST ?</strong> Sur le serveur Supabase, pas dans votre navigateur ni sur Vercel.
            </p>
            <p>
              <strong>Que cache-t-il ?</strong> Le schéma de la base de données, les politiques RLS, et les fonctions RPC disponibles.
            </p>
            <p>
              <strong>Quand le recharger ?</strong> Après des migrations, des modifications de RLS, ou si vous rencontrez des erreurs 404/400 inexpliquées.
            </p>
            <p>
              <strong>Combien de temps ça prend ?</strong> Le rechargement est immédiat, mais la propagation peut prendre 10-30 secondes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
