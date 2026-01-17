'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import NewsCard from '@/components/NewsCard';
import { BookOpen, Sparkles, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/PageHeader';

interface NewsCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
  count: number;
}

interface NewsPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image_url: string | null;
  published_at: string;
  news_post_categories: Array<{
    news_categories: NewsCategory;
  }>;
}

function ActualitesContent() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get('category');

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [categoryName, setCategoryName] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
    loadPosts();
  }, [categorySlug]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('news_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadPosts = async () => {
    try {
      setLoading(true);

      if (categorySlug) {
        const { data: categoryData } = await supabase
          .from('news_categories')
          .select('id, name')
          .eq('slug', categorySlug)
          .maybeSingle();

        if (categoryData) {
          setCategoryName(categoryData.name);

          const { data: postCategoriesData } = await supabase
            .from('news_post_categories')
            .select('post_id')
            .eq('category_id', categoryData.id);

          const postIds = (postCategoriesData || []).map(pc => pc.post_id);

          if (postIds.length === 0) {
            setPosts([]);
            setLoading(false);
            return;
          }

          const { data, error } = await supabase
            .from('news_posts')
            .select(`
              id,
              title,
              slug,
              excerpt,
              featured_image_url,
              published_at,
              news_post_categories (
                news_categories (
                  id,
                  name,
                  slug,
                  color
                )
              )
            `)
            .in('id', postIds)
            .eq('status', 'publish')
            .lte('published_at', new Date().toISOString())
            .order('published_at', { ascending: false });

          if (error) throw error;

          const formattedPosts = (data || []).map((post: any) => ({
            ...post,
            news_post_categories: post.news_post_categories.map((pc: any) => ({
              news_categories: Array.isArray(pc.news_categories) ? pc.news_categories[0] : pc.news_categories
            }))
          }));

          setPosts(formattedPosts);
        }
      } else {
        const { data, error } = await supabase
          .from('news_posts')
          .select(`
            id,
            title,
            slug,
            excerpt,
            featured_image_url,
            published_at,
            news_post_categories (
              news_categories (
                id,
                name,
                slug,
                color
              )
            )
          `)
          .eq('status', 'publish')
          .lte('published_at', new Date().toISOString())
          .order('published_at', { ascending: false });

        if (error) throw error;

        const formattedPosts = (data || []).map((post: any) => ({
          ...post,
          news_post_categories: post.news_post_categories.map((pc: any) => ({
            news_categories: Array.isArray(pc.news_categories) ? pc.news_categories[0] : pc.news_categories
          }))
        }));

        setPosts(formattedPosts);
        setCategoryName(null);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-md animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4">
        <PageHeader
          icon={BookOpen}
          title={categoryName || 'Le Carnet de Morgane'}
          description={
            categoryName
              ? `${posts.length} article${posts.length > 1 ? 's' : ''} dans cette catégorie`
              : 'Le coin des confidences, de la mode et du lifestyle'
          }
        />

        {categories.length > 0 && (
          <div className="mb-8 flex items-center gap-3 flex-wrap">
            <Filter className="h-5 w-5 text-gray-500" />
            <Button
              variant={!categorySlug ? 'default' : 'outline'}
              size="sm"
              onClick={() => window.location.href = '/actualites'}
              className={!categorySlug ? 'bg-[#C6A15B] hover:bg-[#b8933d]' : ''}
            >
              Toutes
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={categorySlug === cat.slug ? 'default' : 'outline'}
                size="sm"
                onClick={() => window.location.href = `/actualites?category=${cat.slug}`}
                className={categorySlug === cat.slug ? 'text-white' : ''}
                style={categorySlug === cat.slug ? { backgroundColor: cat.color } : {}}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        )}

        {posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <BookOpen className="h-20 w-20 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-700 mb-3">
                Aucune actualité pour le moment
              </h2>
              <p className="text-gray-500 text-lg">
                Revenez bientôt pour découvrir nos dernières nouvelles
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {posts.map((post) => (
              <NewsCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ActualitesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Chargement...</div>
      </div>
    }>
      <ActualitesContent />
    </Suspense>
  );
}
