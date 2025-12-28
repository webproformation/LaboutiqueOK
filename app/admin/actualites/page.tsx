'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Edit2, Plus, Search, Trash2, Loader2, Filter, Tag, FolderOpen } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@apollo/client/react';
import { GET_POSTS, GET_POST_CATEGORIES } from '@/lib/queries';
import { GetPostsResponse, GetPostCategoriesResponse } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function ActualitesAdminPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { loading, data, refetch } = useQuery<GetPostsResponse>(GET_POSTS);
  const { data: categoriesData, loading: categoriesLoading } = useQuery<GetPostCategoriesResponse>(GET_POST_CATEGORIES);

  const posts = data?.posts?.nodes || [];
  const categories = categoriesData?.categories?.nodes || [];

  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stripHtml(post.excerpt || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' ||
      post.categories.nodes.some(cat => cat.slug === selectedCategory);

    return matchesSearch && matchesCategory;
  });

  const handleDeleteClick = (postId: string, postTitle: string) => {
    setPostToDelete({ id: postId, title: postTitle });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/wordpress/posts?id=${postToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      toast.success('Article supprimé avec succès');
      setDeleteDialogOpen(false);
      setPostToDelete(null);
      refetch();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression de l\'article');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-[#b8933d]" />
            Gestion des actualités
          </h1>
          <p className="text-gray-600 mt-1">
            Gérer les articles du Carnet de Morgane
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/actualites/categories">
            <Button variant="outline" className="border-[#b8933d] text-[#b8933d] hover:bg-[#b8933d]/10">
              <FolderOpen className="h-4 w-4 mr-2" />
              Gérer les catégories
            </Button>
          </Link>
          <Link href="/admin/actualites/edit/new">
            <Button className="bg-[#b8933d] hover:bg-[#a07c2f]">
              <Plus className="h-4 w-4 mr-2" />
              Nouvel article
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-[#b8933d]" />
            <CardTitle>Filtres</CardTitle>
          </div>
          <CardDescription>Rechercher et filtrer les articles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par titre, slug ou contenu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categoriesLoading ? (
                  <SelectItem value="loading" disabled>
                    Chargement...
                  </SelectItem>
                ) : (
                  categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.slug}>
                      {cat.name} ({cat.count || 0})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          {selectedCategory !== 'all' && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-gray-600">Filtre actif:</span>
              <Badge variant="secondary" className="bg-[#b8933d]/10 text-[#b8933d]">
                <Tag className="h-3 w-3 mr-1" />
                {categories.find((c: any) => c.slug === selectedCategory)?.name}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategory('all')}
                className="h-6 text-xs"
              >
                Effacer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#b8933d] mx-auto mb-3" />
          <p className="text-gray-600">Chargement des articles...</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              {filteredPosts.length} article{filteredPosts.length > 1 ? 's' : ''} trouvé{filteredPosts.length > 1 ? 's' : ''}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => {
              const featuredImage = post.featuredImage?.node?.sourceUrl;
              const excerpt = stripHtml(post.excerpt || '');

              return (
                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {featuredImage && (
                    <div className="aspect-video w-full overflow-hidden bg-gray-100">
                      <img
                        src={featuredImage}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-5">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.categories.nodes.map((cat) => (
                        <Badge
                          key={cat.id}
                          variant="secondary"
                          className="bg-[#b8933d]/10 text-[#b8933d] text-xs font-medium"
                        >
                          {cat.name}
                        </Badge>
                      ))}
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {post.title}
                    </h3>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                      {excerpt || 'Aucun extrait disponible'}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4 pb-4 border-b">
                      <span className="font-mono">{post.slug}</span>
                      <span>{new Date(post.date).toLocaleDateString('fr-FR')}</span>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/admin/actualites/edit/${post.databaseId}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit2 className="h-4 w-4 mr-2" />
                          Modifier
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick((post.databaseId || post.id).toString(), post.title)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredPosts.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucun article trouvé
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || selectedCategory !== 'all'
                    ? 'Essayez de modifier vos critères de recherche'
                    : 'Commencez par créer votre premier article'}
                </p>
                {!searchTerm && selectedCategory === 'all' && (
                  <Link href="/admin/actualites/edit/new">
                    <Button className="bg-[#b8933d] hover:bg-[#a07c2f]">
                      <Plus className="h-4 w-4 mr-2" />
                      Créer un article
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'article "{postToDelete?.title}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
