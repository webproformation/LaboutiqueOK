"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import ProductAttributesManager from '@/components/ProductAttributesManager';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getWebPImagesForProduct } from '@/lib/webp-storage-mapper';

interface SupabaseCategory {
  id: string;
  name: string;
  slug: string;
  woocommerce_id: number;
  woocommerce_parent_id: number | null;
  parent_id: string | null;
}

interface ProductAttribute {
  attribute_id: string;
  term_ids: string[];
}

interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  short_description: string;
  regular_price: string;
  sale_price: string;
  stock_quantity: number | null;
  manage_stock: boolean;
  stock_status: 'instock' | 'outofstock';
  featured: boolean;
  image_id: number;
  image_url: string;
  gallery_images: GalleryImage[];
  category_id: string | null;
  child_category_ids: string[];
  status: 'publish' | 'draft';
  attributes: ProductAttribute[];
}


export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    regular_price: '',
    sale_price: '',
    stock_quantity: null,
    manage_stock: false,
    stock_status: 'instock',
    featured: false,
    image_id: 0,
    image_url: '',
    gallery_images: [],
    category_id: null,
    child_category_ids: [],
    status: 'publish',
    attributes: [],
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<SupabaseCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (productId) {
      loadProductData();
    }
  }, [productId]);

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

  const loadProductData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/products?id=${productId}`);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Load Product] API Error:', errorData);
        throw new Error(errorData.error || 'Erreur lors du chargement du produit');
      }

      const product = await response.json();

      if (!product || !product.name) {
        throw new Error('Produit introuvable ou données invalides');
      }

      // 🔄 MAPPER LES IMAGES WORDPRESS → SUPABASE
      const wooId = product.woocommerce_id || product.id;
      const supabaseImages = await getWebPImagesForProduct(wooId);

      // Si des images Supabase existent, les utiliser en priorité
      let mainImageUrl = '';
      let galleryImages: GalleryImage[] = [];

      if (supabaseImages.length > 0) {
        console.log(`[Admin] ✅ ${supabaseImages.length} images Supabase trouvées pour produit ${wooId}`);
        mainImageUrl = supabaseImages[0];
        galleryImages = supabaseImages.slice(1).map((url, idx) => ({
          url,
          id: idx
        }));
      } else {
        // Fallback: utiliser les images WordPress si pas d'images Supabase
        console.log(`[Admin] ⚠️ Pas d'images Supabase, utilisation WordPress`);
        const images = Array.isArray(product.images) ? product.images : [];
        const mainImage = images[0] || {};
        mainImageUrl = mainImage.src || mainImage.url || '';
        galleryImages = images.slice(1).map((img: any) => ({
          url: img.src || img.url || '',
          id: img.id || 0
        }));
      }

      let childCategoryIds: string[] = [];
      if (product.categories && Array.isArray(product.categories)) {
        childCategoryIds = product.categories
          .filter((cat: any) => cat && typeof cat === 'object' && cat.id)
          .map((cat: any) => cat.id);
      }

      setFormData({
        name: product.name || '',
        slug: product.slug || '',
        description: product.description || '',
        short_description: product.short_description || '',
        regular_price: product.regular_price?.toString() || '',
        sale_price: product.sale_price?.toString() || '',
        stock_quantity: product.stock_quantity || null,
        manage_stock: false,
        stock_status: product.stock_status || 'instock',
        featured: product.featured === true,
        image_id: 0,
        image_url: mainImageUrl,
        gallery_images: galleryImages,
        category_id: product.category_id || null,
        child_category_ids: childCategoryIds,
        status: product.is_active === true ? 'publish' : 'draft',
        attributes: product.attributes || [],
      });
    } catch (error) {
      console.error('[Load Product] Error:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors du chargement du produit');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const allImages = formData.image_id && formData.image_url
        ? [{ id: formData.image_id, url: formData.image_url, src: formData.image_url }, ...formData.gallery_images]
        : formData.gallery_images;

      const categoriesArray = formData.child_category_ids
        .map(id => categories.find(c => c.id === id))
        .filter(Boolean)
        .map(cat => ({
          id: cat!.id,
          name: cat!.name,
          slug: cat!.slug
        }));

      const productData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        short_description: formData.short_description,
        regular_price: formData.regular_price,
        sale_price: formData.sale_price,
        stock_quantity: formData.stock_quantity,
        stock_status: formData.stock_status,
        featured: formData.featured,
        images: allImages,
        category_id: formData.category_id,
        categories: categoriesArray,
        status: formData.status,
      };

      const response = await fetch('/api/admin/products/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: productId,
          productData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Error updating product:', result);
        const errorMessage = result.error || 'Erreur lors de la mise à jour du produit';
        throw new Error(errorMessage);
      }

      toast.success('Produit mis à jour avec succès');
      setTimeout(() => {
        router.push('/admin/products');
        router.refresh();
      }, 500);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour');
      console.error('Error updating product:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/products">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la liste
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Modifier le produit</h1>
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
            <CardTitle>Galerie d'images</CardTitle>
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
              />
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
                placeholder="Description détaillée du produit (matières, entretien, détails...)..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Catégories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="parent_category">Catégorie parente</Label>
              {loadingCategories ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Chargement des catégories...
                </div>
              ) : (
                <select
                  id="parent_category"
                  value={formData.category_id || ''}
                  onChange={(e) => {
                    const newCategoryId = e.target.value || null;
                    setFormData({
                      ...formData,
                      category_id: newCategoryId,
                      child_category_ids: []
                    });
                  }}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Aucune catégorie parente</option>
                  {categories
                    .filter(cat => !cat.parent_id && !cat.woocommerce_parent_id)
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {decodeHtmlEntities(category.name)}
                      </option>
                    ))}
                </select>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Sélectionnez la catégorie principale du produit
              </p>
            </div>

            {formData.category_id && (
              <div>
                <Label htmlFor="child_categories">Catégories enfants (sous-catégories)</Label>
                {loadingCategories ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Chargement...
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-3">
                      {categories
                        .filter(cat => {
                          const selectedParent = categories.find(c => c.id === formData.category_id);
                          if (!selectedParent) return false;

                          return (
                            cat.parent_id === formData.category_id ||
                            (selectedParent.woocommerce_id && cat.woocommerce_parent_id === selectedParent.woocommerce_id)
                          );
                        })
                        .map((category) => (
                          <div key={category.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`child_cat_${category.id}`}
                              checked={formData.child_category_ids.includes(category.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    child_category_ids: [...formData.child_category_ids, category.id]
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    child_category_ids: formData.child_category_ids.filter(id => id !== category.id)
                                  });
                                }
                              }}
                              className="rounded"
                            />
                            <label htmlFor={`child_cat_${category.id}`} className="text-sm cursor-pointer">
                              {decodeHtmlEntities(category.name)}
                            </label>
                          </div>
                        ))}
                      {categories.filter(cat => {
                        const selectedParent = categories.find(c => c.id === formData.category_id);
                        if (!selectedParent) return false;

                        return (
                          cat.parent_id === formData.category_id ||
                          (selectedParent.woocommerce_id && cat.woocommerce_parent_id === selectedParent.woocommerce_id)
                        );
                      }).length === 0 && (
                        <p className="text-sm text-gray-500 italic">Aucune sous-catégorie disponible pour cette catégorie</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Cochez les sous-catégories auxquelles appartient ce produit
                    </p>
                  </>
                )}
              </div>
            )}
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
            <div className="flex items-center justify-between">
              <Label htmlFor="manage_stock">Gérer le stock</Label>
              <Switch
                id="manage_stock"
                checked={formData.manage_stock}
                onCheckedChange={(checked) => setFormData({ ...formData, manage_stock: checked })}
              />
            </div>

            {formData.manage_stock && (
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
                />
              </div>
            )}

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
            <CardTitle>Attributs du produit</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductAttributesManager
              productId={productId}
              value={formData.attributes}
              onChange={(attributes) => setFormData({ ...formData, attributes })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statut du produit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="status">Statut de publication</Label>
                <p className="text-xs text-gray-500 mt-1">
                  Les brouillons ne sont pas visibles sur le site
                </p>
              </div>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({
                  ...formData,
                  status: e.target.value as 'publish' | 'draft'
                })}
                className="border rounded px-3 py-2"
              >
                <option value="publish">Actif</option>
                <option value="draft">Brouillon</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="featured">Produit en vedette</Label>
                <p className="text-xs text-gray-500 mt-1">
                  Les produits vedettes sont mis en avant sur le site
                </p>
              </div>
              <Switch
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
              />
            </div>
          </CardContent>
        </Card>


        <div className="flex justify-end gap-4">
          <Link href="/admin/products">
            <Button type="button" variant="outline">
              Annuler
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
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
