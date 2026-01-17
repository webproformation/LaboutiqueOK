'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, Product, ProductCategory } from '@/lib/supabase';
import { ArrowLeft, SlidersHorizontal } from 'lucide-react';
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
      // 1. Charger le dictionnaire des termes (pour faire le lien Nom <-> ID)
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

        // Récupérer les IDs des produits de cette catégorie
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
        // Calcul du prix max dynamique
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

    // 2. Filtres Attributs (Tailles, Couleurs, etc.)
    // On prépare une fonction helper pour vérifier si un produit a un terme donné
    const productHasTerm = (product: Product, termIdsToCheck: string[]) => {
      if (!product.attributes || typeof product.attributes !== 'object') return false;
      
      // On collecte tous les IDs de termes du produit (depuis le JSON attributes)
      const productTermIds: string[] = [];
      Object.values(product.attributes).forEach((ids: any) => {
        if (Array.isArray(ids)) {
          ids.forEach(id => productTermIds.push(String(id)));
        }
      });

      // On vérifie s'il y a une intersection
      return termIdsToCheck.some(id => productTermIds.includes(String(id)));
    };

    // --- Filtre Tailles ---
    if (activeFilters.sizes.length > 0) {
      // Trouver les IDs correspondants aux tailles sélectionnées (ex: "38", "40")
      const sizeTermIds = termsData
        .filter(t => activeFilters.sizes.includes(Number(t.name)) || activeFilters.sizes.includes(t.name))
        .map(t => t.id);
      
      // Si on ne trouve pas les termes, on filtre tout (sécurité), sinon on filtre
      if (sizeTermIds.length > 0) {
        filtered = filtered.filter(p => productHasTerm(p, sizeTermIds));
      }
    }

    // --- Filtre Famille de Couleur ---
    if (activeFilters.colorFamilies.length > 0) {
      const colorTermIds = termsData
        .filter(t => activeFilters.colorFamilies.includes(t.color_family))
        .map(t => t.id);
        
      if (colorTermIds.length > 0) {
        filtered = filtered.filter(p => productHasTerm(p, colorTermIds));
      }
    }

    // --- Filtre Confort ---
    if (activeFilters.comfort.length > 0) {
      const comfortTermIds = termsData
        .filter(t => activeFilters.comfort.includes(t.slug))
        .map(t => t.id);
        
      if (comfortTermIds.length > 0) {
        filtered = filtered.filter(p => productHasTerm(p, comfortTermIds));
      }
    }

    // --- Filtre Coupe ---
    if (activeFilters.coupe.length > 0) {
      const coupeTermIds = termsData
        .filter(t => activeFilters.coupe.includes(t.slug))
        .map(t => t.id);
        
      if (coupeTermIds.length > 0) {
        filtered = filtered.filter(p => productHasTerm(p, coupeTermIds));
      }
    }

    // --- Filtre Live & Nouveautés ---
    // (Suppose que ce sont aussi des tags/termes ou des champs spécifiques, 
    // ici on assume que ce sont des termes dans les attributs comme "Vu en live")
    if (activeFilters.live) {
       // On cherche un terme qui contient "live" dans son slug ou nom
       const liveTermIds = termsData
         .filter(t => t.slug.includes('live') || t.name.toLowerCase().includes('live'))
         .map(t => t.id);
       if (liveTermIds.length > 0) filtered = filtered.filter(p => productHasTerm(p, liveTermIds));
    }

    if (activeFilters.nouveautes) {
       // Idem pour nouveautés
       const newTermIds = termsData
         .filter(t => t.slug.includes('nouveau') || t.name.toLowerCase().includes('nouvea'))
         .map(t => t.id);
       if (newTermIds.length > 0) filtered = filtered.filter(p => productHasTerm(p, newTermIds));
    }

    setFilteredProducts(filtered);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-600">Chargement...</div>
        </div>
      </div>
    );
  }

  const displayProducts = filteredProducts;
  const categoryName = slug === 'tous' ? 'Tous les Produits' : category?.name || '';

  return (
    <div className="min-h-screen bg-white">

      <main className="container mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center text-gray-600 hover:text-[#D4AF37] mb-8 transition-smooth"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour à l'accueil
        </Link>

        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-gray-900">{categoryName}</h1>
            {category?.description && (
              <p className="text-gray-600">{category.description}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              {displayProducts.length} produit{displayProducts.length > 1 ? 's' : ''} trouvé{displayProducts.length > 1 ? 's' : ''}
            </p>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="rounded-xl border-2 hover:border-[#D4AF37] hover:text-[#D4AF37]">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filtres & Tri
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader className="mb-6">
                <SheetTitle>Filtres</SheetTitle>
              </SheetHeader>
              
              <div className="space-y-8 pb-8">
                {/* Section Prix */}
                <div>
                  <h3 className="font-semibold text-sm text-gray-900 mb-4">Prix</h3>
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

                {/* Composant de Filtres Avancés */}
                <ProductFilters 
                  categorySlug={slug === 'tous' ? undefined : slug} 
                  onFiltersChange={setActiveFilters} 
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {displayProducts.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl">
            <p className="text-xl text-gray-600 font-medium">Aucun produit ne correspond à vos critères 🧐</p>
            <Button 
              variant="link" 
              onClick={() => {
                setPriceRange([0, maxPrice]);
                // On pourrait ajouter une fonction resetFilters ici
              }} 
              className="text-[#D4AF37] mt-2"
            >
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayProducts.map((product) => (
              <ProductCard key={product.id} product={product} showAddToCart={true} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}