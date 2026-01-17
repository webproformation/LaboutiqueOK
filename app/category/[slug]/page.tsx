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
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtres
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [maxPrice, setMaxPrice] = useState(200);
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    sizes: [],
    colorFamilies: [],
    comfort: [],
    coupe: [],
    live: false,
    nouveautes: false,
  });

  // Dictionnaire pour traduire les filtres en IDs techniques
  const [termsData, setTermsData] = useState<any[]>([]);

  useEffect(() => {
    loadCategoryAndProducts();
  }, [slug]);

  useEffect(() => {
    applyFilters();
  }, [priceRange, activeFilters, allProducts, termsData]);

  async function loadCategoryAndProducts() {
    setLoading(true);
    try {
      // 1. Charger le dictionnaire des termes
      const { data: terms } = await supabase
        .from('product_attribute_terms')
        .select('id, name, slug, color_family');
      
      if (terms) setTermsData(terms);

      // 2. Charger les produits
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

      const { data: productsData } = await productsQuery;

      if (productsData) {
        setAllProducts(productsData);
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

    // 2. Filtres Attributs
    const productHasTerm = (product: Product, termIdsToCheck: string[]) => {
      if (!product.attributes || typeof product.attributes !== 'object') return false;
      const productTermIds: string[] = [];
      // On scanne le JSON attributes du produit
      Object.values(product.attributes).forEach((ids: any) => {
        if (Array.isArray(ids)) {
          ids.forEach(id => productTermIds.push(String(id)));
        }
      });
      return termIdsToCheck.some(id => productTermIds.includes(String(id)));
    };

    if (activeFilters.sizes.length > 0) {
      const sizeTermIds = termsData
        .filter(t => activeFilters.sizes.includes(Number(t.name)) || activeFilters.sizes.includes(t.name))
        .map(t => t.id);
      if (sizeTermIds.length > 0) filtered = filtered.filter(p => productHasTerm(p, sizeTermIds));
    }

    if (activeFilters.colorFamilies.length > 0) {
      const colorTermIds = termsData
        .filter(t => activeFilters.colorFamilies.includes(t.color_family))
        .map(t => t.id);
      if (colorTermIds.length > 0) filtered = filtered.filter(p => productHasTerm(p, colorTermIds));
    }

    if (activeFilters.comfort.length > 0) {
      const comfortTermIds = termsData.filter(t => activeFilters.comfort.includes(t.slug)).map(t => t.id);
      if (comfortTermIds.length > 0) filtered = filtered.filter(p => productHasTerm(p, comfortTermIds));
    }

    if (activeFilters.coupe.length > 0) {
      const coupeTermIds = termsData.filter(t => activeFilters.coupe.includes(t.slug)).map(t => t.id);
      if (coupeTermIds.length > 0) filtered = filtered.filter(p => productHasTerm(p, coupeTermIds));
    }

    if (activeFilters.live) {
       const liveTermIds = termsData.filter(t => t.slug.includes('live') || t.name.toLowerCase().includes('live')).map(t => t.id);
       if (liveTermIds.length > 0) filtered = filtered.filter(p => productHasTerm(p, liveTermIds));
    }

    if (activeFilters.nouveautes) {
       const newTermIds = termsData.filter(t => t.slug.includes('nouveau') || t.name.toLowerCase().includes('nouvea')).map(t => t.id);
       if (newTermIds.length > 0) filtered = filtered.filter(p => productHasTerm(p, newTermIds));
    }

    setFilteredProducts(filtered);
  }

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center"><div className="text-gray-600">Chargement...</div></div>;
  }

  const displayProducts = filteredProducts;
  const categoryName = slug === 'tous' ? 'Tous les Produits' : category?.name || '';

  // Contenu des filtres (réutilisé pour Desktop et Mobile)
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
          
          {/* --- SIDEBAR FILTRES (VISIBLE SUR DESKTOP) --- */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 bg-white rounded-xl shadow-sm border border-gray-100 p-5 overflow-y-auto max-h-[calc(100vh-8rem)]">
              <div className="flex items-center gap-2 mb-6 text-[#D4AF37] font-bold text-lg">
                <Filter className="w-5 h-5" /> Filtres
              </div>
              <FilterContent />
            </div>
          </aside>

          {/* --- CONTENU PRINCIPAL --- */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{categoryName}</h1>
                {category?.description && (
                  <p className="text-gray-500 mt-1 text-sm">{category.description}</p>
                )}
              </div>

              {/* --- BOUTON FILTRES (VISIBLE SUR MOBILE SEULEMENT) --- */}
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
                    window.location.reload(); // Reset simple
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