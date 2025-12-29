'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestAPIBypassPage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState<string | null>(null);

  const testEndpoint = async (name: string, url: string, options?: RequestInit) => {
    setLoading(name);
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      setResults((prev: any) => ({
        ...prev,
        [name]: {
          status: response.status,
          ok: response.ok,
          data
        }
      }));
    } catch (error: any) {
      setResults((prev: any) => ({
        ...prev,
        [name]: {
          status: 'ERROR',
          ok: false,
          error: error.message
        }
      }));
    } finally {
      setLoading(null);
    }
  };

  const tests = [
    {
      name: 'Profiles Direct Query',
      url: '/api/supabase/users',
      description: 'Test direct query to profiles table bypassing PostgREST'
    },
    {
      name: 'Get User Role Function',
      url: '/api/admin/set-role',
      description: 'Test RPC function to get user role',
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: '00000000-0000-0000-0000-000000000000',
          action: 'check'
        })
      }
    },
    {
      name: 'Cart Items',
      url: '/api/wishlist',
      description: 'Test cart items access'
    },
    {
      name: 'Delivery Batches',
      url: '/api/delivery-batches',
      description: 'Test delivery batches access'
    }
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Test API Bypass Routes</h1>
      <p className="mb-6 text-muted-foreground">
        Ces routes contournent le cache PostgREST en utilisant directement le client Supabase avec service_role
      </p>

      <div className="grid gap-4 mb-8">
        {tests.map((test) => (
          <Card key={test.name}>
            <CardHeader>
              <CardTitle className="text-lg">{test.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{test.description}</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <Button
                  onClick={() => testEndpoint(test.name, test.url, test.options)}
                  disabled={loading === test.name}
                >
                  {loading === test.name ? 'Testing...' : 'Test'}
                </Button>
                <code className="text-xs bg-muted px-2 py-1 rounded">{test.url}</code>
              </div>

              {results[test.name] && (
                <div className="mt-4">
                  <div className={`inline-block px-3 py-1 rounded mb-2 ${
                    results[test.name].ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    Status: {results[test.name].status}
                  </div>
                  <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-96">
                    {JSON.stringify(results[test.name].data || results[test.name].error, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Direct Database Test</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={async () => {
              setLoading('direct-db');
              try {
                const { createClient } = await import('@supabase/supabase-js');
                const supabase = createClient(
                  process.env.NEXT_PUBLIC_SUPABASE_URL!,
                  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                );

                // Test direct query
                const { data, error } = await supabase
                  .from('user_profiles')
                  .select('*')
                  .limit(1);

                setResults((prev: any) => ({
                  ...prev,
                  'direct-db': {
                    status: error ? 'ERROR' : 'SUCCESS',
                    ok: !error,
                    data: data || error
                  }
                }));
              } catch (error: any) {
                setResults((prev: any) => ({
                  ...prev,
                  'direct-db': {
                    status: 'ERROR',
                    ok: false,
                    error: error.message
                  }
                }));
              } finally {
                setLoading(null);
              }
            }}
            disabled={loading === 'direct-db'}
          >
            {loading === 'direct-db' ? 'Testing...' : 'Test Direct Client Query'}
          </Button>

          {results['direct-db'] && (
            <div className="mt-4">
              <div className={`inline-block px-3 py-1 rounded mb-2 ${
                results['direct-db'].ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                Status: {results['direct-db'].status}
              </div>
              <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(results['direct-db'].data || results['direct-db'].error, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
