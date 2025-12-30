'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export default function DiagnosticPage() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [reloading, setReloading] = useState(false);

  const runDiagnostic = async () => {
    setTesting(true);
    setResults([]);

    try {
      // Appeler l'API route qui fait les tests côté serveur
      const response = await fetch('/api/admin/diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'all' })
      });

      const data = await response.json();
      setResults(data.results || []);
    } catch (error: any) {
      setResults([{
        name: 'Erreur de connexion',
        status: 'error',
        message: error.message || 'Impossible de se connecter au serveur'
      }]);
    } finally {
      setTesting(false);
    }
  };

  const forcePostgrestReload = async () => {
    setReloading(true);
    try {
      const response = await fetch('/api/admin/force-postgrest-reload', {
        method: 'POST'
      });
      const data = await response.json();
      alert(data.message || 'Cache PostgREST rechargé');
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    } finally {
      setReloading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'success') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === 'error') return <XCircle className="h-5 w-5 text-red-500" />;
    return <XCircle className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary"> = {
      success: 'default',
      error: 'destructive',
      warning: 'secondary'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Diagnostic Système</h1>
        <p className="text-muted-foreground mt-2">
          Vérification complète de la configuration et des connexions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration Actuelle</CardTitle>
          <CardDescription>
            Environnement de production
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <p className="font-semibold mb-1">Site Principal</p>
              <p className="text-sm text-muted-foreground">www.laboutiquedemorgane.com</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="font-semibold mb-1">WordPress</p>
              <p className="text-sm text-muted-foreground">wp.laboutiquedemorgane.com</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="font-semibold mb-1">Supabase</p>
              <p className="text-sm text-muted-foreground">qcqbtmvbvipsxwjlgjvk</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={runDiagnostic} disabled={testing} size="lg">
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Test en cours...
                </>
              ) : (
                'Lancer le Diagnostic Complet'
              )}
            </Button>

            <Button onClick={forcePostgrestReload} disabled={reloading} variant="outline" size="lg">
              {reloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rechargement...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Recharger Cache PostgREST
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Résultats du Diagnostic</CardTitle>
            <CardDescription>
              {results.filter(r => r.status === 'success').length} réussis / {results.length} tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{result.name}</span>
                        {getStatusBadge(result.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{result.message}</p>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                            Voir les détails
                          </summary>
                          <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-auto max-h-96">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {results.length === 0 && !testing && (
        <Alert>
          <AlertDescription>
            Cliquez sur "Lancer le Diagnostic Complet" pour tester toutes les connexions et configurations.
          </AlertDescription>
        </Alert>
      )}

      {results.some(r => r.message.includes('schema cache')) && (
        <Alert className="border-red-500 bg-red-50">
          <AlertDescription>
            <div className="space-y-3">
              <p className="font-semibold text-red-900">⚠️ Cache PostgREST Bloqué</p>
              <p className="text-sm text-red-800">
                Les erreurs "schema cache" indiquent que le cache PostgREST ne se rafraîchit pas.
                Les tables et fonctions RPC existent mais ne sont pas détectées.
              </p>
              <div className="bg-white p-3 rounded border border-red-200">
                <p className="font-semibold text-sm mb-2 text-red-900">Solution :</p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-red-800">
                  <li>Aller sur le <a href="https://supabase.com/dashboard/project/qcqbtmvbvipsxwjlgjvk" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Dashboard Supabase</a></li>
                  <li>Project Settings → General → "Pause project"</li>
                  <li>Attendre 1 minute</li>
                  <li>Cliquer sur "Resume project"</li>
                  <li>Attendre 2-3 minutes que le serveur redémarre</li>
                  <li>Relancer ce diagnostic</li>
                </ol>
              </div>
              <p className="text-xs text-red-700">
                Le bouton "Recharger Cache PostgREST" ne suffit pas dans ce cas. Un redémarrage complet est nécessaire.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
