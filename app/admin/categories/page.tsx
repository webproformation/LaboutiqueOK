'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Folder, Edit2, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  parent: number;
}

export default function CategoriesAdminPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/woocommerce/categories');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des catégories');
      }
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Folder className="h-8 w-8 text-[#b8933d]" />
            Gestion des catégories
          </h1>
          <p className="text-gray-600 mt-1">
            Gérer les catégories de produits
          </p>
        </div>
        <Link href="https://wordpress.laboutiquemorgane.fr/wp-admin/edit-tags.php?taxonomy=product_cat&post_type=product" target="_blank">
          <Button className="bg-[#b8933d] hover:bg-[#a07c2f]">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle catégorie
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>Rechercher des catégories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par nom ou slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Chargement...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCategories.map((category) => (
            <Card key={category.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-500 font-mono">
                        {category.slug}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {category.count} produit{category.count > 1 ? 's' : ''}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {category.description.substring(0, 150)}...
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/categories/${category.slug}`}>
                      <Button variant="outline" size="sm">
                        <Edit2 className="h-4 w-4 mr-2" />
                        SEO
                      </Button>
                    </Link>
                    <Link href={`https://wordpress.laboutiquemorgane.fr/wp-admin/term.php?taxonomy=product_cat&tag_ID=${category.id}&post_type=product`} target="_blank">
                      <Button variant="outline" size="sm">
                        <Edit2 className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredCategories.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Folder className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600">Aucune catégorie trouvée</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
