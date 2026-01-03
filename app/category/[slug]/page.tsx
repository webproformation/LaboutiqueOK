'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_PRODUCTS_BY_CATEGORY, GET_PRODUCTS_BY_CATEGORIES, GET_PRODUCT_CATEGORIES } from '@/lib/queries';
import ProductCard from '@/components/ProductCard';
import ProductFilters from '@/components/ProductFilters';
import { Product, GetProductsByCategoryResponse, GetProductCategoriesResponse } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ArrowLeft, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';
import { parsePrice } from '@/lib/utils';
import { useClientSize } from '@/hooks/use-client-size';
import { enrichProductsWithSupabaseImages } from '@/lib/supabase-product-mapper';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export default function CategoryPage() {
  const params = useParams();
  const rawSlug = params.slug as string;
  const slug = decodeURIComponent(rawSlug);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [priceFilter, setPriceFilter] = useState<{ min: number; max: number } | undefined>();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [enrichedProducts, setEnrichedProducts] = useState<Product[]>([]);
  const [isEnriching, setIsEnriching] = useState(false);
  const { isProductInMySize } = useClientSize();

  const { data: categoriesData } = useQuery<GetProductCategoriesResponse>(GET_PRODUCT_CATEGORIES);

  const currentCategory = categoriesData?.productCategories?.nodes.find(
    cat => cat.slug === slug
  );

  const subCategories = currentCategory
    ? categoriesData?.productCategories?.nodes.filter(cat => cat.parentId === currentCategory.id) || []
    : [];

  const allCategorySlugs = currentCategory
    ? [slug, ...subCategories.map(cat => cat.slug)]
    : [slug];

  const { loading: loadingProducts, error: errorProducts, data: dataProducts, refetch } =
    useQuery<GetProductsByCategoryResponse>(
      subCategories.length > 0 ? GET_PRODUCTS_BY_CATEGORIES : GET_PRODUCTS_BY_CATEGORY,
      {
        variables: subCategories.length > 0
          ? { categorySlugs: allCategorySlugs }
          : { categorySlug: slug },
      }
    );

  const handleRefresh = async () => {
    await refetch();
  };

  if (errorProducts) {
    console.error('GraphQL Error:', errorProducts);
  }

  // Always call hooks before any conditional returns
  const allProducts = dataProducts?.products?.nodes || [];

  console.log('[CategoryPage] All products received:', allProducts.length);
  console.log('[CategoryPage] Product details:', allProducts.map((p: any) => ({
    name: p.name,
    id: p.id,
    databaseId: p.databaseId,
    type: p.__typename,
    status: p.status,
    slug: p.slug,
    imageUrl: p.image?.sourceUrl
  })));

  const products: Product[] = allProducts.filter((p: Product) => {
    const shouldInclude = !p.status || p.status === 'publish' || p.status === 'PUBLISH';
    if (!shouldInclude) {
      console.log('[CategoryPage] Filtered out product:', p.name, 'with status:', p.status);
    }
    return shouldInclude;
  });

  console.log('[CategoryPage] Published products:', products.length);
  console.log('[CategoryPage] Published product names:', products.map(p => p.name));

  // ENRICHISSEMENT SUPABASE - DÉSACTIVÉ TEMPORAIREMENT (causait boucle infinie)
  // useEffect(() => {
  //   if (products.length > 0 && !isEnriching) {
  //     setIsEnriching(true);
  //     console.log('[CategoryPage] 🎯 Starting Supabase image enrichment for', products.length, 'products');
  //
  //     enrichProductsWithSupabaseImages(products)
  //       .then(enriched => {
  //         console.log('[CategoryPage] ✅ Enrichment complete');
  //         setEnrichedProducts(enriched);
  //         setIsEnriching(false);
  //       })
  //       .catch(error => {
  //         console.error('[CategoryPage] ❌ Enrichment error:', error);
  //         setEnrichedProducts(products);
  //         setIsEnriching(false);
  //       });
  //   } else if (products.length === 0) {
  //     setEnrichedProducts([]);
  //     setIsEnriching(false);
  //   }
  // }, [products]);

  // UTILISER DIRECTEMENT LES PRODUITS SANS ENRICHISSEMENT
  useEffect(() => {
    setEnrichedProducts(products);
  }, [products.length]);

  const handleFilterChange = useCallback((newFilters: Record<string, string[]>, newPriceRange?: { min: number; max: number }) => {
    setFilters(newFilters);
    setPriceFilter(newPriceRange);
  }, []);

  const filteredProducts = useMemo(() => {
    const hasAttributeFilters = Object.keys(filters).length > 0;
    const hasPriceFilter = priceFilter !== undefined;

    console.log('[CategoryPage] Active filters:', {
      filters,
      priceFilter,
      hasAttributeFilters,
      hasPriceFilter,
      filterKeys: Object.keys(filters),
      filterValues: Object.values(filters)
    });

    // UTILISER LES PRODUITS ENRICHIS AVEC SUPABASE
    const productsToFilter = enrichedProducts.length > 0 ? enrichedProducts : products;
    let result = [...productsToFilter];

    console.log('[CategoryPage] Before filtering:', result.map(p => ({
      name: p.name,
      type: p.type,
      price: p.price,
      parsedPrice: parsePrice(p.price),
      hasAttributes: !!(p.attributes?.nodes?.length)
    })));

    if (hasAttributeFilters || hasPriceFilter) {
      result = result.filter((product) => {
        let included = true;

        if (hasPriceFilter) {
          const productPrice = parsePrice(product.price);

          if (productPrice === 0 && product.price === null) {
            const variations = product.variations?.nodes || [];
            console.log('[CategoryPage] Checking variable product variations:', {
              name: product.name,
              variationCount: variations.length,
              variations: variations.map((v: any) => ({
                name: v.name,
                price: v.price,
                parsedPrice: parsePrice(v.price)
              })),
              range: priceFilter
            });

            if (variations.length > 0) {
              const hasVariationInRange = variations.some((variation: any) => {
                const varPrice = parsePrice(variation.price);
                return varPrice >= priceFilter.min && varPrice <= priceFilter.max;
              });

              if (!hasVariationInRange) {
                console.log('[CategoryPage] Variable product excluded - no variations in price range');
                included = false;
                return false;
              }
            }
          } else if (productPrice < priceFilter.min || productPrice > priceFilter.max) {
            console.log('[CategoryPage] Product excluded by price filter:', {
              name: product.name,
              price: product.price,
              parsedPrice: productPrice,
              range: priceFilter
            });
            included = false;
            return false;
          }
        }

        if (hasAttributeFilters) {
          const attributes = product.attributes?.nodes;

          if (!attributes || attributes.length === 0) {
            console.log('[CategoryPage] Product without attributes excluded by attribute filter:', {
              name: product.name,
              type: product.type,
              activeFilters: filters
            });
            included = false;
            return false;
          }

          const matchesAllFilters = Object.entries(filters).every(([attributeSlug, selectedTermNames]) => {
            if (attributeSlug === 'my_size') {
              const hasMatch = isProductInMySize(product);

              if (!hasMatch) {
                console.log('[CategoryPage] Product does not match size filter:', {
                  name: product.name,
                  productAttributes: attributes.map(a => ({
                    name: a.name,
                    options: a.options
                  }))
                });
              }

              return hasMatch;
            }

            const productAttribute = attributes.find(
              (attr) => {
                const attrSlug = attr.slug || attr.name.toLowerCase().replace(/\s+/g, '-');
                const normalizedAttrSlug = attrSlug.replace('pa_', '');
                const normalizedFilterSlug = attributeSlug.replace('pa_', '');

                return normalizedAttrSlug === normalizedFilterSlug ||
                       attrSlug === attributeSlug ||
                       attr.name.toLowerCase() === attributeSlug.replace(/-/g, ' ').toLowerCase();
              }
            );

            if (!productAttribute || !productAttribute.options) {
              console.log('[CategoryPage] Product missing required attribute:', {
                name: product.name,
                missingAttribute: attributeSlug
              });
              return false;
            }

            const hasMatch = selectedTermNames.some((termName) => {
              return productAttribute.options.some((option) =>
                option.toLowerCase().trim() === termName.toLowerCase().trim()
              );
            });

            if (!hasMatch) {
              console.log('[CategoryPage] Product does not match attribute filter:', {
                name: product.name,
                attribute: attributeSlug,
                selectedTerms: selectedTermNames,
                productOptions: productAttribute.options
              });
            }

            return hasMatch;
          });

          included = matchesAllFilters;
          return matchesAllFilters;
        }

        return included;
      });
    }

    result.sort((a, b) => {
      const priceA = parsePrice(a.price);
      const priceB = parsePrice(b.price);
      return priceA - priceB;
    });

    console.log('[CategoryPage] After filtering:', result.map(p => p.name));

    return result;
  }, [products, filters, priceFilter]);

  if (loadingProducts) {
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

  if (errorProducts) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Link href="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux catégories
            </Button>
          </Link>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>
              Impossible de charger les produits de cette catégorie.
              <br />
              <span className="text-xs">Détails: {errorProducts.message}</span>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const activeFiltersCount = Object.keys(filters).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux catégories
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loadingProducts}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loadingProducts ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {currentCategory?.name || 'Catégorie'}
          </h1>
          {currentCategory?.description && (
            <p className="text-lg text-gray-600 mb-4">{currentCategory.description}</p>
          )}
          <p className="text-gray-500">
            {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} disponible{filteredProducts.length > 1 ? 's' : ''}
            {Object.keys(filters).length > 0 && ` (sur ${products.length} total)`}
          </p>
        </div>

        {/* Bouton filtres mobile */}
        <div className="lg:hidden mb-4">
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-center gap-2 bg-white"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtres
                {activeFiltersCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-[#D4AF37] text-white text-xs rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
              <SheetHeader className="mb-4">
                <SheetTitle>Filtrer les produits</SheetTitle>
                <SheetDescription>
                  {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
                </SheetDescription>
              </SheetHeader>
              <ProductFilters
                onFilterChange={handleFilterChange}
                initialFilters={filters}
                products={products}
              />
              <div className="sticky bottom-0 left-0 right-0 bg-white border-t pt-4 mt-6">
                <Button
                  onClick={() => setFiltersOpen(false)}
                  className="w-full bg-[#D4AF37] hover:bg-[#b8933d]"
                >
                  Voir {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filtres desktop */}
          <aside className="hidden lg:block lg:w-64 flex-shrink-0">
            <ProductFilters
              onFilterChange={handleFilterChange}
              initialFilters={filters}
              products={products}
            />
          </aside>

          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Aucun produit</AlertTitle>
                <AlertDescription>
                  {Object.keys(filters).length > 0
                    ? "Aucun produit ne correspond aux filtres sélectionnés."
                    : "Il n'y a actuellement aucun produit dans cette catégorie."}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {(() => {
                  console.log('[CategoryPage] Rendering products:', filteredProducts.map(p => ({
                    name: p.name,
                    id: p.id,
                    slug: p.slug,
                    key: `${p.id}-${p.slug}`
                  })));
                  return filteredProducts.map((product) => (
                    <ProductCard key={`${product.id}-${product.slug}`} product={product} />
                  ));
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
