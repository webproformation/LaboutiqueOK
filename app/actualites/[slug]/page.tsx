'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Calendar, Tag, Share2, Facebook, Twitter, Link2, Check, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface NewsCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface NewsPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image_url: string | null;
  published_at: string;
  seo_title: string | null;
  meta_description: string | null;
  meta_social_title: string | null;
  meta_social_description: string | null;
  meta_social_image: string | null;
  news_post_categories: Array<{
    news_categories: NewsCategory | NewsCategory[];
  }>;
}

export default function NewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<NewsPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<NewsPost[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadPost();
  }, [slug]);

  const loadPost = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('news_posts')
        .select(`
          id,
          title,
          slug,
          content,
          excerpt,
          featured_image_url,
          published_at,
          seo_title,
          meta_description,
          meta_social_title,
          meta_social_description,
          meta_social_image,
          news_post_categories (
            news_categories (
              id,
              name,
              slug,
              color
            )
          )
        `)
        .eq('slug', slug)
        .eq('status', 'publish')
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        router.push('/actualites');
        return;
      }

      const formattedData = {
        ...data,
        news_post_categories: data.news_post_categories.map((pc: any) => ({
          news_categories: Array.isArray(pc.news_categories) ? pc.news_categories[0] : pc.news_categories
        }))
      };

      setPost(formattedData);

      if (formattedData.news_post_categories.length > 0) {
        const category = formattedData.news_post_categories[0].news_categories;
        const categoryId = Array.isArray(category) ? category[0].id : category.id;
        loadRelatedPosts(formattedData.id, categoryId);
      }
    } catch (error) {
      console.error('Error loading post:', error);
      toast.error('Erreur lors du chargement de l\'article');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedPosts = async (currentPostId: string, categoryId: string) => {
    try {
      const { data: postCategoriesData } = await supabase
        .from('news_post_categories')
        .select('post_id')
        .eq('category_id', categoryId)
        .neq('post_id', currentPostId)
        .limit(3);

      if (!postCategoriesData || postCategoriesData.length === 0) return;

      const postIds = postCategoriesData.map(pc => pc.post_id);

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
        .order('published_at', { ascending: false })
        .limit(3);

      if (error) throw error;

      const formattedRelatedPosts = (data || []).map((post: any) => ({
        ...post,
        content: '',
        seo_title: null,
        meta_description: null,
        news_post_categories: post.news_post_categories.map((pc: any) => ({
          news_categories: Array.isArray(pc.news_categories) ? pc.news_categories[0] : pc.news_categories
        }))
      }));

      setRelatedPosts(formattedRelatedPosts);
    } catch (error) {
      console.error('Error loading related posts:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Lien copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-[#FBF8F1] to-[#F2F2E8]">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="h-12 bg-gray-200 rounded w-3/4" />
            <div className="h-96 bg-gray-200 rounded" />
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  const primaryCategoryData = post.news_post_categories[0]?.news_categories;
  const primaryCategory = Array.isArray(primaryCategoryData) ? primaryCategoryData[0] : primaryCategoryData;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#FBF8F1] to-[#F2F2E8]">
      <article className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/actualites" className="inline-flex items-center text-gray-600 hover:text-[#C6A15B] mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux actualités
        </Link>

        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-3 flex-wrap">
            {post.news_post_categories.map(({ news_categories }, idx) => {
              const category = Array.isArray(news_categories) ? news_categories[0] : news_categories;
              return (
                <Badge
                  key={category.id || idx}
                  className="text-white font-semibold"
                  style={{ backgroundColor: category.color }}
                >
                  {category.name}
                </Badge>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col items-center text-center mb-8">
          <BookOpen className="w-8 h-8 text-[#D4AF37] mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold text-[#D4AF37] leading-tight">
            {post.title}
          </h1>
        </div>

        <div className="flex items-center justify-center gap-6 text-gray-600 mb-8">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span>{formatDate(post.published_at)}</span>
          </div>
        </div>

        {post.featured_image_url && (
          <div className="mb-10 rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {post.excerpt && (
          <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#C6A15B]/10 border-l-4 border-[#D4AF37] p-6 rounded-lg mb-8 backdrop-blur-sm">
            <p className="text-lg text-gray-800 italic leading-relaxed">
              {post.excerpt}
            </p>
          </div>
        )}

        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 mb-12 shadow-sm border border-gray-100">
          <div
            className="news-content"
            dangerouslySetInnerHTML={{ __html: post.content || '' }}
          />
        </div>

        <Separator className="my-8" />

        <div className="flex items-center justify-between flex-wrap gap-4 py-6">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-gray-600" />
            <span className="font-semibold text-gray-700">Partager :</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')}
              className="hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600"
            >
              <Facebook className="h-4 w-4 mr-2" />
              Facebook
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`, '_blank')}
              className="hover:bg-sky-50 hover:border-sky-500 hover:text-sky-600"
            >
              <Twitter className="h-4 w-4 mr-2" />
              Twitter
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="hover:bg-gray-100"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  Copié
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Copier le lien
                </>
              )}
            </Button>
          </div>
        </div>

        {relatedPosts.length > 0 && (
          <>
            <Separator className="my-12" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Articles similaires</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Link
                    key={relatedPost.id}
                    href={`/actualites/${relatedPost.slug}`}
                    className="group block bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-all"
                  >
                    {relatedPost.featured_image_url && (
                      <div className="h-40 overflow-hidden">
                        <img
                          src={relatedPost.featured_image_url}
                          alt={relatedPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#C6A15B] transition-colors">
                        {relatedPost.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {relatedPost.excerpt}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </article>
    </div>
  );
}
