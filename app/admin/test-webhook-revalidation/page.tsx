'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, Radio } from 'lucide-react';

export default function TestWebhookRevalidation() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testWebhook = async () => {
    setTesting(true);
    setResult(null);
    setError(null);

    try {
      // Test 1: Appeler directement l'API de revalidation
      const response = await fetch('/api/revalidate?path=/&secret=' + (process.env.NEXT_PUBLIC_WEBHOOK_SECRET || 'test'), {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors du test');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTesting(false);
    }
  };

  const testSupabaseWebhook = async () => {
    setTesting(true);
    setResult(null);
    setError(null);

    try {
      // Simuler un webhook depuis Supabase
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const webhookUrl = `${supabaseUrl}/functions/v1/webhook-revalidator`;

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table: 'home_slides',
          type: 'UPDATE',
          record: { id: 1, title: 'Test' }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du test webhook Supabase');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Test Webhooks Automatiques</h1>
          <p className="text-muted-foreground">
            Testez le système de revalidation automatique du cache Next.js
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              Vérifiez que les variables d'environnement sont configurées
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              {process.env.NEXT_PUBLIC_SUPABASE_URL ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span>NEXT_PUBLIC_SUPABASE_URL</span>
            </div>
            <div className="flex items-center gap-2">
              {process.env.NEXT_PUBLIC_WEBHOOK_SECRET ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span>WEBHOOK_SECRET (Note: doit être configuré côté serveur)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test 1: API de Revalidation</CardTitle>
            <CardDescription>
              Teste directement l'API route Next.js /api/revalidate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testWebhook} disabled={testing}>
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Test en cours...
                </>
              ) : (
                'Tester l\'API de Revalidation'
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test 2: Edge Function Webhook</CardTitle>
            <CardDescription>
              Teste l'Edge Function webhook-revalidator sur Supabase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testSupabaseWebhook} disabled={testing}>
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Test en cours...
                </>
              ) : (
                'Tester le Webhook Supabase'
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Alert className="border-green-600 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>Succès!</AlertTitle>
            <AlertDescription>
              <pre className="mt-2 text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Test en situation réelle</CardTitle>
            <CardDescription>
              Pour tester le système complet avec les triggers PostgreSQL
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <p className="font-semibold flex items-center gap-2">
                <Radio className="h-4 w-4" />
                Instructions:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Allez sur la page <a href="/admin/slides" className="text-blue-600 hover:underline">/admin/slides</a></li>
                <li>Modifiez un slider existant ou créez-en un nouveau</li>
                <li>Sauvegardez les modifications</li>
                <li>Attendez 1-2 secondes</li>
                <li>Ouvrez la page d'accueil dans un nouvel onglet</li>
                <li>Vos modifications devraient être visibles immédiatement</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tables surveillées</CardTitle>
            <CardDescription>
              Ces tables déclenchent automatiquement une revalidation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>home_slides</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>featured_products</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>delivery_batches</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>live_streams</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>guestbook_entries</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>customer_reviews</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>weekly_ambassadors</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>gift_thresholds</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <AlertTitle>Documentation</AlertTitle>
          <AlertDescription>
            Pour plus d'informations, consultez les fichiers:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><code>WEBHOOK_QUICKSTART.md</code> - Guide de démarrage rapide</li>
              <li><code>WEBHOOK_AUTO_REVALIDATION_SETUP.md</code> - Documentation complète</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
