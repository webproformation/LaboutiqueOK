'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import SeoMetadataEditor from '@/components/SeoMetadataEditor';
import { useQuery } from '@apollo/client/react';
import { GET_POST_BY_SLUG } from '@/lib/queries';
import { GetPostBySlugResponse } from '@/types';

export default function ActualiteSeoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { loading, data } = useQuery<GetPostBySlugResponse>(GET_POST_BY_SLUG, {
    variables: { slug },
  });

  const post = data?.post;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Chargement...</h1>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Article non trouvé</h1>
        <Link href="/admin/actualites">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux actualités
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <Link href="/admin/actualites">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux actualités
          </Button>
        </Link>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-[#b8933d]" />
          Optimisation SEO - {post.title}
        </h1>
        <p className="text-gray-600 mt-2">
          Slug: <span className="font-mono text-sm">{post.slug}</span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Contenu de l'article</CardTitle>
            <Link href={`/admin/actualites/edit/${post.databaseId}`}>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Modifier l'article
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <span className="text-sm font-semibold text-gray-700">Titre :</span>
              <p className="text-gray-900">{post.title}</p>
            </div>
            {post.excerpt && (
              <div>
                <span className="text-sm font-semibold text-gray-700">Extrait :</span>
                <p className="text-gray-600 text-sm" dangerouslySetInnerHTML={{ __html: post.excerpt }} />
              </div>
            )}
            <div>
              <span className="text-sm font-semibold text-gray-700">Date :</span>
              <p className="text-gray-600 text-sm">
                {new Date(post.date).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            {post.categories.nodes.length > 0 && (
              <div>
                <span className="text-sm font-semibold text-gray-700">Catégories :</span>
                <div className="flex gap-2 mt-1">
                  {post.categories.nodes.map((cat) => (
                    <span
                      key={cat.id}
                      className="px-2 py-1 bg-[#b8933d]/10 text-[#b8933d] text-xs font-semibold rounded"
                    >
                      {cat.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <SeoMetadataEditor
        entityType="post"
        entityIdentifier={post.slug}
        autoSave={true}
      />

      <div className="flex justify-between">
        <Link href="/admin/actualites">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux actualités
          </Button>
        </Link>
        <Link href={`/actualites/${post.slug}`} target="_blank">
          <Button variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            Voir l'article
          </Button>
        </Link>
      </div>
    </div>
  );
}
