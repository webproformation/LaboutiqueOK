'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, Product, ProductCategory } from '@/lib/supabase';
import { ArrowLeft, SlidersHorizontal, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ProductCard } from '@/components/ProductCard';
import { ProductFilters, FilterState } from '@/components/ProductFilters';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

// Extraction du contenu de la sidebar pour éviter les re-rendus inutiles
const FilterSidebarContent = ({ 
  priceRange, 
  setPriceRange, 
  maxPrice, 
  slug, 
  activeFilters, 
  setActiveFilters 
}: any) => (
  <div className="space-y-6">
    <div>
      <h3 className="font-semibold text-sm text-gray-900 mb-4 flex items-center gap-2">
        <span className="bg-[#D4AF37] w-1 h-4 rounded-full"></span> Prix
      </h3>
      <div className="px-2">
        <Slider value={priceRange} onValueChange={(value) => setPriceRange(value as [number, number])} max={maxPrice} step={1} className="my-4" />
        <div className="flex justify-between text-sm text-gray-600 font-medium"><span>{priceRange[0]}€</span><span>{priceRange[1]}€</span></div>
      </div>
    </div>
    <Separator />
    {/* On passe les props pour que le filtre soit contrôlé par la page */}
    <ProductFilters 
      categorySlug={slug === 'tous' ? undefined : slug} 
      activeFilters={activeFilters}
      onFiltersChange={setActiveFilters} 
    />
  </div>
);

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [maxPrice, setMaxPrice] = useState(200);
  
  // État centralisé des filtres
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    sizes: [], colors: [], comfort: [], coupe: [], live: false, nouveautes: false,
  });

  const [nameToIdsMap, setNameToIdsMap] = useState<Map<string, string[]>>(new Map());

  useEffect(() => { loadCategoryAndProducts(); }, [slug]);
  
  // Le filtre se déclenche quand n'importe quel critère change
  useEffect(() => { applyFilters(); }, [priceRange, activeFilters, allProducts, nameToIdsMap]);

  async function loadCategoryAndProducts() {
    setLoading(true);
    try {
      // 1. Dictionnaire (Termes) pour traduire les IDs
      const { data: terms } = await supabase.from('product_attribute_terms').select('id, name');
      const map = new Map<string, string[]>();
      if (terms) {
        terms.forEach(t => {
          const idStr = String(t.id);
          const nameLower = t.name.toLowerCase();
          if (!map.has(nameLower)) map.set(nameLower, []);
          map.get(nameLower)?.push(idStr);
        });
      }
      setNameToIdsMap(map);

      // 2. Charger les produits
      let productsQuery = supabase.from('products').select('*').eq('status', 'publish').order('created_at', { ascending: false });

      if (slug !== 'tous') {
        const { data: categoryData } = await supabase.from('categories').select('*').eq('slug', slug).maybeSingle();
        if (!categoryData) { router.push('/'); return; }
        setCategory(categoryData);
        
        const { data: mappingData } = await supabase.from('product_category_mapping').select('product_id').eq('category_id', categoryData.id);
        const productIds = mappingData?.map(m => m.product_id) || [];
        
        if (productIds.length > 0) productsQuery = productsQuery.in('id', productIds);
        else { setAllProducts([]); setLoading(false); return; }
      }

      const { data: productsData } = await productsQuery;

      if (productsData) {
        // 3. Charger les variations (Important pour tailles/couleurs)
        const productIds = productsData.map(p => p.id);
        const { data: variationsData } = await supabase.from('product_variations').select('*').in('product_id', productIds);

        // 4. Assembler
        const productsWithVariations = productsData.map(p => ({
          ...p,
          product_variations: variationsData?.filter(v => v.product_id === p.id) || []
        }));

        setAllProducts(productsWithVariations);
        
        // Prix max dynamique
        const prices = productsData.map(p => p.sale_price || p.regular_price || 0).filter(p => p > 0);
        const max = prices.length > 0 ? Math.ceil(Math.max(...prices)) : 200;
        setMaxPrice(max);
        setPriceRange([0, max]);
      }
    } catch (error) { console.error('Error loading category:', error); } 
    finally { setLoading(false); }
  }

  // Fonction récursive pour tout scanner
  const deepExtractValues = (obj: any): string[] => {
    let values: string[] = [];
    if (!obj) return values;
    if (Array.isArray(obj)) {
      obj.forEach(item => values = values.concat(deepExtractValues(item)));
    } else if (typeof obj === 'object') {
      Object.values(obj).forEach(val => values = values.concat(deepExtractValues(val)));
    } else if (typeof obj === 'string' || typeof obj === 'number') {
      values.push(String(obj).toLowerCase());
    }
    return values;
  };

  function applyFilters() {
    if (!allProducts) return;
    let filtered = [...allProducts];

    // 1. Filtre Prix
    filtered = filtered.filter(p => {
      const price = p.sale_price || p.regular_price || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Helper de filtrage
    const productHasAttribute = (product: any, targetNames: string[]) => {
      const targets = new Set<string>();
      targetNames.forEach(name => {
        const lowerName = name.toLowerCase();
        targets.add(lowerName);
        const ids = nameToIdsMap.get(lowerName);
        if (ids) ids.forEach(id => targets.add(id));
      });

      // On crée un gros sac avec tous les textes trouvés dans le produit (attributs + variations)
      const allProductValues = new Set([
        ...deepExtractValues(product.attributes),
        ...(product.product_variations ? deepExtractValues(product.product_variations) : [])
      ]);

      // Si l'un des termes cherchés est dans le sac, c'est gagné
      for (const target of targets) {
        if (allProductValues.has(target)) return true;
      }
      return false;
    };

    // 2. Filtres Attributs
    if (activeFilters.sizes.length > 0) filtered = filtered.filter(p => productHasAttribute(p, activeFilters.sizes));
    if (activeFilters.colors.length > 0) filtered = filtered.filter(p => productHasAttribute(p, activeFilters.colors));
    if (activeFilters.comfort.length > 0) filtered = filtered.filter(p => productHasAttribute(p, activeFilters.comfort));
    if (activeFilters.coupe.length > 0) filtered = filtered.filter(p => productHasAttribute(p, activeFilters.coupe));
    
    if (activeFilters.live) filtered = filtered.filter(p => productHasAttribute(p, ["Vu dans le dernier Live !", "Live"]));
    if (activeFilters.nouveautes) filtered = filtered.filter(p => productHasAttribute(p, ["Nouveautés", "Nouveau"]));

    setFilteredProducts(filtered);
  }

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="text-gray-600">Chargement...</div></div>;

  const displayProducts = filteredProducts;
  const categoryName = slug === 'tous' ? 'Tous les Produits' : category?.name || '';

  return (
    <div className="min-h-screen bg-gray-50/30">
      <main className="container mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center text-gray-600 hover:text-[#D4AF37] mb-6 transition-smooth text-sm font-medium"><ArrowLeft className="w-4 h-4 mr-2" /> Retour à l'accueil</Link>
        
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 bg-white rounded-xl shadow-sm border border-gray-100 p-5 overflow-y-auto max-h-[calc(100vh-8rem)]">
              <div className="flex items-center gap-2 mb-6 text-[#D4AF37] font-bold text-lg"><Filter className="w-5 h-5" /> Filtres</div>
              <FilterSidebarContent 
                priceRange={priceRange} setPriceRange={setPriceRange} maxPrice={maxPrice} 
                slug={slug} activeFilters={activeFilters} setActiveFilters={setActiveFilters} 
              />
            </div>
          </aside>

          {/* Contenu Principal */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{categoryName}</h1>
                {category?.description && <p className="text-gray-500 mt-1 text-sm">{category.description}</p>}
              </div>
              
              {/* Bouton Filtres Mobile */}
              <div className="flex items-center gap-3 lg:hidden">
                <Sheet>
                  <SheetTrigger asChild><Button variant="outline" className="rounded-xl border-gray-300 hover:border-[#D4AF37] hover:text-[#D4AF37]"><SlidersHorizontal className="h-4 w-4 mr-2" /> Filtres</Button></SheetTrigger>
                  <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
                    <SheetHeader className="mb-6 text-left"><SheetTitle className="text-2xl font-bold text-[#D4AF37]">Filtres</SheetTitle></SheetHeader>
                    <FilterSidebarContent 
                      priceRange={priceRange} setPriceRange={setPriceRange} maxPrice={maxPrice} 
                      slug={slug} activeFilters={activeFilters} setActiveFilters={setActiveFilters} 
                    />
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            <div className="mb-6"><Badge variant="secondary" className="px-3 py-1 bg-white border border-gray-200 text-gray-600">{displayProducts.length} résultat{displayProducts.length > 1 ? 's' : ''}</Badge></div>

            {displayProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                <div className="text-4xl mb-4">🧐</div>
                <p className="text-xl text-gray-900 font-medium mb-2">Aucun produit ne correspond à vos critères</p>
                <Button variant="outline" onClick={() => { setPriceRange([0, maxPrice]); window.location.reload(); }} className="text-[#D4AF37] border-[#D4AF37] hover:bg-[#FFF9F0]">Réinitialiser les filtres</Button>
              </div>
            ) : (
              // ICI : Changement pour 4 colonnes (lg:grid-cols-4)
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {displayProducts.map((product) => <ProductCard key={product.id} product={product} showAddToCart={true} />)}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}