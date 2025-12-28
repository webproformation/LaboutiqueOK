'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
  parent: number;
}

export default function SetupMorganeCategoriesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    categories?: Category[];
  } | null>(null);

  const setupCategories = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/woocommerce/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'setup-morgane-categories',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: 'Catégories créées avec succès',
          categories: data.categories,
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Erreur lors de la création des catégories',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Erreur réseau: ' + (error instanceof Error ? error.message : 'Erreur inconnue'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Configuration des catégories "Les looks de Morgane"</CardTitle>
          <CardDescription>
            Créez automatiquement la structure de catégories nécessaire pour la section
            "Les looks de Morgane"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold">Catégories qui seront créées :</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>Les looks de Morgane (catégorie parent)</li>
              <li className="ml-6">L'ambiance de la semaine</li>
              <li className="ml-6">Les coups de coeur de Morgane</li>
              <li className="ml-6">Le look de la semaine by Morgane</li>
            </ul>
          </div>

          <Button
            onClick={setupCategories}
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Créer les catégories
          </Button>

          {result && (
            <div
              className={`p-4 rounded-lg ${
                result.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p
                    className={`font-semibold ${
                      result.success ? 'text-green-900' : 'text-red-900'
                    }`}
                  >
                    {result.message}
                  </p>
                  {result.categories && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-green-900">
                        Catégories créées :
                      </p>
                      <ul className="text-sm text-green-700 space-y-1">
                        {result.categories.map((cat) => (
                          <li key={cat.id}>
                            {cat.name} (slug: {cat.slug}, ID: {cat.id})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
