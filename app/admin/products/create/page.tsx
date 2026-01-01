'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, ArrowLeft, Save, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { decodeHtmlEntities } from '@/lib/utils';
import Link from 'next/link';
import RichTextEditor from '@/components/RichTextEditor';
import MediaLibrary from '@/components/MediaLibrary';
import ProductGalleryManager, { GalleryImage } from '@/components/ProductGalleryManager';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SupabaseCategory {
  id: string;
  name: string;
  slug: string;
  woocommerce_id: number;
  woocommerce_parent_id: number | null;
}

interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  short_description: string;
  regular_price: string;
  sale_price: string;
  stock_quantity: number | null;
  stock_status: 'instock' | 'outofstock';
  image_id: number;
  image_url: string;
  gallery_images: GalleryImage[];
  category_id: string | null;
  is_active: boolean;
}

export default function CreateProductPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    regular_price: '',
    sale_price: '',
    stock_quantity: null,
    stock_status: 'instock',
    image_id: 0,
    image_url: '',
    gallery_images: [],
    category_id: null,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<SupabaseCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await fetch('/api/admin/categories');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des catégories');
      }

      const result = await response.json();
      const data = result.data || result;

      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Erreur lors du chargement des catégories');
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!formData.name || !formData.regular_price) {
        throw new Error('Le nom et le prix sont obligatoires');
      }

      const allImages = formData.image_id && formData.image_url
        ? [{ id: formData.image_id, url: formData.image_url, src: formData.image_url }, ...formData.gallery_images]
        : formData.gallery_images;

      const productData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        short_description: formData.short_description,
        regular_price: formData.regular_price,
        sale_price: formData.sale_price,
        stock_quantity: formData.stock_quantity,
        stock_status: formData.stock_status,
        image_url: formData.image_url,
        images: allImages,
        category_id: formData.category_id,
        is_active: formData.is_active,
      };

      const response = await fetch('/api/admin/products/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création');
      }

      const result = await response.json();

      toast.success('Produit créé avec succès');
      setTimeout(() => {
        router.push('/admin/products');
        router.refresh();
      }, 500);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création');
      console.error('Error creating product:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/products">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la liste
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Créer un nouveau produit</h1>
        <p className="text-gray-600 mt-2">
          Ajoutez un nouveau produit à votre catalogue
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Image principale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.image_url ? (
              <div className="relative inline-block">
                <img
                  src={formData.image_url}
                  alt="Image principale"
                  className="w-48 h-48 object-cover rounded border"
                />
              </div>
            ) : (
              <div className="w-48 h-48 bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-gray-400" />
              </div>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMediaLibraryOpen(true)}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Choisir une image
              </Button>
              {formData.image_url && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setFormData({ ...formData, image_url: '', image_id: 0 })}
                >
                  Retirer l'image
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Galerie d&apos;images</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductGalleryManager
              images={formData.gallery_images}
              onChange={(images) => setFormData({ ...formData, gallery_images: images })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nom du produit *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Ex: Robe d'été fleurie"
              />
            </div>

            <div>
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="Laissez vide pour générer automatiquement"
              />
              <p className="text-xs text-gray-500 mt-1">
                L&apos;URL sera générée automatiquement à partir du nom si vide
              </p>
            </div>

            <div>
              <Label htmlFor="short_description">Description courte</Label>
              <RichTextEditor
                id="short_description"
                value={formData.short_description}
                onChange={(value) => setFormData({ ...formData, short_description: value })}
                rows={4}
                placeholder="Description courte visible sur la page produit..."
              />
            </div>

            <div>
              <Label htmlFor="description">Description complète</Label>
              <RichTextEditor
                id="description"
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                rows={8}
                placeholder="Description détaillée du produit..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Catégorie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="category">Catégorie du produit</Label>
              {loadingCategories ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Chargement des catégories...
                </div>
              ) : (
                <select
                  id="category"
                  value={formData.category_id || ''}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value || null })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Aucune catégorie</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {decodeHtmlEntities(category.name)}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Sélectionnez la catégorie principale de ce produit
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="regular_price">Prix normal (€) *</Label>
                <Input
                  id="regular_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.regular_price}
                  onChange={(e) => setFormData({ ...formData, regular_price: e.target.value })}
                  required
                  placeholder="55.99"
                />
                <p className="text-xs text-gray-500 mt-1">Ex: 55.99 pour 55,99 €</p>
              </div>
              <div>
                <Label htmlFor="sale_price">Prix promo (€)</Label>
                <Input
                  id="sale_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                  placeholder="50.00"
                />
                <p className="text-xs text-gray-500 mt-1">Ex: 50.00 pour 50,00 €</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="stock_quantity">Quantité en stock</Label>
              <Input
                id="stock_quantity"
                type="number"
                value={formData.stock_quantity || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  stock_quantity: e.target.value ? parseInt(e.target.value) : null
                })}
                placeholder="Ex: 10"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="stock_status">Statut du stock</Label>
              <select
                id="stock_status"
                value={formData.stock_status}
                onChange={(e) => setFormData({
                  ...formData,
                  stock_status: e.target.value as 'instock' | 'outofstock'
                })}
                className="border rounded px-3 py-2"
              >
                <option value="instock">En stock</option>
                <option value="outofstock">Rupture de stock</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statut du produit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_active">Produit actif</Label>
                <p className="text-xs text-gray-500 mt-1">
                  Les produits inactifs ne sont pas visibles sur le site
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 sticky bottom-0 bg-white py-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/products')}
            disabled={saving}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Créer le produit
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Dialog pour la médiathèque */}
      <Dialog open={mediaLibraryOpen} onOpenChange={setMediaLibraryOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Médiathèque - Images Produits</DialogTitle>
            <DialogDescription>
              Sélectionnez une image existante ou uploadez-en une nouvelle
            </DialogDescription>
          </DialogHeader>
          <MediaLibrary
            bucket="product-images"
            selectedUrl={formData.image_url || undefined}
            onSelect={(url) => {
              setFormData({ ...formData, image_url: url, image_id: 0 });
              setMediaLibraryOpen(false);
              toast.success('Image sélectionnée');
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
