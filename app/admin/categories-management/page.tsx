"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Loader2, Save, X, FolderTree, Tags, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import SeoMetadataEditor from '@/components/SeoMetadataEditor';
import MediaLibrary from '@/components/MediaLibrary';

interface WooCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  parent: number;
  count: number;
  image: {
    id: number;
    src: string;
  } | null;
}

interface CategoryFormData {
  id?: number;
  name: string;
  slug: string;
  description: string;
  parent: number;
  image_url?: string;
}

export default function CategoriesManagementPage() {
  const [categories, setCategories] = useState<WooCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryFormData | null>(null);
  const [seoDialogOpen, setSeoDialogOpen] = useState(false);
  const [selectedCategoryForSeo, setSelectedCategoryForSeo] = useState<WooCategory | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);

  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    parent: 0,
    image_url: '',
  });

  const decodeHtmlEntities = (text: string): string => {
    if (typeof window === 'undefined') return text;
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/woocommerce/categories?action=list&per_page=100');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image valide');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 10MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'category-images');
      formData.append('folder', 'categories');

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      setFormData(prev => ({ ...prev, image_url: result.url }));
      setImagePreview(result.url);
      toast.success('Image uploadée avec succès');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image_url: '' }));
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const action = editingCategory ? 'update' : 'create';

      // Save to WooCommerce
      const wooResponse = await fetch('/api/woocommerce/categories', {
        method: editingCategory ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          categoryId: editingCategory?.id,
          categoryData: {
            name: formData.name,
            slug: formData.slug,
            description: formData.description,
            parent: formData.parent,
          },
        }),
      });

      if (!wooResponse.ok) {
        const errorData = await wooResponse.json();
        throw new Error(errorData.error || 'Failed to save category');
      }

      const wooData = await wooResponse.json();
      const categoryId = wooData.id || editingCategory?.id;

      // Save to Supabase categories table
      if (categoryId) {
        const categoryData = {
          woocommerce_id: categoryId,
          name: formData.name,
          slug: formData.slug,
          description: formData.description || '',
          woocommerce_parent_id: formData.parent,
          image_url: formData.image_url || null,
          is_active: true,
        };

        if (editingCategory) {
          const { error } = await supabase
            .from('categories')
            .update(categoryData)
            .eq('woocommerce_id', categoryId);

          if (error) {
            console.error('Error updating category in Supabase:', error);
          }
        } else {
          const { error } = await supabase
            .from('categories')
            .upsert(categoryData, { onConflict: 'woocommerce_id' });

          if (error) {
            console.error('Error inserting category in Supabase:', error);
          }
        }
      }

      toast.success(editingCategory ? 'Catégorie mise à jour' : 'Catégorie créée avec succès');
      setIsDialogOpen(false);
      resetForm();
      loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category: WooCategory) => {
    const imageUrl = category.image?.src || '';
    setEditingCategory({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      parent: category.parent,
      image_url: imageUrl,
    });
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description,
      parent: category.parent,
      image_url: imageUrl,
    });
    setImagePreview(imageUrl);
    setIsDialogOpen(true);
  };

  const handleDelete = async (categoryId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      return;
    }

    setDeleting(categoryId);
    try {
      const response = await fetch('/api/woocommerce/categories', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          categoryId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete category');
      }

      toast.success('Catégorie supprimée');
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    } finally {
      setDeleting(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      parent: 0,
      image_url: '',
    });
    setEditingCategory(null);
    setImagePreview(null);
  };

  const handleOpenDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const getParentCategoryName = (parentId: number): string => {
    if (parentId === 0) return 'Aucune (Catégorie principale)';
    const parent = categories.find(cat => cat.id === parentId);
    return parent ? decodeHtmlEntities(parent.name) : 'Inconnue';
  };

  const handleOpenSeo = (category: WooCategory) => {
    setSelectedCategoryForSeo(category);
    setSeoDialogOpen(true);
  };

  const handleCloseSeo = () => {
    setSeoDialogOpen(false);
    setSelectedCategoryForSeo(null);
  };

  const getCategoryLevel = (category: WooCategory): number => {
    let level = 0;
    let currentParent = category.parent;
    while (currentParent !== 0) {
      level++;
      const parent = categories.find(cat => cat.id === currentParent);
      if (!parent) break;
      currentParent = parent.parent;
    }
    return level;
  };

  const sortedCategories = [...categories].sort((a, b) => {
    const levelA = getCategoryLevel(a);
    const levelB = getCategoryLevel(b);

    if (levelA === 0 && levelB !== 0) return -1;
    if (levelA !== 0 && levelB === 0) return 1;
    if (a.parent !== b.parent) return a.parent - b.parent;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FolderTree className="h-8 w-8 text-[#b8933d]" />
            Gestion des Catégories
          </h1>
          <p className="text-gray-600 mt-2">
            Créer, modifier et supprimer les catégories de produits
          </p>
        </div>
        <Button onClick={handleOpenDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle catégorie
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#b8933d]" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Toutes les catégories ({categories.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Image</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead className="text-center">Produits</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCategories.map((category) => {
                  const level = getCategoryLevel(category);
                  const indentation = '  '.repeat(level);
                  const prefix = level > 0 ? '└─ ' : '';

                  return (
                    <TableRow key={category.id} className={level > 0 ? 'bg-gray-50' : ''}>
                      <TableCell>
                        {category.image?.src ? (
                          <img
                            src={category.image.src}
                            alt={category.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        <span style={{ marginLeft: `${level * 20}px` }}>
                          {prefix}{decodeHtmlEntities(category.name)}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-500 font-mono text-sm">
                        {category.slug}
                      </TableCell>
                      <TableCell className="max-w-md truncate text-sm">
                        {category.description || '—'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {getParentCategoryName(category.parent)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm text-gray-600">{category.count}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenSeo(category)}
                            title="Optimisation SEO"
                          >
                            <Tags className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(category)}
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(category.id)}
                            disabled={deleting === category.id}
                            title="Supprimer"
                          >
                            {deleting === category.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 text-red-600" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Modifiez les informations de cette catégorie'
                : 'Créez une nouvelle catégorie de produits'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Nom de la catégorie <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Robes"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Slug <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="Ex: robes"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                URL friendly (minuscules, sans espaces ni accents)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description de la catégorie"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Catégorie parente
              </label>
              <Select
                value={formData.parent.toString()}
                onValueChange={(value) => setFormData({ ...formData, parent: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Aucune (Catégorie principale)</SelectItem>
                  {categories
                    .filter(cat => cat.id !== editingCategory?.id)
                    .sort((a, b) => {
                      if (a.parent === 0 && b.parent !== 0) return -1;
                      if (a.parent !== 0 && b.parent === 0) return 1;
                      return a.name.localeCompare(b.name);
                    })
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.parent !== 0 ? '└─ ' : ''}{decodeHtmlEntities(category.name)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Image de la catégorie
              </label>
              <div className="space-y-3">
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2"
                      onClick={handleRemoveImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMediaLibraryOpen(true)}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Choisir depuis la médiathèque
                </Button>
                <p className="text-xs text-gray-500">
                  Sélectionnez une image existante ou uploadez-en une nouvelle
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingCategory ? 'Mettre à jour' : 'Créer'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={seoDialogOpen} onOpenChange={setSeoDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Optimisation SEO - {selectedCategoryForSeo ? decodeHtmlEntities(selectedCategoryForSeo.name) : ''}
            </DialogTitle>
            <DialogDescription>
              Slug: <span className="font-mono text-sm">{selectedCategoryForSeo?.slug}</span>
            </DialogDescription>
          </DialogHeader>

          {selectedCategoryForSeo && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informations de la catégorie</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-semibold text-gray-700">Nom :</span>
                      <p className="text-gray-900">{decodeHtmlEntities(selectedCategoryForSeo.name)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-700">Description :</span>
                      <p className="text-gray-600 text-sm">
                        {selectedCategoryForSeo.description || 'Aucune description'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-700">Parent :</span>
                      <p className="text-gray-600 text-sm">
                        {getParentCategoryName(selectedCategoryForSeo.parent)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-700">Nombre de produits :</span>
                      <p className="text-gray-600 text-sm">{selectedCategoryForSeo.count}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <SeoMetadataEditor
                entityType="product_cat"
                entityIdentifier={selectedCategoryForSeo.slug}
              />

              <div className="flex justify-end">
                <Button onClick={handleCloseSeo}>
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog pour la médiathèque */}
      <Dialog open={mediaLibraryOpen} onOpenChange={setMediaLibraryOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Médiathèque - Images Catégories</DialogTitle>
            <DialogDescription>
              Sélectionnez une image existante ou uploadez-en une nouvelle
            </DialogDescription>
          </DialogHeader>
          <MediaLibrary
            bucket="category-images"
            selectedUrl={imagePreview || undefined}
            onSelect={(url) => {
              setFormData(prev => ({ ...prev, image_url: url }));
              setImagePreview(url);
              setMediaLibraryOpen(false);
              toast.success('Image sélectionnée');
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
