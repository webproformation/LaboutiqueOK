'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, Product, ProductCategory } from '@/lib/supabase';
import { ArrowLeft, SlidersHorizontal, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ProductCard } from '@/components/ProductCard';
import { ProductFilters, FilterState } from '@/components/ProductFilters';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtres
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [maxPrice, setMaxPrice] = useState(200);
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    sizes: [],
    colors: [],
    comfort: [],
    coupe: [],
    live: false,
    nouveautes: false,
  });

  const [termMap, setTermMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    loadCategoryAndProducts();
  }, [slug]);

  useEffect(() => {
    applyFilters();
  }, [priceRange, activeFilters, allProducts, termMap]);

  async function loadCategoryAndProducts() {
    setLoading(true);
    try {
      // 1. Dictionnaire ID -> Nom pour traduire les attributs
      const { data: terms } = await supabase
        .from('product_attribute_terms')
        .select('id, name');
      
      const map = new Map<string, string>();
      if (terms) {
        terms.forEach(t => map.set(String(t.id), t.name));
      }
      setTermMap(map);

      // 2. Charger les produits (Requête SIMPLE sans jointure complexe)
      let productsQuery = supabase
        .from('products')
        .select('*')
        .eq('status', 'publish')
        .order('created_at', { ascending: false });

      if (slug !== 'tous') {
        const { data: categoryData } = await supabase
          .from('categories')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (!categoryData) {
          router.push('/');
          return;
        }
        setCategory(categoryData);

        const { data: mappingData } = await supabase
          .from('product_category_mapping')
          .select('product_id')
          .eq('category_id', categoryData.id);

        const productIds = mappingData?.map(m => m.product_id) || [];
        
        if (productIds.length > 0) {
          productsQuery = productsQuery.in('id', productIds);
        } else {
          setAllProducts([]);
          setLoading(false);
          return;
        }
      }

      const { data: productsData, error: productsError } = await productsQuery;

      if (productsError) throw productsError;

      if (productsData) {
        // 3. Charger les variations SÉPARÉMENT (pour éviter l'erreur 400)
        // On récupère les IDs des produits chargés
        const productIds = productsData.map(p => p.id);
        
        // On cherche toutes les variations liées à ces produits
        const { data: variationsData } = await supabase
          .from('product_variations')
          .select('*')
          .in('product_id', productIds);

        // 4. Fusionner manuellement (Produits + Variations)
        const productsWithVariations = productsData.map(p => ({
          ...p,
          // On attache les variations correspondantes à chaque produit
          product_variations: variationsData?.filter(v => v.product_id === p.id) || []
        }));

        setAllProducts(productsWithVariations);

        // Calcul du prix max
        const prices = productsData.map(p => p.sale_price || p.regular_price || 0).filter(p => p > 0);
        const max = prices.length > 0 ? Math.ceil(Math.max(...prices)) : 200;
        setMaxPrice(max);
        setPriceRange([0, max]);
      }
    } catch (error) {
      console.error('Error loading category:', error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    if (!allProducts) return;

    let filtered = [...allProducts];

    // 1. Filtre Prix
    filtered = filtered.filter(product => {
      const price = product.sale_price || product.regular_price || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // 2. Helper : Vérifie si le produit OU ses variations contiennent le terme cherché
    const productHasAttribute = (product: any, targetNames: string[]) => {
      const targets = targetNames.map(t => t.toLowerCase());
      const collectedValues: string[] = [];

      // A. Scan attributs produit principal
      if (product.attributes && typeof product.attributes === 'object') {
        Object.values(product.attributes).forEach((values: any) => {
          if (Array.isArray(values)) {
            values.forEach(val => {
              const valStr = String(val);
              if (termMap.has(valStr)) {
                collectedValues.push(termMap.get(valStr)!.toLowerCase());
              } else {
                collectedValues.push(valStr.toLowerCase());
              }
            });
          } else if (typeof values === 'string') {
             collectedValues.push(values.toLowerCase());
          }
        });
      }

      // B. Scan des variations (Manuellement attachées)
      if (product.product_variations && Array.isArray(product.product_variations)) {
        product.product_variations.forEach((variation: any) => {
          if (variation.attributes && typeof variation.attributes === 'object') {
             Object.values(variation.attributes).forEach((val: any) => {
                if (typeof val === 'string') {
                   collectedValues.push(val.toLowerCase());
                } else if (typeof val === 'object') {
                   if (val?.name) collectedValues.push(String(val.name).toLowerCase());
                   if (val?.option) collectedValues.push(String(val.option).toLowerCase());
                }
             });
          }
        });
      }

      return targets.some(target => collectedValues.includes(target));
    };

    // --- Application des filtres ---
    if (activeFilters.sizes.length > 0) {
      filtered = filtered.filter(p => productHasAttribute(p, activeFilters.sizes));
    }
    if (activeFilters.colors.length > 0) {
      filtered = filtered.filter(p => productHasAttribute(p, activeFilters.colors));
    }
    if (activeFilters.comfort.length > 0) {
      filtered = filtered.filter(p => productHasAttribute(p, activeFilters.comfort));
    }
    if (activeFilters.coupe.length > 0) {
      filtered = filtered.filter(p => productHasAttribute(p, activeFilters.coupe));
    }
    if (activeFilters.live) {
       filtered = filtered.filter(p => productHasAttribute(p, ["Vu dans le dernier Live !", "Live"]));
    }
    if (activeFilters.nouveautes) {
       filtered = filtered.filter(p => productHasAttribute(p, ["Nouveautés", "Nouveau"]));
    }

    setFilteredProducts(filtered);
  }

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center"><div className="text-gray-600">Chargement...</div></div>;
  }

  const displayProducts = filteredProducts;
  const categoryName = slug === 'tous' ? 'Tous les Produits' : category?.name || '';

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-sm text-gray-900 mb-4 flex items-center gap-2">
          <span className="bg-[#D4AF37] w-1 h-4 rounded-full"></span> Prix
        </h3>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            max={maxPrice}
            step={1}
            className="my-4"
          />
          <div className="flex justify-between text-sm text-gray-600 font-medium">
            <span>{priceRange[0]}€</span>
            <span>{priceRange[1]}€</span>
          </div>
        </div>
      </div>
      <Separator />
      <ProductFilters 
        categorySlug={slug === 'tous' ? undefined : slug} 
        onFiltersChange={setActiveFilters} 
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/30">
      <main className="container mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center text-gray-600 hover:text-[#D4AF37] mb-6 transition-smooth text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à l'accueil
        </Link>

        <div className="flex flex-col lg:flex-row gap-8">
          
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 bg-white rounded-xl shadow-sm border border-gray-100 p-5 overflow-y-auto max-h-[calc(100vh-8rem)]">
              <div className="flex items-center gap-2 mb-6 text-[#D4AF37] font-bold text-lg">
                <Filter className="w-5 h-5" /> Filtres
              </div>
              <FilterContent />
            </div>
          </aside>

          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{categoryName}</h1>
                {category?.description && (
                  <p className="text-gray-500 mt-1 text-sm">{category.description}</p>
                )}
              </div>

              <div className="flex items-center gap-3 lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="rounded-xl border-gray-300 hover:border-[#D4AF37] hover:text-[#D4AF37]">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filtres
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
                    <SheetHeader className="mb-6 text-left">
                      <SheetTitle className="text-2xl font-bold text-[#D4AF37]">Filtres</SheetTitle>
                    </SheetHeader>
                    <FilterContent />
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            <div className="mb-6">
              <Badge variant="secondary" className="px-3 py-1 bg-white border border-gray-200 text-gray-600">
                {displayProducts.length} résultat{displayProducts.length > 1 ? 's' : ''}
              </Badge>
            </div>

            {displayProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                <div className="text-4xl mb-4">🧐</div>
                <p className="text-xl text-gray-900 font-medium mb-2">Aucun produit ne correspond à vos critères</p>
                <p className="text-gray-500 mb-6">Essayez de modifier vos filtres pour voir plus de résultats.</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setPriceRange([0, maxPrice]);
                    window.location.reload(); 
                  }} 
                  className="text-[#D4AF37] border-[#D4AF37] hover:bg-[#FFF9F0]"
                >
                  Réinitialiser les filtres
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayProducts.map((product) => (
                  <ProductCard key={product.id} product={product} showAddToCart={true} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}