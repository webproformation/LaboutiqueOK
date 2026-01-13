'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface NewsCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
}

export default function NewsCategoriesPage() {
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<NewsCategory | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#C6A15B',
    display_order: 0,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data: categoriesData, error } = await supabase
        .from('news_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;

      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

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
      slug: generateSlug(name),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.slug) {
      toast.error('Le nom est requis');
      return;
    }

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('news_categories')
          .update({
            name: formData.name,
            slug: formData.slug,
            description: formData.description || '',
            color: formData.color,
            display_order: formData.display_order,
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast.success('Catégorie modifiée');
      } else {
        const { error } = await supabase
          .from('news_categories')
          .insert({
            id: crypto.randomUUID(),
            name: formData.name,
            slug: formData.slug,
            description: formData.description || '',
            color: formData.color,
            display_order: formData.display_order,
            is_active: true,
          });

        if (error) throw error;
        toast.success('Catégorie créée');
      }

      resetForm();
      loadCategories();
    } catch (error: any) {
      console.error('Error saving category:', error);
      if (error.code === '23505') {
        toast.error('Ce slug existe déjà');
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    }
  };

  const handleEdit = (category: NewsCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      color: category.color,
      display_order: category.display_order,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      const { data: articlesCheck, error: checkError } = await supabase
        .from('news_articles')
        .select('id')
        .eq('category_id', id)
        .limit(1);

      if (checkError) throw checkError;

      if (articlesCheck && articlesCheck.length > 0) {
        toast.error('Impossible de supprimer : des articles sont associés');
        return;
      }

      const { error } = await supabase
        .from('news_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success(`Catégorie "${name}" supprimée`);
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      color: '#C6A15B',
      display_order: 0,
    });
    setEditingCategory(null);
    setIsDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Catégories d'actualités</h1>
          <p className="text-gray-600 mt-2">
            Gérez les catégories du Carnet de Morgane ({categories.length} catégories)
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="bg-gradient-to-r from-[#C6A15B] to-[#b8933d] hover:from-[#b8933d] hover:to-[#a88230] text-white shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer une catégorie
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Modifier la catégorie' : 'Créer une catégorie'}
              </DialogTitle>
              <DialogDescription>
                Les catégories permettent d'organiser vos articles
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Nom *</Label>
                  <Input
                    id="name"
                    placeholder="Mode & Style"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="slug">Slug (URL)</Label>
                  <Input
                    id="slug"
                    placeholder="mode-style"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Généré automatiquement à partir du nom
                  </p>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Tendances mode, looks et conseils style"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="color">Couleur</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="display_order">Ordre d'affichage</Label>
                  <Input
                    id="display_order"
                    type="number"
                    min="0"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
                <Button type="submit" className="bg-[#C6A15B] hover:bg-[#b8933d]">
                  {editingCategory ? 'Modifier' : 'Créer'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {categories.length === 0 ? (
            <div className="text-center py-16">
              <Tag className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">Aucune catégorie créée</p>
              <p className="text-gray-400 text-sm mt-1">
                Créez votre première catégorie pour organiser vos articles
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Nom</TableHead>
                    <TableHead className="font-semibold">Slug</TableHead>
                    <TableHead className="font-semibold">Couleur</TableHead>
                    <TableHead className="font-semibold">Articles</TableHead>
                    <TableHead className="font-semibold">Ordre</TableHead>
                    <TableHead className="font-semibold">Statut</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="font-semibold text-gray-900">{category.name}</div>
                        {category.description && (
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {category.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {category.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-xs text-gray-600">{category.color}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">-</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{category.display_order}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={category.is_active ? 'default' : 'outline'}
                          className={category.is_active ? 'bg-green-50 text-green-700 border-green-200' : ''}
                        >
                          {category.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(category)}
                            className="hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer la catégorie</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Voulez-vous vraiment supprimer la catégorie "{category.name}" ?
                                  Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(category.id, category.name)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
