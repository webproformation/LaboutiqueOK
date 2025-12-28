"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw } from 'lucide-react';

export default function DebugWooAttributesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testAttributesAPI = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/woocommerce/attributes');
      const data = await response.json();

      if (!response.ok) {
        setError(`HTTP ${response.status}: ${JSON.stringify(data)}`);
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
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Debug - Attributs WooCommerce</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test de l'API</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={testAttributesAPI} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Chargement...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Tester l'API
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Erreur</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm text-red-600">{error}</pre>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700">Résultat</CardTitle>
          </CardHeader>
          <CardContent>
            {result.message && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Message:</strong> {result.message}
                </p>
              </div>
            )}

            <div className="mb-4">
              <h3 className="font-semibold mb-2">
                Nombre d'attributs trouvés: {result.attributes?.length || 0}
              </h3>
            </div>

            {result.attributes && result.attributes.length > 0 && (
              <div className="space-y-4">
                {result.attributes.map((attr: any) => (
                  <Card key={attr.id} className="border-blue-200">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {attr.name} (ID: {attr.id})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Slug:</strong> {attr.slug}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Type:</strong> {attr.type}
                      </p>
                      <p className="text-sm font-semibold mb-2">
                        Termes ({attr.terms?.length || 0}):
                      </p>
                      {attr.terms && attr.terms.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {attr.terms.map((term: any) => (
                            <span
                              key={term.id}
                              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                            >
                              {term.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Aucun terme défini</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <details className="mt-6">
              <summary className="cursor-pointer font-semibold mb-2">
                Voir le JSON brut
              </summary>
              <pre className="whitespace-pre-wrap text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>1.</strong> Cliquez sur "Tester l'API" pour récupérer les attributs depuis WooCommerce
          </p>
          <p>
            <strong>2.</strong> Si aucun attribut n'est trouvé, allez dans votre administration WooCommerce
          </p>
          <p>
            <strong>3.</strong> Accédez à <strong>Produits → Attributs</strong>
          </p>
          <p>
            <strong>4.</strong> Créez des attributs (ex: Couleur, Taille, Matière) et ajoutez-leur des termes
          </p>
          <p>
            <strong>5.</strong> Revenez ici et testez à nouveau
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
