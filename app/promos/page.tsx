'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client/core';
import ProductCard from '@/components/ProductCard';
import ProductFilters from '@/components/ProductFilters';
import { Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { CircleAlert as AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { parsePrice } from '@/lib/utils';

const GET_SALE_PRODUCTS = gql`
  query GetSaleProducts {
    products(where: { onSale: true }, first: 100) {
      nodes {
        id
        databaseId
        name
        slug
        onSale
        image {
          sourceUrl
        }
        ... on SimpleProduct {
          price
          regularPrice
          salePrice
          stockQuantity
          stockStatus
          galleryImages {
            nodes {
              sourceUrl
            }
          }
          attributes {
            nodes {
              name
              ... on GlobalProductAttribute {
                slug
              }
              options
            }
          }
        }
        ... on VariableProduct {
          price
          regularPrice
          salePrice
          stockQuantity
          stockStatus
          galleryImages {
            nodes {
              sourceUrl
            }
          }
          attributes {
            nodes {
              name
              ... on GlobalProductAttribute {
                slug
              }
              options
            }
          }
        }
      }
    }
  }
`;

interface GetSaleProductsResponse {
  products: {
    nodes: Product[];
  };
}

export default function PromosPage() {
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const { loading, error, data } = useQuery<GetSaleProductsResponse>(GET_SALE_PRODUCTS);

  const products = data?.products?.nodes || [];

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (Object.keys(filters).length > 0) {
      result = result.filter((product) => {
        const attributes = product.attributes?.nodes;
        if (!attributes) return false;

        return Object.entries(filters).every(([attributeSlug, selectedTerms]) => {
          const productAttribute = attributes.find(
            (attr) => attr.slug === attributeSlug
          );

          if (!productAttribute || !productAttribute.options) return false;

          return selectedTerms.some((termName) =>
            productAttribute.options.includes(termName)
          );
        });
      });
    }

    result.sort((a, b) => {
      const priceA = parsePrice(a.price);
      const priceB = parsePrice(b.price);
      return priceA - priceB;
    });

    return result;
  }, [products, filters]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-48 mb-8" />
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Link href="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l&apos;accueil
            </Button>
          </Link>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>
              Impossible de charger les promotions.
              <br />
              <span className="text-xs">Détails: {error.message}</span>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l&apos;accueil
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Promotions</h1>
          <p className="text-lg text-gray-600 mb-4">
            Découvrez nos offres exceptionnelles
          </p>
          <p className="text-gray-500">
            {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} en promotion
            {Object.keys(filters).length > 0 && ` (sur ${products.length} total)`}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <ProductFilters onFilterChange={setFilters} initialFilters={filters} />
          </aside>

          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Aucune promotion</AlertTitle>
                <AlertDescription>
                  {Object.keys(filters).length > 0
                    ? "Aucun produit ne correspond aux filtres sélectionnés."
                    : "Il n'y a actuellement aucun produit en promotion. Revenez bientôt pour découvrir nos offres exceptionnelles !"}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard key={`${product.id}-${product.slug}`} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
