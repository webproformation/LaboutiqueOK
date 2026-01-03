'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import ProductFilters from '@/components/ProductFilters';
import { Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ArrowLeft, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';
import { parsePrice } from '@/lib/utils';
import { useClientSize } from '@/hooks/use-client-size';
import { createClient } from '@/lib/supabase-client';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface SupabaseCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id: string | null;
  woocommerce_id: number;
}

interface SupabaseProduct {
  id: string;
  woocommerce_id: number;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  regular_price: number;
  sale_price: number | null;
  image_url: string | null;
  images: any;
  stock_status: string;
  stock_quantity: number | null;
  is_active: boolean;
  is_featured: boolean;
  is_diamond: boolean;
  attributes: any;
  variations: any;
  manage_stock: boolean;
}

function mapSupabaseProductToProduct(supabaseProduct: SupabaseProduct): Product {
  const hasVariations = supabaseProduct.variations && Array.isArray(supabaseProduct.variations) && supabaseProduct.variations.length > 0;

  const regularPrice = supabaseProduct.regular_price?.toString() || '0';
  const salePrice = supabaseProduct.sale_price?.toString() || null;
  const price = salePrice || regularPrice;

  return {
    id: supabaseProduct.id,
    databaseId: supabaseProduct.woocommerce_id,
    name: supabaseProduct.name,
    slug: supabaseProduct.slug,
    price: price,
    regularPrice: regularPrice,
    salePrice: salePrice,
    onSale: !!salePrice && parseFloat(salePrice) < parseFloat(regularPrice),
    type: hasVariations ? 'VARIABLE' : 'SIMPLE',
    status: supabaseProduct.is_active ? 'publish' : 'draft',
    stockStatus: supabaseProduct.stock_status || 'instock',
    stockQuantity: supabaseProduct.stock_quantity,
    manageStock: supabaseProduct.manage_stock,
    featured: supabaseProduct.is_featured,
    description: supabaseProduct.description,
    shortDescription: supabaseProduct.short_description,
    image: supabaseProduct.image_url ? {
      sourceUrl: supabaseProduct.image_url
    } : undefined,
    galleryImages: supabaseProduct.images && Array.isArray(supabaseProduct.images) ? {
      nodes: supabaseProduct.images.map((img: any) => ({
        sourceUrl: img.src || img.image_url || img
      }))
    } : { nodes: [] },
    attributes: supabaseProduct.attributes ? {
      nodes: Array.isArray(supabaseProduct.attributes) ? supabaseProduct.attributes.map((attr: any) => ({
        name: attr.name,
        slug: attr.slug,
        options: attr.options || [],
        variation: attr.variation
      })) : []
    } : { nodes: [] },
    variations: hasVariations ? {
      nodes: supabaseProduct.variations.map((variation: any) => ({
        id: variation.id,
        databaseId: variation.id,
        name: variation.name,
        price: variation.price?.toString() || '0',
        regularPrice: variation.regular_price?.toString(),
        salePrice: variation.sale_price?.toString(),
        onSale: !!variation.sale_price,
        stockStatus: variation.stock_status || 'instock',
        stockQuantity: variation.stock_quantity,
        attributes: variation.attributes || [],
        image: variation.image ? {
          sourceUrl: variation.image.src || variation.image
        } : undefined
      }))
    } : { nodes: [] }
  };
}

export default function CategoryPage() {
  const params = useParams();
  const rawSlug = params.slug as string;
  const slug = decodeURIComponent(rawSlug);

  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [priceFilter, setPriceFilter] = useState<{ min: number; max: number } | undefined>();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCategory, setCurrentCategory] = useState<SupabaseCategory | null>(null);
  const [subCategories, setSubCategories] = useState<SupabaseCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const { isProductInMySize } = useClientSize();

  const supabase = createClient();

  const loadCategoryAndProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (categoryError) throw categoryError;

      if (!categoryData) {
        setError('Catégorie introuvable');
        setLoading(false);
        return;
      }

      setCurrentCategory(categoryData);

      const { data: subCategoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('parent_id', categoryData.id);

      setSubCategories(subCategoriesData || []);

      const categoryIds = [categoryData.id, ...(subCategoriesData || []).map((c: SupabaseCategory) => c.id)];

      const { data: productCategoriesData, error: productCategoriesError } = await supabase
        .from('product_categories')
        .select('product_id')
        .in('category_id', categoryIds);

      if (productCategoriesError) throw productCategoriesError;

      const productIds = (productCategoriesData || []).map((pc: any) => pc.product_id);

      if (productIds.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds)
        .eq('is_active', true);

      if (productsError) throw productsError;

      const mappedProducts = (productsData || []).map(mapSupabaseProductToProduct);
      setProducts(mappedProducts);

    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategoryAndProducts();
  }, [slug]);

  const handleRefresh = () => {
    loadCategoryAndProducts();
  };

  const handleFilterChange = useCallback((newFilters: Record<string, string[]>, newPriceRange?: { min: number; max: number }) => {
    setFilters(newFilters);
    setPriceFilter(newPriceRange);
  }, []);

  const filteredProducts = useMemo(() => {
    const hasAttributeFilters = Object.keys(filters).length > 0;
    const hasPriceFilter = priceFilter !== undefined;

    let result = [...products];

    if (hasAttributeFilters || hasPriceFilter) {
      result = result.filter((product) => {
        let included = true;

        if (hasPriceFilter) {
          const productPrice = parsePrice(product.price);

          if (productPrice === 0 && product.price === null) {
            const variations = product.variations?.nodes || [];

            if (variations.length > 0) {
              const hasVariationInRange = variations.some((variation: any) => {
                const varPrice = parsePrice(variation.price);
                return varPrice >= priceFilter.min && varPrice <= priceFilter.max;
              });

              if (!hasVariationInRange) {
                included = false;
                return false;
              }
            }
          } else if (productPrice < priceFilter.min || productPrice > priceFilter.max) {
            included = false;
            return false;
          }
        }

        if (hasAttributeFilters) {
          const attributes = product.attributes?.nodes;

          if (!attributes || attributes.length === 0) {
            included = false;
            return false;
          }

          const matchesAllFilters = Object.entries(filters).every(([attributeSlug, selectedTermNames]) => {
            if (attributeSlug === 'my_size') {
              return isProductInMySize(product);
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
              return false;
            }

            return selectedTermNames.some((termName) => {
              return productAttribute.options.some((option) =>
                option.toLowerCase().trim() === termName.toLowerCase().trim()
              );
            });
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

    return result;
  }, [products, filters, priceFilter, isProductInMySize]);

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
              Retour aux catégories
            </Button>
          </Link>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>
              {error}
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
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
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
