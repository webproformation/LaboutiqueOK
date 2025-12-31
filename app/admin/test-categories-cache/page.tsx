'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function TestCategoriesCachePage() {
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/categories-cache');
      const data = await response.json();

      if (response.ok) {
        setCategories(data);
        toast.success(`${data.length} catégories récupérées`);
      } else {
        setError('Erreur lors de la récupération');
        toast.error('Erreur');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Erreur inattendue');
      toast.error('Impossible de récupérer les catégories');
    } finally {
      setLoading(false);
    }
  };

  const testSync = async () => {
    setSyncLoading(true);
    setError(null);
    setSyncResult(null);

    try {
      const testCategories = [
        {
          id: 999,
          name: 'Test Category',
          slug: 'test-category',
          parent: 0,
          description: 'Test description',
          count: 5,
          image: null
        },
        {
          id: 1000,
          name: 'Test Category 2',
          slug: 'test-category-2',
          parent: 999,
          description: 'Another test',
          count: 10,
          image: null
        }
      ];

      const response = await fetch('/api/categories-cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync',
          categories: testCategories
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSyncResult(data);
        toast.success('Synchronisation réussie');
      } else {
        setError(data.error || 'Erreur lors de la synchronisation');
        toast.error('Erreur de synchronisation');
      }
    } catch (err: any) {
      console.error('Sync error:', err);
      setError(err.message || 'Erreur inattendue');
      toast.error('Impossible de synchroniser');
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Test Categories Cache API</h1>
        <p className="text-muted-foreground">
          Testez l'API de cache des catégories WooCommerce
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>GET - Récupérer le Cache</CardTitle>
            <CardDescription>
              Récupère toutes les catégories depuis le cache Supabase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={fetchCategories} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Récupérer les Catégories
            </Button>

            {categories.length > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <p className="font-medium text-green-900">
                    {categories.length} catégories trouvées
                  </p>
                </div>
                <div className="text-sm text-green-800 max-h-40 overflow-y-auto space-y-1">
                  {categories.slice(0, 10).map(cat => (
                    <div key={cat.id} className="flex items-center justify-between">
                      <span>{cat.name}</span>
                      <span className="text-xs text-green-600">
                        ID: {cat.id} | Count: {cat.count}
                      </span>
                    </div>
                  ))}
                  {categories.length > 10 && (
                    <p className="text-xs text-green-600 pt-2">
                      ...et {categories.length - 10} autres
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>POST - Synchroniser le Cache</CardTitle>
            <CardDescription>
              Teste la synchronisation avec 2 catégories de test
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testSync} disabled={syncLoading}>
              {syncLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tester la Synchronisation
            </Button>

            {syncResult && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <p className="font-medium text-green-900">Synchronisation réussie</p>
                </div>
                <div className="text-sm text-green-800 space-y-1">
                  <p>Catégories synchronisées: {syncResult.count}</p>
                  <p className="text-xs">{syncResult.message}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Erreur Détectée</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Vérification Console Serveur</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="font-medium text-blue-900 mb-2">
              Logs Détaillés Disponibles
            </p>
            <p className="text-blue-800">
              Vérifiez la console de votre serveur Next.js pour voir les logs détaillés :
            </p>
            <ul className="mt-2 text-blue-800 list-disc list-inside space-y-1">
              <li>[Categories Cache API] GET REQUEST</li>
              <li>[Categories Cache API] POST REQUEST STARTED</li>
              <li>[Categories Cache API] Step 1-7: Détails de chaque étape</li>
              <li>[Categories Cache API] SUCCESS ou ERROR</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-1">Étapes de la Synchronisation:</h4>
            <ol className="text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Parsing du body JSON</li>
              <li>Vérification des variables d'environnement</li>
              <li>Création du client Supabase</li>
              <li>Validation du tableau de catégories</li>
              <li>Suppression de l'ancien cache (DELETE)</li>
              <li>Formatage des catégories</li>
              <li>Insertion dans Supabase (UPSERT)</li>
            </ol>
          </div>

          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">Important</p>
                <p className="text-sm text-yellow-800">
                  Si vous obtenez une erreur 500, vérifiez les logs serveur pour identifier
                  précisément quelle étape a échoué. Tous les logs commencent par
                  [Categories Cache API] pour faciliter le filtrage.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
