'use client';

import { useQuery } from '@apollo/client/react';
import { GET_PRODUCTS_PAGINATED } from '@/lib/queries';
import { Product } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase-client';
import { useState, useEffect } from 'react';

interface ProductsResponse {
  products: {
    nodes: Product[];
  };
}

export default function DebugSizeFilterPage() {
  const { user } = useAuth();
  const [userSize, setUserSize] = useState<string | null>(null);

  const { data, loading, error } = useQuery<ProductsResponse>(GET_PRODUCTS_PAGINATED, {
    variables: { first: 50, after: null },
  });

  useEffect(() => {
    if (user) {
      fetchUserSize();
    }
  }, [user]);

  const fetchUserSize = async () => {
    const { data } = await supabase
      .from('client_measurements')
      .select('preferred_size')
      .eq('user_id', user?.id)
      .maybeSingle();

    if (data) {
      setUserSize(data.preferred_size);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#b8933d]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Erreur: {error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const products = data?.products?.nodes || [];

  // Analyser les attributs de taille
  const sizeAnalysis = products.map(product => {
    const attributes = product.attributes?.nodes || [];

    const sizeAttribute = attributes.find(attr => {
      const attrName = attr.name.toLowerCase();
      const attrSlug = attr.slug?.toLowerCase() || '';
      return attrName === 'taille' ||
             attrName === 'tailles' ||
             attrName === 'size' ||
             attrName.includes('taille') ||
             attrName.includes('size') ||
             attrSlug.includes('taille') ||
             attrSlug.includes('size');
    });

    return {
      id: product.id,
      name: product.name,
      type: product.type,
      hasSizeAttribute: !!sizeAttribute,
      sizeAttributeName: sizeAttribute?.name,
      sizeAttributeSlug: sizeAttribute?.slug,
      availableSizes: sizeAttribute?.options || [],
      allAttributes: attributes.map(attr => ({
        name: attr.name,
        slug: attr.slug,
        options: attr.options
      })),
      hasXXL: sizeAttribute?.options?.some(opt =>
        opt.toUpperCase().trim() === 'XXL'
      ) || false,
      matchesUserSize: userSize && sizeAttribute?.options?.some(opt =>
        opt.toUpperCase().trim() === userSize.toUpperCase().trim()
      ) || false
    };
  });

  const productsWithSize = sizeAnalysis.filter(p => p.hasSizeAttribute);
  const productsWithoutSize = sizeAnalysis.filter(p => !p.hasSizeAttribute);
  const productsWithXXL = sizeAnalysis.filter(p => p.hasXXL);
  const productsMatchingUserSize = sizeAnalysis.filter(p => p.matchesUserSize);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Debug - Filtrage par taille</h1>

      {userSize && (
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            Votre taille préférée : <strong>{userSize}</strong>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total produits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#b8933d]">{products.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avec attribut taille
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{productsWithSize.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Sans attribut taille
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{productsWithoutSize.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Disponibles en {userSize || 'XXL'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {userSize ? productsMatchingUserSize.length : productsWithXXL.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {productsWithoutSize.length > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{productsWithoutSize.length} produits</strong> n'ont pas d'attribut de taille configuré.
            Ils ne peuvent pas être filtrés par taille.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Produits AVEC attribut taille ({productsWithSize.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {productsWithSize.map((product) => (
                <div key={product.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <p className="text-sm text-gray-600">Type: {product.type}</p>
                    </div>
                    {product.matchesUserSize && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                        Correspond à votre taille
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Attribut taille:</span>
                      <p className="text-sm text-gray-600">
                        Nom: <code className="bg-gray-100 px-2 py-1 rounded">{product.sizeAttributeName}</code>
                        {product.sizeAttributeSlug && (
                          <> | Slug: <code className="bg-gray-100 px-2 py-1 rounded">{product.sizeAttributeSlug}</code></>
                        )}
                      </p>
                    </div>

                    <div>
                      <span className="text-sm font-medium text-gray-700">Tailles disponibles:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {product.availableSizes.map((size, idx) => (
                          <span
                            key={idx}
                            className={`px-3 py-1 rounded-full text-sm ${
                              size.toUpperCase() === userSize?.toUpperCase()
                                ? 'bg-[#b8933d] text-white'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {size}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {productsWithoutSize.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">
                Produits SANS attribut taille ({productsWithoutSize.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {productsWithoutSize.map((product) => (
                  <div key={product.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="mb-2">
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-gray-600">Type: {product.type}</p>
                    </div>

                    {product.allAttributes.length > 0 ? (
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          Autres attributs trouvés:
                        </span>
                        <div className="text-sm text-gray-600 mt-1">
                          {product.allAttributes.map((attr, idx) => (
                            <div key={idx} className="ml-2">
                              • {attr.name} {attr.slug && `(${attr.slug})`}
                              {attr.options && attr.options.length > 0 && (
                                <span className="text-gray-500"> - Options: {attr.options.join(', ')}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-red-600">Aucun attribut configuré sur ce produit</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Recommandations</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>1. Vérifiez dans WooCommerce</strong> que tous vos produits ont bien un attribut de taille configuré.
          </p>
          <p>
            <strong>2. L'attribut doit s'appeler</strong> "Taille", "Size", "pa_taille" ou "pa_size" pour être détecté automatiquement.
          </p>
          <p>
            <strong>3. Pour les produits variables,</strong> assurez-vous que l'attribut de taille est bien activé sur le produit parent.
          </p>
          <p>
            <strong>4. Les tailles</strong> doivent être exactement "XS", "S", "M", "L", "XL", "XXL" (insensible à la casse).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
