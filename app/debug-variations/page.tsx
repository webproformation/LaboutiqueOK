'use client';

import { useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const GET_PRODUCT = gql`
  query GetProduct($slug: ID!) {
    product(id: $slug, idType: SLUG) {
      ... on VariableProduct {
        id
        databaseId
        name
        slug
        variations(first: 100) {
          nodes {
            id
            databaseId
            name
            price
            regularPrice
            salePrice
            stockQuantity
            stockStatus
            onSale
            image {
              sourceUrl
            }
            attributes {
              nodes {
                name
                value
              }
            }
          }
        }
      }
    }
  }
`;

interface DebugProductResponse {
  product: {
    id: string;
    databaseId: number;
    name: string;
    slug: string;
    variations?: {
      nodes: Array<{
        id: number;
        databaseId: number;
        name: string;
        price: string;
        regularPrice?: string;
        salePrice?: string;
        stockQuantity: number | null;
        stockStatus: string;
        onSale: boolean;
        image?: {
          sourceUrl: string;
        };
        attributes?: {
          nodes: Array<{
            name: string;
            value: string;
          }>;
        };
      }>;
    };
  };
}

function DebugVariationsContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug') || 'pull-classique-a-col-roule-en-maille-tricotee-avec-manches-longues-et-bas-elastique-bordures-ctelees-couleur-unie';

  const { loading, error, data } = useQuery<DebugProductResponse>(GET_PRODUCT, {
    variables: { slug },
  });

  if (loading) return <div className="container mx-auto px-4 py-8">Chargement...</div>;
  if (error) return <div className="container mx-auto px-4 py-8">Erreur: {error.message}</div>;
  if (!data?.product) return <div className="container mx-auto px-4 py-8">Produit non trouvé</div>;

  const product = data.product;
  const variations = product.variations?.nodes || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Debug Variations</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Produit: {product.name}</h2>
        <p className="text-gray-600">Slug: {product.slug}</p>
        <p className="text-gray-600">ID: {product.databaseId}</p>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Nombre de variations: {variations.length}</h3>
      </div>

      {variations.map((variation: any, index: number) => (
        <div key={variation.id} className="mb-6 p-4 border rounded-lg bg-white shadow-sm">
          <h4 className="font-semibold text-lg mb-2">Variation {index + 1}</h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium">ID:</p>
              <p className="text-gray-600">{variation.databaseId}</p>
            </div>
            <div>
              <p className="font-medium">Name:</p>
              <p className="text-gray-600">{variation.name}</p>
            </div>
            <div>
              <p className="font-medium">Price:</p>
              <p className="text-gray-600">{variation.price}</p>
            </div>
            <div>
              <p className="font-medium">Regular Price:</p>
              <p className="text-gray-600">{variation.regularPrice || 'N/A'}</p>
            </div>
            <div>
              <p className="font-medium">Sale Price:</p>
              <p className="text-gray-600">{variation.salePrice || 'N/A'}</p>
            </div>
            <div>
              <p className="font-medium">On Sale:</p>
              <p className="text-gray-600">{variation.onSale ? 'Oui' : 'Non'}</p>
            </div>
            <div className="col-span-2">
              <p className="font-medium">Stock Status:</p>
              <p className={`font-bold ${variation.stockStatus === 'IN_STOCK' ? 'text-green-600' : 'text-red-600'}`}>
                {variation.stockStatus || 'UNDEFINED'}
              </p>
            </div>
            <div className="col-span-2">
              <p className="font-medium">Stock Quantity:</p>
              <p className="font-bold text-blue-600">
                {variation.stockQuantity !== null && variation.stockQuantity !== undefined
                  ? variation.stockQuantity
                  : 'NULL/UNDEFINED'}
              </p>
            </div>
            <div className="col-span-2">
              <p className="font-medium">Attributes:</p>
              <ul className="list-disc list-inside text-gray-600">
                {variation.attributes?.nodes?.map((attr: any, i: number) => (
                  <li key={i}>{attr.name}: {attr.value}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-100 rounded">
            <p className="font-medium mb-2">Raw JSON:</p>
            <pre className="text-xs overflow-auto">{JSON.stringify(variation, null, 2)}</pre>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DebugVariationsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Chargement...</div>}>
      <DebugVariationsContent />
    </Suspense>
  );
}
