'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: any;
  time?: number;
}

export default function DiagnosticComplet() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [progress, setProgress] = useState(0);

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const updateProgress = (current: number, total: number) => {
    setProgress(Math.round((current / total) * 100));
  };

  const runAllTests = async () => {
    setTesting(true);
    setResults([]);
    setProgress(0);

    const tests = [
      testEnvironmentVariables,
      testSupabaseConnection,
      testSupabaseAuth,
      testDatabaseDirectAccess,
      testPostgRESTAPI,
      testAllTables,
      testRLSPolicies,
      testEdgeFunctions,
      testStorageAccess,
      testRealtimeConnection,
    ];

    for (let i = 0; i < tests.length; i++) {
      await tests[i]();
      updateProgress(i + 1, tests.length);
    }

    setTesting(false);
  };

  const testEnvironmentVariables = async () => {
    const startTime = Date.now();
    try {
      const envVars = {
        'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
        'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'NEXT_PUBLIC_WORDPRESS_API_URL': process.env.NEXT_PUBLIC_WORDPRESS_API_URL,
        'NEXT_PUBLIC_ONESIGNAL_APP_ID': process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
      };

      const missing = Object.entries(envVars)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

      if (missing.length > 0) {
        addResult({
          name: 'Variables d\'environnement',
          status: 'error',
          message: `${missing.length} variable(s) manquante(s)`,
          details: missing,
          time: Date.now() - startTime,
        });
      } else {
        addResult({
          name: 'Variables d\'environnement',
          status: 'success',
          message: 'Toutes les variables sont définies',
          details: Object.keys(envVars),
          time: Date.now() - startTime,
        });
      }
    } catch (error: any) {
      addResult({
        name: 'Variables d\'environnement',
        status: 'error',
        message: error.message,
        time: Date.now() - startTime,
      });
    }
  };

  const testSupabaseConnection = async () => {
    const startTime = Date.now();
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });

      if (error) throw error;

      addResult({
        name: 'Connexion Supabase',
        status: 'success',
        message: 'Connexion établie avec succès',
        details: { url: process.env.NEXT_PUBLIC_SUPABASE_URL },
        time: Date.now() - startTime,
      });
    } catch (error: any) {
      addResult({
        name: 'Connexion Supabase',
        status: 'error',
        message: error.message,
        details: error,
        time: Date.now() - startTime,
      });
    }
  };

  const testSupabaseAuth = async () => {
    const startTime = Date.now();
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getSession();

      if (error) throw error;

      addResult({
        name: 'Authentification Supabase',
        status: data.session ? 'success' : 'warning',
        message: data.session ? `Utilisateur connecté: ${data.session.user.email}` : 'Aucun utilisateur connecté',
        details: data.session ? { userId: data.session.user.id, email: data.session.user.email } : null,
        time: Date.now() - startTime,
      });
    } catch (error: any) {
      addResult({
        name: 'Authentification Supabase',
        status: 'error',
        message: error.message,
        time: Date.now() - startTime,
      });
    }
  };

  const testDatabaseDirectAccess = async () => {
    const startTime = Date.now();
    try {
      const supabase = createClient();

      const { data, error } = await supabase.rpc('get_loyalty_tier', { user_uuid: '00000000-0000-0000-0000-000000000000' });

      if (error && !error.message.includes('does not exist')) {
        throw error;
      }

      addResult({
        name: 'Accès direct base de données (RPC)',
        status: error ? 'warning' : 'success',
        message: error ? `Fonction non trouvée (normal si pas de données)` : 'Accès RPC fonctionnel',
        details: { error: error?.message, data },
        time: Date.now() - startTime,
      });
    } catch (error: any) {
      addResult({
        name: 'Accès direct base de données (RPC)',
        status: 'error',
        message: error.message,
        time: Date.now() - startTime,
      });
    }
  };

  const testPostgRESTAPI = async () => {
    const startTime = Date.now();
    try {
      const supabase = createClient();

      const tables = [
        'profiles',
        'cart_items',
        'loyalty_points',
        'home_slides',
        'home_categories',
        'user_roles',
        'scratch_game_settings',
        'wheel_game_settings',
        'wishlist_items',
        'delivery_batches',
      ];

      const results = await Promise.all(
        tables.map(async (table) => {
          try {
            const { error } = await supabase.from(table).select('id').limit(1);
            return { table, success: !error, error: error?.message };
          } catch (e: any) {
            return { table, success: false, error: e.message };
          }
        })
      );

      const failed = results.filter(r => !r.success);

      if (failed.length > 0) {
        addResult({
          name: 'PostgREST API (Tables)',
          status: 'error',
          message: `${failed.length}/${tables.length} tables inaccessibles`,
          details: failed,
          time: Date.now() - startTime,
        });
      } else {
        addResult({
          name: 'PostgREST API (Tables)',
          status: 'success',
          message: `${tables.length}/${tables.length} tables accessibles`,
          details: results,
          time: Date.now() - startTime,
        });
      }
    } catch (error: any) {
      addResult({
        name: 'PostgREST API (Tables)',
        status: 'error',
        message: error.message,
        time: Date.now() - startTime,
      });
    }
  };

  const testAllTables = async () => {
    const startTime = Date.now();
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        addResult({
          name: 'PostgREST Schema Cache',
          status: 'success',
          message: 'Cache PostgREST accessible',
          details: { status: response.status, tables: data?.definitions ? Object.keys(data.definitions).length : 'N/A' },
          time: Date.now() - startTime,
        });
      } else {
        addResult({
          name: 'PostgREST Schema Cache',
          status: 'error',
          message: `HTTP ${response.status}: ${response.statusText}`,
          details: await response.text(),
          time: Date.now() - startTime,
        });
      }
    } catch (error: any) {
      addResult({
        name: 'PostgREST Schema Cache',
        status: 'error',
        message: error.message,
        time: Date.now() - startTime,
      });
    }
  };

  const testRLSPolicies = async () => {
    const startTime = Date.now();
    try {
      const supabase = createClient();

      const testCases = [
        { table: 'profiles', operation: 'select', shouldWork: true },
        { table: 'cart_items', operation: 'select', shouldWork: true },
        { table: 'home_slides', operation: 'select', shouldWork: true },
        { table: 'home_categories', operation: 'select', shouldWork: true },
      ];

      const results = await Promise.all(
        testCases.map(async (test) => {
          try {
            const { data, error } = await supabase.from(test.table).select('*').limit(1);
            const success = test.shouldWork ? !error : !!error;
            return {
              ...test,
              result: success ? 'OK' : 'FAIL',
              error: error?.message,
              status: success ? 'success' : 'error'
            };
          } catch (e: any) {
            return { ...test, result: 'ERROR', error: e.message, status: 'error' };
          }
        })
      );

      const failed = results.filter(r => r.status === 'error');

      addResult({
        name: 'Politiques RLS',
        status: failed.length > 0 ? 'warning' : 'success',
        message: `${results.length - failed.length}/${results.length} tests passés`,
        details: results,
        time: Date.now() - startTime,
      });
    } catch (error: any) {
      addResult({
        name: 'Politiques RLS',
        status: 'error',
        message: error.message,
        time: Date.now() - startTime,
      });
    }
  };

  const testEdgeFunctions = async () => {
    const startTime = Date.now();
    try {
      const testUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/debug-env`;

      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        addResult({
          name: 'Edge Functions',
          status: 'success',
          message: 'Edge functions accessibles',
          details: data,
          time: Date.now() - startTime,
        });
      } else {
        addResult({
          name: 'Edge Functions',
          status: 'warning',
          message: `HTTP ${response.status}: ${response.statusText}`,
          details: await response.text().catch(() => 'No response body'),
          time: Date.now() - startTime,
        });
      }
    } catch (error: any) {
      addResult({
        name: 'Edge Functions',
        status: 'warning',
        message: error.message,
        time: Date.now() - startTime,
      });
    }
  };

  const testStorageAccess = async () => {
    const startTime = Date.now();
    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage.listBuckets();

      if (error) throw error;

      addResult({
        name: 'Storage Supabase',
        status: 'success',
        message: `${data.length} bucket(s) trouvé(s)`,
        details: data.map(b => b.name),
        time: Date.now() - startTime,
      });
    } catch (error: any) {
      addResult({
        name: 'Storage Supabase',
        status: 'warning',
        message: error.message,
        time: Date.now() - startTime,
      });
    }
  };

  const testRealtimeConnection = async () => {
    const startTime = Date.now();
    try {
      const supabase = createClient();

      const channel = supabase.channel('test-channel');

      const subscribed = await new Promise((resolve) => {
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            resolve(true);
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            resolve(false);
          }
        });

        setTimeout(() => resolve(false), 5000);
      });

      await supabase.removeChannel(channel);

      addResult({
        name: 'Realtime Connection',
        status: subscribed ? 'success' : 'warning',
        message: subscribed ? 'Connexion Realtime établie' : 'Connexion Realtime échouée',
        time: Date.now() - startTime,
      });
    } catch (error: any) {
      addResult({
        name: 'Realtime Connection',
        status: 'warning',
        message: error.message,
        time: Date.now() - startTime,
      });
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'border-green-500 bg-green-50';
      case 'error':
        return 'border-red-500 bg-red-50';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const summary = {
    total: results.length,
    success: results.filter(r => r.status === 'success').length,
    error: results.filter(r => r.status === 'error').length,
    warning: results.filter(r => r.status === 'warning').length,
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Diagnostic Complet du Système</h1>
            <p className="text-gray-600 mt-2">
              Test de tous les composants : Connexions, API, Base de données, Cache PostgREST
            </p>
          </div>
          <Button
            onClick={runAllTests}
            disabled={testing}
            size="lg"
            className="gap-2"
          >
            {testing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Test en cours... {progress}%
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5" />
                Lancer tous les tests
              </>
            )}
          </Button>
        </div>

        {results.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Résumé</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-700">{summary.total}</div>
                  <div className="text-sm text-gray-500">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{summary.success}</div>
                  <div className="text-sm text-gray-500">Succès</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">{summary.warning}</div>
                  <div className="text-sm text-gray-500">Avertissements</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{summary.error}</div>
                  <div className="text-sm text-gray-500">Erreurs</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {results.map((result, index) => (
            <Card key={index} className={`border-l-4 ${getStatusColor(result.status)}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{result.name}</h3>
                      <p className="text-gray-700 mt-1">{result.message}</p>
                      {result.time && (
                        <p className="text-sm text-gray-500 mt-1">
                          Temps d'exécution: {result.time}ms
                        </p>
                      )}
                      {result.details && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                            Voir les détails
                          </summary>
                          <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-64">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {results.length === 0 && !testing && (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Aucun test exécuté
              </h3>
              <p className="text-gray-500">
                Cliquez sur "Lancer tous les tests" pour commencer le diagnostic
              </p>
            </CardContent>
          </Card>
        )}

        {testing && (
          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Progression</span>
                    <span className="text-sm text-gray-500">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Actions recommandées si erreurs 404
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                <strong>Redémarrer le projet Supabase :</strong>
                <br />
                <span className="text-gray-600 ml-5">
                  Dashboard → Settings → General → Pause project → Attendre 30s → Resume project
                </span>
              </li>
              <li>
                <strong>Vider le cache PostgREST :</strong>
                <br />
                <span className="text-gray-600 ml-5">
                  Le redémarrage force PostgREST à recharger toutes les tables
                </span>
              </li>
              <li>
                <strong>Vérifier les variables d'environnement :</strong>
                <br />
                <span className="text-gray-600 ml-5">
                  Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont correctes
                </span>
              </li>
              <li>
                <strong>Tester après redémarrage :</strong>
                <br />
                <span className="text-gray-600 ml-5">
                  Attendez 2-3 minutes puis relancez ce diagnostic
                </span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
