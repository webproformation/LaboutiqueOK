'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FolderOpen, Plus, Edit2, Trash2, Loader2, ArrowLeft, Save, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@apollo/client/react';
import { GET_POST_CATEGORIES } from '@/lib/queries';
import { GetPostCategoriesResponse } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-client';

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
}

interface Category {
  id: string;
  databaseId?: string;
  name: string;
  slug: string;
  description?: string;
  count: number;
}

export default function NewsCategoriesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
  });

  const { loading, data, refetch } = useQuery<GetPostCategoriesResponse>(GET_POST_CATEGORIES);
  const categories: Category[] = data?.categories?.nodes || [];

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: editingCategory ? formData.slug : generateSlug(name),
    });
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', slug: '', description: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Le nom est obligatoire');
      return;
    }

    if (!formData.slug.trim()) {
      toast.error('Le slug est obligatoire');
      return;
    }

    setIsSaving(true);
    try {
      const categoryData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
      };

      let response;
      if (editingCategory) {
        response = await fetch(`/api/wordpress/categories?id=${editingCategory.databaseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryData),
        });
      } else {
        response = await fetch('/api/wordpress/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryData),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'enregistrement');
      }

      const savedCategory = await response.json();

      await supabase.from('news_categories').upsert({
        wordpress_id: savedCategory.id,
        name: savedCategory.name,
        slug: savedCategory.slug,
        description: savedCategory.description || '',
        count: savedCategory.count || 0,
        is_active: true,
      }, {
        onConflict: 'wordpress_id'
      });

      toast.success(editingCategory ? 'Catégorie mise à jour avec succès' : 'Catégorie créée avec succès');
      setIsDialogOpen(false);
      setEditingCategory(null);
      setFormData({ name: '', slug: '', description: '' });
      refetch();
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast.error(error.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete || !categoryToDelete.databaseId) return;

    if (categoryToDelete.count > 0) {
      toast.error(`Impossible de supprimer cette catégorie car elle contient ${categoryToDelete.count} article(s)`);
      setDeleteDialogOpen(false);
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/wordpress/categories?id=${categoryToDelete.databaseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      await supabase
        .from('news_categories')
        .delete()
        .eq('wordpress_id', parseInt(categoryToDelete.databaseId));

      toast.success('Catégorie supprimée avec succès');
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      refetch();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression de la catégorie');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSyncCategories = async () => {
    setIsSyncing(true);
    try {
      const { data: syncedCategories } = await supabase
        .from('news_categories')
        .select('wordpress_id');

      const syncedIds = syncedCategories?.map(c => c.wordpress_id) || [];

      for (const category of categories) {
        if (!category.databaseId) continue;

        const categoryId = parseInt(category.databaseId);

        if (!syncedIds.includes(categoryId)) {
          await supabase.from('news_categories').insert({
            wordpress_id: categoryId,
            name: category.name,
            slug: category.slug,
            description: category.description || '',
            count: category.count || 0,
            is_active: true,
          });
        } else {
          await supabase
            .from('news_categories')
            .update({
              name: category.name,
              slug: category.slug,
              description: category.description || '',
              count: category.count || 0,
            })
            .eq('wordpress_id', categoryId);
        }
      }

      toast.success('Synchronisation réussie');
      refetch();
    } catch (error) {
      console.error('Erreur de synchronisation:', error);
      toast.error('Erreur lors de la synchronisation');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/actualites">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux actualités
            </Button>
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FolderOpen className="h-8 w-8 text-[#b8933d]" />
            Gestion des catégories d'actualités
          </h1>
          <p className="text-gray-600 mt-1">
            Créer et gérer les catégories pour organiser vos articles
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleSyncCategories}
            disabled={isSyncing}
            variant="outline"
            className="border-[#b8933d] text-[#b8933d] hover:bg-[#b8933d]/10"
          >
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Synchronisation...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Synchroniser
              </>
            )}
          </Button>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-[#b8933d] hover:bg-[#a07c2f]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle catégorie
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catégories existantes</CardTitle>
          <CardDescription>
            Gérez les catégories de vos articles. Les catégories sont synchronisées avec WordPress.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#b8933d]" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucune catégorie
              </h3>
              <p className="text-gray-600 mb-6">
                Créez votre première catégorie pour commencer à organiser vos articles
              </p>
              <Button
                onClick={() => handleOpenDialog()}
                className="bg-[#b8933d] hover:bg-[#a07c2f]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer une catégorie
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Articles</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      {category.name}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {category.slug}
                      </code>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {category.description || '—'}
                      </p>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-[#b8933d]/10 text-[#b8933d]">
                        {category.count || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(category)}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Modifier
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(category)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={category.count > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Modifiez les informations de la catégorie'
                : 'Créez une nouvelle catégorie pour organiser vos articles'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la catégorie *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Mode, Beauté, Lifestyle..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL) *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="ex: mode-beaute"
              />
              <p className="text-xs text-gray-500">
                Utilisé dans l'URL. Lettres minuscules, chiffres et tirets uniquement.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez brièvement cette catégorie..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setEditingCategory(null);
                setFormData({ name: '', slug: '', description: '' });
              }}
              disabled={isSaving}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#b8933d] hover:bg-[#a07c2f]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {editingCategory ? 'Mettre à jour' : 'Créer'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la catégorie "{categoryToDelete?.name}" ?
              {categoryToDelete && categoryToDelete.count > 0 && (
                <span className="block mt-2 text-red-600 font-semibold">
                  Cette catégorie contient {categoryToDelete.count} article(s) et ne peut pas être supprimée.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            {categoryToDelete && categoryToDelete.count === 0 && (
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
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
