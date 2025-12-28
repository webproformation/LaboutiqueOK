'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, BookOpen, Save, Loader2, Image, Tag, Plus, Trash2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import RichTextEditor from '@/components/RichTextEditor';
import SeoMetadataEditor from '@/components/SeoMetadataEditor';
import WordPressMediaSelector from '@/components/WordPressMediaSelector';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@apollo/client/react';
import { GET_POST_CATEGORIES } from '@/lib/queries';
import { GetPostCategoriesResponse } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

interface PostFormData {
  title: string;
  content: string;
  excerpt: string;
  status: 'publish' | 'draft' | 'pending';
  slug: string;
  featured_media?: number;
  featured_image_url?: string;
  categories?: number[];
}

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const isNewPost = id === 'new';

  const [isLoading, setIsLoading] = useState(!isNewPost);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    content: '',
    excerpt: '',
    status: 'draft',
    slug: '',
    featured_media: 0,
    featured_image_url: '',
    categories: [],
  });

  const { data: categoriesData, loading: categoriesLoading, refetch: refetchCategories } = useQuery<GetPostCategoriesResponse>(GET_POST_CATEGORIES);
  const availableCategories = categoriesData?.categories?.nodes || [];

  const [showCreateCategoryDialog, setShowCreateCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySlug, setNewCategorySlug] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const [categoryToDelete, setCategoryToDelete] = useState<any>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  useEffect(() => {
    if (!isNewPost) {
      fetchPost();
    }
  }, [id, isNewPost]);

  const fetchPost = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching post with ID:', id);
      const response = await fetch(`/api/wordpress/posts?id=${id}`);
      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        console.error('Error response:', errorData);

        let errorMessage = errorData.error || 'Failed to fetch post';
        if (errorData.details?.message) {
          errorMessage += `: ${errorData.details.message}`;
        }
        if (errorData.url) {
          console.log('Attempted URL:', errorData.url);
        }

        throw new Error(errorMessage);
      }

      const post = await response.json();
      console.log('Post fetched successfully:', post);
      setFormData({
        title: post.title?.rendered || '',
        content: post.content?.rendered || '',
        excerpt: post.excerpt?.rendered || '',
        status: post.status || 'draft',
        slug: post.slug || '',
        featured_media: post.featured_media || 0,
        featured_image_url: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '',
        categories: post.categories || [],
      });
    } catch (error: any) {
      console.error('Error fetching post:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryToggle = (categoryId: number) => {
    const currentCategories = formData.categories || [];
    const isSelected = currentCategories.includes(categoryId);

    setFormData({
      ...formData,
      categories: isSelected
        ? currentCategories.filter(id => id !== categoryId)
        : [...currentCategories, categoryId],
    });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Le nom de la catégorie est obligatoire');
      return;
    }

    const slug = newCategorySlug.trim() || generateSlug(newCategoryName);

    try {
      setIsCreatingCategory(true);

      const response = await fetch('/api/wordpress/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          slug,
          description: newCategoryDescription.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la création');
      }

      const newCategory = await response.json();
      toast.success('Catégorie créée avec succès !');

      setNewCategoryName('');
      setNewCategorySlug('');
      setNewCategoryDescription('');
      setShowCreateCategoryDialog(false);

      await refetchCategories();

      setFormData({
        ...formData,
        categories: [...(formData.categories || []), newCategory.id],
      });
    } catch (error: any) {
      console.error('Error creating category:', error);
      toast.error(error.message || 'Erreur lors de la création de la catégorie');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      setIsDeletingCategory(true);

      const categoryId = parseInt(categoryToDelete.databaseId || categoryToDelete.id);
      const response = await fetch(`/api/wordpress/categories?id=${categoryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la suppression');
      }

      toast.success('Catégorie supprimée avec succès !');

      setFormData({
        ...formData,
        categories: (formData.categories || []).filter(id => id !== categoryId),
      });

      await refetchCategories();
      setCategoryToDelete(null);
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error(error.message || 'Erreur lors de la suppression de la catégorie');
    } finally {
      setIsDeletingCategory(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Le titre est obligatoire');
      return;
    }

    if (!formData.categories || formData.categories.length === 0) {
      toast.error('Veuillez sélectionner au moins une catégorie');
      return;
    }

    try {
      setIsSaving(true);

      const postData = {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        status: formData.status,
        featured_media: formData.featured_media || 0,
        categories: formData.categories,
      };

      let response;
      if (isNewPost) {
        response = await fetch('/api/wordpress/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postData),
        });
      } else {
        response = await fetch(`/api/wordpress/posts?id=${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postData),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save post');
      }

      const savedPost = await response.json();
      toast.success(isNewPost ? 'Article créé avec succès !' : 'Article mis à jour avec succès !');

      if (isNewPost) {
        setFormData({
          title: savedPost.title?.rendered || formData.title,
          content: savedPost.content?.rendered || formData.content,
          excerpt: savedPost.excerpt?.rendered || formData.excerpt,
          status: savedPost.status || formData.status,
          slug: savedPost.slug || '',
          featured_media: savedPost.featured_media || formData.featured_media || 0,
          featured_image_url: savedPost._embedded?.['wp:featuredmedia']?.[0]?.source_url || formData.featured_image_url || '',
          categories: savedPost.categories || formData.categories || [],
        });

        router.replace(`/admin/actualites/edit/${savedPost.id}`);
      } else {
        setFormData({
          ...formData,
          title: savedPost.title?.rendered || formData.title,
          content: savedPost.content?.rendered || formData.content,
          excerpt: savedPost.excerpt?.rendered || formData.excerpt,
          status: savedPost.status || formData.status,
          slug: savedPost.slug || formData.slug,
          featured_media: savedPost.featured_media || formData.featured_media || 0,
          featured_image_url: savedPost._embedded?.['wp:featuredmedia']?.[0]?.source_url || formData.featured_image_url || '',
          categories: savedPost.categories || formData.categories || [],
        });
      }
    } catch (error: any) {
      console.error('Error saving post:', error);
      toast.error(error.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#b8933d]" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-6">
        <Link href="/admin/actualites">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux actualités
          </Button>
        </Link>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-[#b8933d]" />
          {isNewPost ? 'Nouvel article' : 'Modifier l\'article'}
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations de l'article</CardTitle>
              <CardDescription>
                Remplissez les détails de votre article
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Titre de l'article"
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Extrait</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Court résumé de l'article (affiché dans les listes d'articles)"
                  rows={3}
                />
                <p className="text-xs text-gray-500">
                  Recommandé: 150-200 caractères
                </p>
              </div>

              <div className="space-y-2">
                <Label>Contenu de l'article</Label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(value) => setFormData({ ...formData, content: value })}
                  placeholder="Rédigez le contenu de votre article ici..."
                />
              </div>
            </CardContent>
          </Card>

          <SeoMetadataEditor
            entityType="post"
            entityIdentifier={formData.slug || `new-post-${Date.now()}`}
            autoSave={false}
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Paramètres de publication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'publish' | 'draft' | 'pending') =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        Brouillon
                      </div>
                    </SelectItem>
                    <SelectItem value="pending">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                        En attente
                      </div>
                    </SelectItem>
                    <SelectItem value="publish">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        Publié
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!isNewPost && formData.slug && (
                <div className="space-y-1 p-3 bg-gray-50 rounded-lg">
                  <Label className="text-xs text-gray-600">URL</Label>
                  <p className="text-xs font-mono text-gray-900 break-all">
                    /actualites/{formData.slug}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-[#b8933d]" />
                  <div>
                    <CardTitle className="text-lg">Catégories *</CardTitle>
                    <CardDescription className="mt-1">
                      Sélectionnez au moins une catégorie
                    </CardDescription>
                  </div>
                </div>
                <Dialog open={showCreateCategoryDialog} onOpenChange={setShowCreateCategoryDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Créer
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Créer une nouvelle catégorie</DialogTitle>
                      <DialogDescription>
                        Ajoutez une nouvelle catégorie pour vos articles
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="category-name">Nom *</Label>
                        <Input
                          id="category-name"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="Ex: Mode, Beauté, Lifestyle..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category-slug">Slug (optionnel)</Label>
                        <Input
                          id="category-slug"
                          value={newCategorySlug}
                          onChange={(e) => setNewCategorySlug(e.target.value)}
                          placeholder="Ex: mode, beaute, lifestyle"
                        />
                        <p className="text-xs text-gray-500">
                          Laissez vide pour générer automatiquement
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category-description">Description (optionnel)</Label>
                        <Textarea
                          id="category-description"
                          value={newCategoryDescription}
                          onChange={(e) => setNewCategoryDescription(e.target.value)}
                          placeholder="Décrivez cette catégorie..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowCreateCategoryDialog(false);
                          setNewCategoryName('');
                          setNewCategorySlug('');
                          setNewCategoryDescription('');
                        }}
                        disabled={isCreatingCategory}
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={handleCreateCategory}
                        disabled={isCreatingCategory}
                        className="bg-[#b8933d] hover:bg-[#a07c2f]"
                      >
                        {isCreatingCategory ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Création...
                          </>
                        ) : (
                          'Créer la catégorie'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-[#b8933d]" />
                </div>
              ) : availableCategories.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="mb-3">Aucune catégorie disponible</p>
                  <p className="text-xs mb-4">Créez votre première catégorie pour continuer</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableCategories.map((category: any) => (
                    <div key={category.id} className="flex items-start space-x-3 p-2 rounded hover:bg-gray-50 group">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={formData.categories?.includes(parseInt(category.databaseId || category.id))}
                        onCheckedChange={() => handleCategoryToggle(parseInt(category.databaseId || category.id))}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`category-${category.id}`}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {category.name}
                        </label>
                        {category.description && (
                          <p className="text-xs text-gray-500 mt-1">
                            {category.description}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setCategoryToDelete(category)}
                        title="Supprimer cette catégorie"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {formData.categories && formData.categories.length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-xs text-gray-600 mb-2">Catégories sélectionnées:</p>
                      <div className="flex flex-wrap gap-1">
                        {formData.categories.map((catId) => {
                          const cat = availableCategories.find((c: any) =>
                            parseInt(c.databaseId || c.id) === catId
                          );
                          return cat ? (
                            <Badge
                              key={catId}
                              variant="secondary"
                              className="bg-[#b8933d]/10 text-[#b8933d] text-xs"
                            >
                              {cat.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer cette catégorie ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer la catégorie <strong>{categoryToDelete?.name}</strong> ?
                  Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeletingCategory}>
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteCategory}
                  disabled={isDeletingCategory}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeletingCategory ? (
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

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Image className="h-5 w-5 text-[#b8933d]" />
                <CardTitle className="text-lg">Image mise en avant</CardTitle>
              </div>
              <CardDescription>
                Image principale de l'article
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WordPressMediaSelector
                selectedImage={formData.featured_image_url}
                onSelect={(url, id) =>
                  setFormData({
                    ...formData,
                    featured_image_url: url,
                    featured_media: id
                  })
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-between sticky bottom-0 bg-white border-t p-4 -mx-4">
        <Link href="/admin/actualites">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Annuler
          </Button>
        </Link>
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
              {isNewPost ? 'Créer l\'article' : 'Enregistrer'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
