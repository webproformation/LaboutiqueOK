'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function TestSyncConfigPage() {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkConfig = async () => {
    setLoading(true);
    setError(null);
    setConfig(null);

    try {
      const response = await fetch('/api/admin/sync-products', {
        method: 'GET',
      });

      const data = await response.json();

      if (response.ok) {
        setConfig(data);
        if (data.ready) {
          toast.success('Configuration valide');
        } else {
          toast.warning('Configuration incomplète');
        }
      } else {
        setError(data.error || 'Erreur lors de la vérification');
        toast.error('Erreur de configuration');
      }
    } catch (err: any) {
      console.error('Test config error:', err);
      setError(err.message || 'Erreur inattendue');
      toast.error('Impossible de contacter l\'API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Test Configuration Sync Products</h1>
        <p className="text-muted-foreground">
          Vérifiez que toutes les variables d'environnement sont correctement configurées
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Variables d'Environnement</CardTitle>
          <CardDescription>
            Cliquez sur le bouton pour vérifier la configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={checkConfig} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Vérifier la Configuration
          </Button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Erreur</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {config && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg flex items-center gap-3 ${
                config.ready
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                {config.ready ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                )}
                <div>
                  <p className="font-medium">
                    {config.ready
                      ? 'Configuration Complète ✓'
                      : 'Configuration Incomplète'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {config.ready
                      ? 'Toutes les variables sont configurées'
                      : 'Certaines variables manquent'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Détails:</h3>
                <div className="space-y-2">
                  {Object.entries(config.configuration).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-mono">{key}</span>
                      <div className="flex items-center gap-2">
                        {value === 'MISSING' ? (
                          <>
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="text-sm text-red-600 font-medium">MANQUANT</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-gray-600">{value as string}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {!config.ready && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Action requise:</strong> Configurez les variables d'environnement manquantes dans votre fichier .env
                  </p>
                  <ul className="mt-2 text-sm text-blue-800 list-disc list-inside space-y-1">
                    <li>NEXT_PUBLIC_WORDPRESS_API_URL</li>
                    <li>WC_CONSUMER_KEY</li>
                    <li>WC_CONSUMER_SECRET</li>
                    <li>NEXT_PUBLIC_SUPABASE_URL</li>
                    <li>SUPABASE_SERVICE_ROLE_KEY</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guide de Débogage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold mb-1">1. Vérifier les logs serveur</h4>
            <p className="text-muted-foreground">
              Ouvrez la console de votre terminal où tourne le serveur Next.js. Vous devriez voir des logs détaillés commençant par [Sync Products].
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">2. Variables WooCommerce</h4>
            <p className="text-muted-foreground">
              Les clés WC_CONSUMER_KEY et WC_CONSUMER_SECRET doivent être générées depuis votre tableau de bord WooCommerce (WooCommerce → Réglages → Avancé → API REST).
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">3. URL WordPress</h4>
            <p className="text-muted-foreground">
              NEXT_PUBLIC_WORDPRESS_API_URL doit pointer vers l'URL de base de votre site WordPress (sans /wp-json à la fin).
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">4. Vérifier la table products</h4>
            <p className="text-muted-foreground">
              La table "products" doit exister dans votre base Supabase. Elle a été créée automatiquement via les migrations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
