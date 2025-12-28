'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import { GET_PRODUCTS_BY_CATEGORY } from '@/lib/queries';
import { createClient } from '@/lib/supabase-client';
import ProductCard from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';
import { Sparkles, Heart } from 'lucide-react';

interface ProductsData {
  products: {
    nodes: Product[];
  };
}

interface Look {
  id: string;
  title: string;
  slug: string;
  description: string;
  hero_image_url: string;
  discount_percentage: number;
}

export default function LesLooksDeMorganePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('acheter-le-look');
  const [looks, setLooks] = useState<Look[]>([]);
  const [looksLoading, setLooksLoading] = useState(false);

  const categories = [
    { id: 'acheter-le-look', name: "✨ Acheter le Look", slug: null },
    { id: 'ambiance', name: "L'ambiance de la semaine", slug: 'lambiance-de-la-semaine' },
    { id: 'coups-de-coeur', name: 'Les coups de coeur de Morgane', slug: 'les-coups-de-coeur-de-morgane' },
    { id: 'look', name: 'Le look de la semaine by Morgane', slug: 'le-look-de-la-semaine-by-morgane' },
  ];

  useEffect(() => {
    if (activeTab === 'acheter-le-look') {
      fetchLooks();
    }
  }, [activeTab]);

  const fetchLooks = async () => {
    setLooksLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('looks')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setLooks(data || []);
    } catch (error) {
      console.error('Error fetching looks:', error);
    } finally {
      setLooksLoading(false);
    }
  };

  const currentCategory = categories.find(cat => cat.id === activeTab);

  const { loading, data } = useQuery<ProductsData>(GET_PRODUCTS_BY_CATEGORY, {
    variables: {
      categorySlug: currentCategory?.slug,
      first: 50,
    },
    skip: !currentCategory,
  });

  const products = data?.products?.nodes || [];

  return (
    <div className="min-h-screen bg-[#F2F2E8]">
      <div className="relative h-64 md:h-96 bg-gradient-to-r from-[#D4AF37] to-[#b8933d] flex items-center justify-center">
        <div className="text-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Les Looks de Morgane</h1>
          <p className="text-lg md:text-xl">Découvrez mes sélections exclusives</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 mb-8 bg-white p-2 rounded-lg shadow-lg h-auto">
            {categories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="text-sm md:text-base py-3 px-4 data-[state=active]:bg-[#D4AF37] data-[state=active]:text-white"
              >
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="acheter-le-look">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-[#D4AF37] mb-4 flex items-center justify-center gap-2">
                <Sparkles className="h-8 w-8" />
                Acheter le Look
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Découvrez les looks complets de Morgane avec une remise exclusive de 5% !
              </p>
            </div>

            {looksLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-96 w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : looks.length === 0 ? (
              <div className="text-center py-16">
                <Sparkles className="h-16 w-16 mx-auto text-[#D4AF37] mb-4" />
                <p className="text-gray-600 text-lg">
                  Aucun look disponible pour le moment.
                </p>
                <p className="text-gray-500 mt-2">
                  Revenez bientôt pour découvrir les nouveaux looks de Morgane !
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {looks.map((look) => (
                  <Card key={look.id} className="group hover:shadow-xl transition-shadow overflow-hidden cursor-pointer" onClick={() => router.push(`/look/${look.slug}`)}>
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img
                        src={look.hero_image_url}
                        alt={look.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-[#D4AF37] text-white">
                          -{look.discount_percentage}%
                        </Badge>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                        <h3 className="text-white font-bold text-xl mb-1">{look.title}</h3>
                        {look.description && (
                          <p className="text-white/90 text-sm line-clamp-2">{look.description}</p>
                        )}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <Button className="w-full bg-[#D4AF37] hover:bg-[#B8941F] text-white">
                        <Heart className="mr-2 h-4 w-4" />
                        Découvrir le look
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {categories.filter(cat => cat.slug).map((category) => (
            <TabsContent key={category.id} value={category.id}>
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-[#D4AF37] mb-4">{category.name}</h2>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="space-y-4">
                      <Skeleton className="h-80 w-full rounded-lg" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-gray-600 text-lg">
                    Aucun produit dans cette catégorie pour le moment.
                  </p>
                  <p className="text-gray-500 mt-2">
                    Revenez bientôt pour découvrir les nouvelles sélections de Morgane !
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
