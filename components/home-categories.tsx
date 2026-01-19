'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { SectionTitle } from '@/components/ui/SectionTitle';

interface HomeCategory {
  id: string;
  name: string;
  category_slug: string;
  image_url: string;
  count: number;
}

// Structure simplifiée pour gérer la hiérarchie
interface CategorySimple {
  id: string;
  parent_id: string | null;
  slug: string;
}

export function HomeCategories() {
  const [categories, setCategories] = useState<HomeCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHomeCategories() {
      try {
        // 1. Récupération de la config Accueil
        const { data: homeData, error: homeError } = await supabase
          .from('home_categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (homeError) throw homeError;

        if (homeData && homeData.length > 0) {
          
          // 2. Récupération de l'arbre des catégories
          const { data: allCategories } = await supabase
            .from('categories')
            .select('id, parent_id, slug');

          const categoriesTree = (allCategories || []) as CategorySimple[];

          const getAllDescendantIds = (parentId: string): string[] => {
            const children = categoriesTree.filter(c => c.parent_id === parentId);
            let ids = children.map(c => c.id);
            children.forEach(child => {
              ids = [...ids, ...getAllDescendantIds(child.id)];
            });
            return ids;
          };

          // 3. Comptage Hybride (Colonne directe + Table de liaison)
          const mergedCategories = await Promise.all(homeData.map(async (homeCat) => {
            const rootCat = categoriesTree.find(c => c.slug === homeCat.category_slug);
            let uniqueProductIds = new Set<string>(); // Utilisation d'un Set pour éviter les doublons

            if (rootCat) {
                const allRelatedIds = [rootCat.id, ...getAllDescendantIds(rootCat.id)];

                // A. Chercher dans la table 'products' (colonne category_id)
                const { data: productsDirect } = await supabase
                    .from('products')
                    .select('id')
                    .in('category_id', allRelatedIds)
                    .eq('status', 'publish');
                
                productsDirect?.forEach(p => uniqueProductIds.add(p.id));

                // B. Chercher dans la table de liaison 'product_category_mapping'
                // CORRECTION ICI : Nom de table mis à jour
                const { data: productsLinked } = await supabase
                    .from('product_category_mapping')
                    .select('product_id')
                    .in('category_id', allRelatedIds);

                // On doit vérifier que ces produits sont bien publiés
                if (productsLinked && productsLinked.length > 0) {
                    const linkedIds = productsLinked.map(p => p.product_id);
                    const { data: publishedLinked } = await supabase
                        .from('products')
                        .select('id')
                        .in('id', linkedIds)
                        .eq('status', 'publish');
                    
                    publishedLinked?.forEach(p => uniqueProductIds.add(p.id));
                }
            }

            return {
              ...homeCat,
              count: uniqueProductIds.size
            };
          }));

          setCategories(mergedCategories);
        }
      } catch (error) {
        console.error('Erreur chargement catégories accueil:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchHomeCategories();
  }, []);

  if (loading) return null;
  if (categories.length === 0) return null;

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        
        <SectionTitle 
          title="Nos Catégories" 
          subtitle="Explorez nos univers et trouvez votre style"
          icon={ShoppingBag}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((category, index) => {
            const isLastAndOdd = index === categories.length - 1 && categories.length % 2 !== 0;
            
            return (
              <Link 
                key={category.id} 
                href={`/category/${category.category_slug}`}
                className={`group relative h-[300px] overflow-hidden rounded-2xl shadow-md block ${
                  isLastAndOdd ? 'md:col-span-2' : ''
                }`}
              >
                {category.image_url ? (
                  <div 
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                      style={{ backgroundImage: `url(${category.image_url})` }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                      <ShoppingBag className="w-12 h-12 text-gray-400" />
                  </div>
                )}

                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                  <h3 className="text-3xl md:text-4xl font-bold text-white font-display drop-shadow-md mb-2">
                    {category.name}
                  </h3>
                  
                  <p className="text-white/90 text-sm font-medium bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                    {category.count} produit{category.count > 1 ? 's' : ''}
                  </p>
                  
                  <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <span className="bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-full text-sm font-medium border border-white/50 hover:bg-white hover:text-[#D4AF37] transition-all">
                          Découvrir
                      </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}