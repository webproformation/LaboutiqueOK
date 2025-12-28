'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

export default function ForcePostgRESTReload() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const testDirectAccess = async () => {
    setLoading(true);
    setResults([]);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Test 1: Schema introspection endpoint
    try {
      const schemaRes = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': anonKey!,
          'Authorization': `Bearer ${anonKey}`,
        },
      });

      const data = schemaRes.ok ? await schemaRes.json() : await schemaRes.text();

      setResults(prev => [...prev, {
        test: 'Schema Introspection',
        status: schemaRes.ok ? 'success' : 'error',
        code: schemaRes.status,
        data: data,
      }]);
    } catch (error: any) {
      setResults(prev => [...prev, {
        test: 'Schema Introspection',
        status: 'error',
        error: error.message,
      }]);
    }

    // Test 2: Direct table access with raw fetch
    const tables = ['profiles', 'home_slides', 'home_categories', 'cart_items', 'wishlist_items'];

    for (const table of tables) {
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/${table}?select=id&limit=1`, {
          headers: {
            'apikey': anonKey!,
            'Authorization': `Bearer ${anonKey}`,
            'Prefer': 'return=representation',
          },
        });

        const data = res.ok ? await res.json() : await res.text();

        setResults(prev => [...prev, {
          test: `Table: ${table}`,
          status: res.ok ? 'success' : 'error',
          code: res.status,
          data: data,
        }]);
      } catch (error: any) {
        setResults(prev => [...prev, {
          test: `Table: ${table}`,
          status: 'error',
          error: error.message,
        }]);
      }
    }

    // Test 3: Check RPC endpoint
    try {
      const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/get_loyalty_tier`, {
        method: 'POST',
        headers: {
          'apikey': anonKey!,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_uuid: '00000000-0000-0000-0000-000000000000' }),
      });

      const rpcData = rpcRes.ok ? await rpcRes.json() : await rpcRes.text();

      setResults(prev => [...prev, {
        test: 'RPC: get_loyalty_tier',
        status: rpcRes.ok ? 'success' : 'error',
        code: rpcRes.status,
        data: rpcData,
      }]);
    } catch (error: any) {
      setResults(prev => [...prev, {
        test: 'RPC: get_loyalty_tier',
        status: 'error',
        error: error.message,
      }]);
    }

    setLoading(false);
  };

  return (
    <div className="container mx-auto py-8 px-4 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Direct PostgREST</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Ce test accède directement à l'API PostgREST pour diagnostiquer le problème de cache.
            </p>
            <Button
              onClick={testDirectAccess}
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Test en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Tester PostgREST
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((result, index) => (
              <Card key={index} className={result.status === 'success' ? 'border-green-500' : 'border-red-500'}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {result.status === 'success' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mt-1" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold">{result.test}</h3>
                      {result.code && (
                        <p className="text-sm text-gray-600">HTTP {result.code}</p>
                      )}
                      {result.error && (
                        <p className="text-sm text-red-600 mt-1">{result.error}</p>
                      )}
                      {result.data && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-blue-600">
                            Voir la réponse
                          </summary>
                          <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-64">
                            {typeof result.data === 'string'
                              ? result.data
                              : JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="mt-6 bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">Solution si le cache PostgREST ne se recharge pas</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Contactez le support Supabase via le Dashboard</li>
              <li>Demandez un "hard restart" du service PostgREST</li>
              <li>Mentionnez: "PostgREST schema cache not refreshing after migrations"</li>
              <li>Alternative: Créez un nouveau projet Supabase et migrez les données</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
