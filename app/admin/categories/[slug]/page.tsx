'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Folder, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import SeoMetadataEditor from '@/components/SeoMetadataEditor';
import { toast } from 'sonner';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  parent: number;
}

export default function CategorySeoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategory();
  }, [slug]);

  const loadCategory = async () => {
    try {
      const response = await fetch('/api/woocommerce/categories');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des catégories');
      }
      const categories: Category[] = await response.json();
      const foundCategory = categories.find(cat => cat.slug === slug);

      if (!foundCategory) {
        throw new Error('Catégorie non trouvée');
      }

      setCategory(foundCategory);
    } catch (error) {
      console.error('Error loading category:', error);
      toast.error('Erreur lors du chargement de la catégorie');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Chargement...</h1>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Catégorie non trouvée</h1>
        <Link href="/admin/categories">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux catégories
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <Link href="/admin/categories">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux catégories
          </Button>
        </Link>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Folder className="h-8 w-8 text-[#b8933d]" />
          Optimisation SEO - {category.name}
        </h1>
        <p className="text-gray-600 mt-2">
          Slug: <span className="font-mono text-sm">{category.slug}</span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Informations de la catégorie</CardTitle>
            <Link href={`https://wordpress.laboutiquemorgane.fr/wp-admin/term.php?taxonomy=product_cat&tag_ID=${category.id}&post_type=product`} target="_blank">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Modifier la catégorie
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <span className="text-sm font-semibold text-gray-700">Nom :</span>
              <p className="text-gray-900">{category.name}</p>
            </div>
            {category.description && (
              <div>
                <span className="text-sm font-semibold text-gray-700">Description :</span>
                <p className="text-gray-600 text-sm">{category.description}</p>
              </div>
            )}
            <div>
              <span className="text-sm font-semibold text-gray-700">Nombre de produits :</span>
              <p className="text-gray-600 text-sm">
                {category.count} produit{category.count > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <SeoMetadataEditor
        entityType="category"
        entityIdentifier={category.slug}
        autoSave={true}
      />

      <div className="flex justify-between">
        <Link href="/admin/categories">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux catégories
          </Button>
        </Link>
        <Link href={`/category/${category.slug}`} target="_blank">
          <Button variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            Voir la catégorie
          </Button>
        </Link>
      </div>
    </div>
  );
}
