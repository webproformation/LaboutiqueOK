'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestWooApiPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testWooCommerceConnection = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/woocommerce/categories?refresh=true');
      const data = await response.json();

      if (!response.ok) {
        setError(JSON.stringify(data, null, 2));
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testDirect = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const consumerKey = 'ck_d620ae1f9fcd1832bdb2c31fe3ad8362a9de8b28';
      const consumerSecret = 'cs_f452fc79440e83b64d6c3a0c712d51c91c8dd5a4';
      const wordpressUrl = 'https://wp.laboutiquedemorgane.com';

      const auth = btoa(`${consumerKey}:${consumerSecret}`);
      const testUrl = `${wordpressUrl}/wp-json/wc/v3/products/categories?per_page=10`;

      const response = await fetch(testUrl, {
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(JSON.stringify(data, null, 2));
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Test WooCommerce API</h1>

      <div className="space-y-4">
        <Button onClick={testWooCommerceConnection} disabled={loading}>
          {loading ? 'Testing...' : 'Test via Next.js API'}
        </Button>

        <Button onClick={testDirect} disabled={loading} variant="outline">
          {loading ? 'Testing...' : 'Test Direct Connection'}
        </Button>
      </div>

      {error && (
        <Card className="mt-8 border-red-500">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm">{error}</pre>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="mt-8 border-green-500">
          <CardHeader>
            <CardTitle className="text-green-600">Success</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm max-h-96 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
