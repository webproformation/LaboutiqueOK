"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SyncCategoriesPage() {
  const [syncing, setSyncing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);

    try {
      // Forcer la synchronisation depuis WooCommerce
      const response = await fetch('/api/woocommerce/categories?refresh=true');

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Sync error response:', errorData);

        const errorMessage = errorData.details || errorData.error || 'Erreur lors de la synchronisation';
        const suggestion = errorData.suggestion || '';

        setResult({
          success: false,
          message: errorMessage,
          suggestion: suggestion
        });

        toast.error(errorMessage);
        return;
      }

      const categories = await response.json();

      setResult({
        success: true,
        message: `${categories.length} catégories synchronisées depuis WooCommerce`,
        categories
      });

      toast.success('Catégories synchronisées avec succès');
    } catch (error: any) {
      console.error('Error syncing categories:', error);
      const errorMessage = error.message || 'Erreur lors de la synchronisation';
      toast.error(errorMessage);
      setResult({
        success: false,
        message: errorMessage
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateBaseCategories = async () => {
    setCreating(true);
    setResult(null);

    try {
      // Liste des catégories de base à créer
      const baseCategories = [
        { name: 'Nouveautés', slug: 'nouveautes', parent: 0 },
        { name: 'Promotions', slug: 'promotions', parent: 0 },
        { name: 'En Rayon', slug: 'en-rayon', parent: 0 },
        { name: 'Vêtements', slug: 'vetements', parent: 0 },
        { name: 'Accessoires', slug: 'accessoires', parent: 0 },
      ];

      const created = [];
      const errors = [];

      for (const category of baseCategories) {
        try {
          const response = await fetch('/api/woocommerce/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'create',
              categoryData: category
            })
          });

          if (response.ok) {
            const result = await response.json();
            created.push(result.name);
          } else {
            const errorData = await response.json();
            // Si la catégorie existe déjà, ce n'est pas grave
            if (errorData.details?.code !== 'term_exists') {
              errors.push(`${category.name}: ${errorData.error}`);
            } else {
              created.push(`${category.name} (déjà existante)`);
            }
          }
        } catch (error: any) {
          errors.push(`${category.name}: ${error.message}`);
        }
      }

      setResult({
        success: errors.length === 0,
        message: `${created.length} catégories créées/vérifiées`,
        created,
        errors
      });

      if (errors.length === 0) {
        toast.success('Catégories de base créées avec succès');
        // Re-synchroniser après création
        setTimeout(() => handleSync(), 1000);
      } else {
        toast.warning('Certaines catégories n\'ont pas pu être créées');
      }
    } catch (error: any) {
      console.error('Error creating categories:', error);
      toast.error(error.message || 'Erreur lors de la création');
      setResult({
        success: false,
        message: error.message
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Synchronisation des catégories</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Synchroniser depuis WooCommerce</CardTitle>
            <CardDescription>
              Charger toutes les catégories existantes depuis votre boutique WooCommerce
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleSync}
              disabled={syncing}
              className="w-full"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Synchronisation en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Synchroniser maintenant
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Créer les catégories de base</CardTitle>
            <CardDescription>
              Créer les catégories principales si elles n'existent pas encore dans WooCommerce
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600 space-y-1">
              <p>Cette action va créer les catégories suivantes (si elles n'existent pas) :</p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Nouveautés</li>
                <li>Promotions</li>
                <li>En Rayon</li>
                <li>Vêtements</li>
                <li>Accessoires</li>
              </ul>
            </div>

            <Button
              onClick={handleCreateBaseCategories}
              disabled={creating}
              variant="outline"
              className="w-full"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Créer les catégories de base
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Succès
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    Erreur
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">{result.message}</p>

              {result.suggestion && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>Suggestion :</strong> {result.suggestion}
                  </p>
                </div>
              )}

              {result.created && result.created.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-semibold mb-2">Catégories créées/vérifiées :</p>
                  <ul className="list-disc list-inside text-sm space-y-1 text-gray-600">
                    {result.created.map((cat: string, i: number) => (
                      <li key={i}>{cat}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.errors && result.errors.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2 text-red-600">Erreurs :</p>
                  <ul className="list-disc list-inside text-sm space-y-1 text-red-600">
                    {result.errors.map((error: string, i: number) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.categories && (
                <div className="mt-4 p-4 bg-gray-50 rounded text-xs">
                  <p className="font-semibold mb-2">Catégories synchronisées :</p>
                  <pre className="overflow-auto max-h-60">
                    {JSON.stringify(result.categories, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
