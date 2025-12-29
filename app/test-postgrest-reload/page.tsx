'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase-client';

export default function TestPostgrestReloadPage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (name: string, testFn: () => Promise<any>) => {
    try {
      const result = await testFn();
      setResults((prev: any) => ({
        ...prev,
        [name]: { success: true, data: result }
      }));
    } catch (error: any) {
      setResults((prev: any) => ({
        ...prev,
        [name]: { success: false, error: error.message }
      }));
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setResults({});

    // Test 1: Profiles table
    await testEndpoint('profiles_table', async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);
      if (error) throw error;
      return data;
    });

    // Test 2: Cart items table
    await testEndpoint('cart_items_table', async () => {
      const { data, error } = await supabase
        .from('cart_items')
        .select('id')
        .limit(1);
      if (error) throw error;
      return data;
    });

    // Test 3: Wishlist items table
    await testEndpoint('wishlist_items_table', async () => {
      const { data, error } = await supabase
        .from('wishlist_items')
        .select('id')
        .limit(1);
      if (error) throw error;
      return data;
    });

    // Test 4: Loyalty points table
    await testEndpoint('loyalty_points_table', async () => {
      const { data, error } = await supabase
        .from('loyalty_points')
        .select('id')
        .limit(1);
      if (error) throw error;
      return data;
    });

    // Test 5: Delivery batches table
    await testEndpoint('delivery_batches_table', async () => {
      const { data, error } = await supabase
        .from('delivery_batches')
        .select('id')
        .limit(1);
      if (error) throw error;
      return data;
    });

    // Test 6: Page visits table
    await testEndpoint('page_visits_table', async () => {
      const { data, error } = await supabase
        .from('page_visits')
        .select('id')
        .limit(1);
      if (error) throw error;
      return data;
    });

    // Test 7: RPC get_user_role
    await testEndpoint('rpc_get_user_role', async () => {
      const { data, error } = await supabase
        .rpc('get_user_role', { p_user_id: '00000000-0000-0000-0000-000000000000' });
      if (error) throw error;
      return data;
    });

    // Test 8: RPC get_loyalty_tier
    await testEndpoint('rpc_get_loyalty_tier', async () => {
      const { data, error } = await supabase
        .rpc('get_loyalty_tier', { p_user_id: '00000000-0000-0000-0000-000000000000' });
      if (error) throw error;
      return data;
    });

    // Test 9: Direct HTTP with anti-cache headers
    await testEndpoint('direct_http_profiles', async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_profiles?select=id&limit=1`,
        {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
          cache: 'no-store'
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return {
        status: response.status,
        headers: {
          'cache-control': response.headers.get('cache-control'),
          'etag': response.headers.get('etag'),
          'age': response.headers.get('age'),
        },
        data: await response.json()
      };
    });

    setLoading(false);
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Test PostgREST Cache Reload</CardTitle>
          <CardDescription>
            Vérifier si PostgREST a bien rechargé son schéma après les migrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runAllTests} disabled={loading}>
            {loading ? 'Tests en cours...' : 'Lancer tous les tests'}
          </Button>

          {Object.keys(results).length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Résultats:</h3>
              {Object.entries(results).map(([name, result]: [string, any]) => (
                <Alert key={name} variant={result.success ? 'default' : 'destructive'}>
                  <AlertDescription>
                    <strong>{name}:</strong>{' '}
                    {result.success ? (
                      <span className="text-green-600">✓ Success</span>
                    ) : (
                      <span className="text-red-600">✗ {result.error}</span>
                    )}
                    {result.success && result.data && (
                      <pre className="mt-2 text-xs overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
