'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_PRODUCTS_BY_CATEGORY } from '@/lib/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GetProductsByCategoryResponse } from '@/types';

export default function DebugFiltersPage() {
  const [wooAttributes, setWooAttributes] = useState<any[]>([]);
  const [categorySlug, setCategorySlug] = useState('soins-visage');

  const { data: productsData } = useQuery<GetProductsByCategoryResponse>(
    GET_PRODUCTS_BY_CATEGORY,
    {
      variables: { categorySlug },
    }
  );

  useEffect(() => {
    const fetchWooAttributes = async () => {
      try {
        const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-woocommerce-attributes`;
        const response = await fetch(apiUrl, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setWooAttributes(data.attributes || []);
        }
      } catch (error) {
        console.error('Error fetching WooCommerce attributes:', error);
      }
    };

    fetchWooAttributes();
  }, []);

  const products = productsData?.products?.nodes || [];
  const firstProduct = products[0];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold">Debug Filtres Attributs</h1>

      <Card>
        <CardHeader>
          <CardTitle>Attributs WooCommerce (Edge Function)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-xs">
            {JSON.stringify(wooAttributes, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Premier Produit GraphQL (Attributs)</CardTitle>
        </CardHeader>
        <CardContent>
          {firstProduct ? (
            <div className="space-y-4">
              <p><strong>Nom:</strong> {firstProduct.name}</p>
              <p><strong>Prix:</strong> {firstProduct.price}</p>
              <div>
                <strong>Attributs GraphQL:</strong>
                <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-xs mt-2">
                  {JSON.stringify(firstProduct.attributes, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <p>Aucun produit trouvé</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comparaison des Slugs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Slugs WooCommerce:</h3>
              <ul className="list-disc list-inside space-y-1">
                {wooAttributes.map((attr) => (
                  <li key={attr.id}>
                    <code className="bg-gray-100 px-2 py-1 rounded">{attr.slug}</code> - {attr.name}
                  </li>
                ))}
              </ul>
            </div>

            {firstProduct?.attributes?.nodes && (
              <div>
                <h3 className="font-semibold mb-2">Slugs GraphQL du premier produit:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {firstProduct.attributes.nodes.map((attr: any, idx: number) => (
                    <li key={idx}>
                      <code className="bg-gray-100 px-2 py-1 rounded">
                        {attr.slug || `[généré: ${attr.name.toLowerCase().replace(/\s+/g, '-')}]`}
                      </code> - {attr.name}
                      <br />
                      <span className="text-sm text-gray-600 ml-6">
                        Options: {attr.options?.join(', ')}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test de Matching</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Vérifiez si les slugs correspondent entre WooCommerce et GraphQL.
            Le problème principal: les attributs WooCommerce ont des slugs commençant par "pa_"
            mais GraphQL peut retourner des slugs différents.
          </p>

          <div className="space-y-2">
            {wooAttributes.map((wooAttr) => {
              const graphqlMatch = firstProduct?.attributes?.nodes?.find((gqlAttr: any) => {
                const gqlSlug = gqlAttr.slug || gqlAttr.name.toLowerCase().replace(/\s+/g, '-');
                return gqlSlug === wooAttr.slug ||
                       gqlSlug === wooAttr.slug.replace('pa_', '') ||
                       `pa_${gqlSlug}` === wooAttr.slug;
              });

              return (
                <div key={wooAttr.id} className="p-3 border rounded">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${graphqlMatch ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="font-mono text-sm">{wooAttr.slug}</span>
                    <span>→</span>
                    {graphqlMatch ? (
                      <span className="font-mono text-sm text-green-600">
                        {graphqlMatch.slug || 'local-attribute'}
                      </span>
                    ) : (
                      <span className="text-red-600">Pas de correspondance</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
