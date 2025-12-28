"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Loader2, Save, X, FolderTree, Tags } from 'lucide-react';
import { toast } from 'sonner';
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

  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    parent: 0,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const action = editingCategory ? 'update' : 'create';
      const response = await fetch('/api/woocommerce/categories', {
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save category');
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
    setEditingCategory({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      parent: category.parent,
    });
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description,
      parent: category.parent,
    });
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
    });
    setEditingCategory(null);
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
    </div>
  );
}
