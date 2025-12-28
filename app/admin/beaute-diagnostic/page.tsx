"use client";

import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_PRODUCT_CATEGORIES, GET_PRODUCTS_BY_CATEGORY } from '@/lib/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GetProductCategoriesResponse, GetProductsByCategoryResponse } from '@/types';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function BeauteDiagnosticPage() {
  const [testSlug, setTestSlug] = useState('beaute-et-senteurs');

  const { loading: loadingCats, data: catsData } = useQuery<GetProductCategoriesResponse>(GET_PRODUCT_CATEGORIES);

  const { loading: loadingProducts, data: productsData, error: productsError } =
    useQuery<GetProductsByCategoryResponse>(GET_PRODUCTS_BY_CATEGORY, {
      variables: { categorySlug: testSlug },
      skip: !testSlug,
    });

  const categories = catsData?.productCategories?.nodes || [];
  const beauteCategory = categories.find(cat =>
    cat.slug === 'beaute-et-senteurs' ||
    cat.name.toLowerCase().includes('beauté')
  );

  const beauteSubCategories = beauteCategory
    ? categories.filter(cat => cat.parentId === beauteCategory.id)
    : [];

  const products = productsData?.products?.nodes || [];

  if (loadingCats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Diagnostic Beauté & Senteurs</h1>
        <p className="text-gray-600 mt-2">Analyse détaillée de la catégorie et de ses produits</p>
      </div>

      <Card className={beauteCategory ? "border-green-500" : "border-red-500"}>
        <CardHeader>
          <CardTitle className={beauteCategory ? "text-green-600" : "text-red-600"}>
            {beauteCategory ? "✓ Catégorie trouvée" : "✗ Catégorie non trouvée"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {beauteCategory ? (
            <div className="space-y-2 font-mono text-sm">
              <div><span className="font-bold">Nom:</span> {beauteCategory.name}</div>
              <div className="text-lg text-blue-600"><span className="font-bold">Slug:</span> {beauteCategory.slug}</div>
              <div><span className="font-bold">ID:</span> {beauteCategory.id}</div>
              <div><span className="font-bold">Parent ID:</span> {beauteCategory.parentId || 'null'}</div>
              <div><span className="font-bold">Description:</span> {beauteCategory.description || 'N/A'}</div>
            </div>
          ) : (
            <p className="text-red-600">Aucune catégorie "Beauté & Senteurs" trouvée dans WooCommerce</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sous-catégories de Beauté & Senteurs ({beauteSubCategories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {beauteSubCategories.length > 0 ? (
            <div className="space-y-2">
              {beauteSubCategories.map(cat => (
                <div key={cat.id} className="p-3 bg-gray-50 rounded border">
                  <div className="font-mono text-sm space-y-1">
                    <div><span className="font-bold">Nom:</span> {cat.name}</div>
                    <div className="text-blue-600"><span className="font-bold">Slug:</span> {cat.slug}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTestSlug(cat.slug)}
                      className="mt-2"
                    >
                      Tester cette catégorie
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">Aucune sous-catégorie trouvée</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test de requête: {testSlug}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Slug à tester:</label>
              <input
                type="text"
                value={testSlug}
                onChange={(e) => setTestSlug(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            {loadingProducts ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Chargement des produits...</span>
              </div>
            ) : productsError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur GraphQL</AlertTitle>
                <AlertDescription className="font-mono text-xs mt-2">
                  {productsError.message}
                </AlertDescription>
              </Alert>
            ) : (
              <div>
                <p className="font-bold text-lg mb-2">
                  {products.length} produit(s) trouvé(s)
                </p>
                {products.length > 0 && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {products.map((product) => (
                      <div key={product.id} className="p-3 bg-gray-50 rounded border">
                        <div className="font-mono text-xs space-y-1">
                          <div><span className="font-bold">Nom:</span> {product.name}</div>
                          <div><span className="font-bold">Slug:</span> {product.slug}</div>
                          <div><span className="font-bold">Prix:</span> {product.price}</div>
                          <div><span className="font-bold">Stock:</span> {product.stockStatus}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Requête GraphQL utilisée</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-900 text-white p-4 rounded text-xs overflow-x-auto">
{`query GetProductsByCategory($categorySlug: String!) {
  products(first: 100, where: { category: $categorySlug }) {
    nodes {
      id
      name
      slug
      price
      stockStatus
      ...
    }
  }
}`}
          </pre>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <span className="font-bold">Variables:</span> {`{ "categorySlug": "${testSlug}" }`}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Solutions possibles</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>Vérifiez que les produits dans WooCommerce sont bien assignés à la catégorie "Beauté & Senteurs" ou ses sous-catégories</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>Le slug WooCommerce peut être différent (vérifiez dans WooCommerce: Produits → Catégories)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>Si les produits sont dans les sous-catégories, testez les slugs des sous-catégories ci-dessus</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">4.</span>
              <span>La requête GraphQL WooCommerce peut nécessiter le paramètre "categoryIn" pour inclure les sous-catégories</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
