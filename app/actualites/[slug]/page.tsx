'use client';

import { useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client/core';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, ArrowLeft, Tag } from 'lucide-react';
import ShareButtons from '@/components/ShareButtons';

const GET_POST_BY_SLUG = gql`
  query GetPostBySlug($slug: ID!) {
    post(id: $slug, idType: SLUG) {
      id
      title
      content
      excerpt
      date
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
      categories {
        nodes {
          id
          name
          slug
        }
      }
    }
  }
`;

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  date: string;
  featuredImage?: {
    node: {
      sourceUrl: string;
      altText: string;
    };
  };
  categories: {
    nodes: Array<{
      id: string;
      name: string;
      slug: string;
    }>;
  };
}

interface GetPostBySlugResponse {
  post: Post;
}

export default function PostPage() {
  const params = useParams();
  const rawSlug = params.slug as string;
  const slug = decodeURIComponent(rawSlug);

  const { loading, data } = useQuery<GetPostBySlugResponse>(GET_POST_BY_SLUG, {
    variables: { slug },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
            <div className="h-12 bg-gray-200 rounded w-3/4 mb-4" />
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-8" />
            <div className="h-96 bg-gray-200 rounded mb-8" />
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

  const post = data?.post;

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Article non trouvé</h1>
          <Link
            href="/actualites"
            className="inline-flex items-center text-[#b8933d] hover:text-[#a07c2f] transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux actualités
          </Link>
        </div>
      </div>
    );
  }

  const imageUrl = post.featuredImage?.node.sourceUrl || 'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=1200';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link
          href="/actualites"
          className="inline-flex items-center text-[#b8933d] hover:text-[#a07c2f] transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux actualités
        </Link>

        <article className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="relative h-96">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${imageUrl})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              {post.categories.nodes.map((category) => (
                <Link
                  key={category.id}
                  href={`/actualites?category=${category.slug}`}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-[#b8933d] text-white text-sm font-semibold rounded-full hover:bg-[#a07c2f] transition-colors"
                >
                  <Tag className="h-3 w-3" />
                  {category.name}
                </Link>
              ))}
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(post.date)}</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {post.title}
            </h1>

            <div className="flex justify-end mb-6">
              <ShareButtons
                title={post.title}
                description={post.excerpt || post.content}
                imageUrl={imageUrl}
              />
            </div>

            <div
              className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-[#b8933d] hover:prose-a:text-[#a07c2f] prose-strong:text-gray-900 prose-img:rounded-lg"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </article>

        <div className="mt-8">
          <Link
            href="/actualites"
            className="inline-flex items-center text-[#b8933d] hover:text-[#a07c2f] transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux actualités
          </Link>
        </div>
      </div>
    </div>
  );
}
