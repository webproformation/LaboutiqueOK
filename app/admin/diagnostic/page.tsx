'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, RefreshCw, TestTube, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

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

      <Card>
        <CardHeader>
          <CardTitle>Tests Spécifiques</CardTitle>
          <CardDescription>
            Testez individuellement des fonctionnalités critiques
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/admin/test-categories-cache">
              <div className="border rounded-lg p-4 hover:bg-accent hover:border-primary transition-colors cursor-pointer h-full">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TestTube className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold mb-1">Test Cache Catégories</p>
                    <p className="text-sm text-muted-foreground">
                      Testez l'API de cache WooCommerce categories (GET et POST)
                    </p>
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        /api/categories-cache
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/admin/test-sync-config">
              <div className="border rounded-lg p-4 hover:bg-accent hover:border-primary transition-colors cursor-pointer h-full">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Settings className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold mb-1">Test Configuration Sync</p>
                    <p className="text-sm text-muted-foreground">
                      Vérifiez la configuration de sync-products et variables d'environnement
                    </p>
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        /api/admin/sync-products
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <Alert className="mt-4">
            <AlertDescription className="text-sm">
              <strong>Astuce:</strong> Ces tests incluent des logs détaillés pour identifier précisément
              où se produisent les erreurs 500. Consultez les logs serveur pendant les tests.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Résumé du Diagnostic</CardTitle>
              <CardDescription>
                {results.filter(r => r.status === 'success').length} réussis / {results.length} tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 bg-green-50">
                  <p className="text-sm text-muted-foreground mb-1">Réussis</p>
                  <p className="text-3xl font-bold text-green-600">
                    {results.filter(r => r.status === 'success').length}
                  </p>
                </div>
                <div className="border rounded-lg p-4 bg-red-50">
                  <p className="text-sm text-muted-foreground mb-1">Erreurs</p>
                  <p className="text-3xl font-bold text-red-600">
                    {results.filter(r => r.status === 'error').length}
                  </p>
                </div>
                <div className="border rounded-lg p-4 bg-yellow-50">
                  <p className="text-sm text-muted-foreground mb-1">Avertissements</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {results.filter(r => r.status === 'warning').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clés de Connexion */}
          {results.some(r => r.name.includes('KEY') || r.name.includes('URL') || r.name.includes('CLIENT_ID') || r.name.includes('API_KEY')) && (
            <Card>
              <CardHeader>
                <CardTitle>Clés de Connexion</CardTitle>
                <CardDescription>Variables d'environnement configurées</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.filter(r => r.name.includes('KEY') || r.name.includes('URL') || r.name.includes('CLIENT_ID') || r.name.includes('API_KEY')).map((result, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(result.status)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium font-mono text-sm">{result.name}</span>
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

          {/* Supabase */}
          {results.some(r => r.name.includes('Supabase')) && (
            <Card>
              <CardHeader>
                <CardTitle>Supabase</CardTitle>
                <CardDescription>Tests de connexion et API</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.filter(r => r.name.includes('Supabase')).map((result, index) => (
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

          {/* Base de données */}
          {results.some(r => r.name.includes('Table') || r.name.includes('RPC')) && (
            <Card>
              <CardHeader>
                <CardTitle>Base de Données</CardTitle>
                <CardDescription>Tables et fonctions RPC</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.filter(r => r.name.includes('Table') || r.name.includes('RPC')).map((result, index) => (
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

          {/* WordPress */}
          {results.some(r => r.name.includes('WordPress')) && (
            <Card>
              <CardHeader>
                <CardTitle>WordPress</CardTitle>
                <CardDescription>GraphQL, utilisateurs et actualités</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.filter(r => r.name.includes('WordPress')).map((result, index) => (
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

          {/* WooCommerce */}
          {results.some(r => r.name.includes('WooCommerce')) && (
            <Card>
              <CardHeader>
                <CardTitle>WooCommerce</CardTitle>
                <CardDescription>Produits, clients, commandes et livraison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.filter(r => r.name.includes('WooCommerce')).map((result, index) => (
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
        </>
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
              <p className="font-semibold text-red-900 text-lg">🚨 Cache PostgREST Complètement Bloqué</p>
              <p className="text-sm text-red-800">
                Le cache PostgREST est dans un état irréversible. Plus de 100 tentatives de rafraîchissement ont échoué.
                Même les nouvelles tables et fonctions créées ne sont pas détectées.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => window.location.href = '/admin/restart-postgrest'}
                >
                  Voir Instructions de Redémarrage
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open('https://supabase.com/dashboard/project/qcqbtmvbvipsxwjlgjvk', '_blank')}
                >
                  Dashboard Supabase
                </Button>
              </div>
              <p className="text-xs text-red-700 border-t border-red-200 pt-2">
                ⚠️ IMPORTANT: Aucun bouton ou webhook ne peut débloquer cette situation.
                Seul un redémarrage complet de l'instance Supabase résoudra le problème.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
