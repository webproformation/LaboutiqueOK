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
import { createClient } from '@/lib/supabase-client';

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
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, woocommerce_id, woocommerce_parent_id, parent_id')
        .order('name');

      if (error) {
        console.error('[LOAD] ❌ Erreur chargement catégories:', error);
        throw new Error(`Erreur: ${error.message}`);
      }

      setCategories(data || []);
      console.log(`[LOAD] 📂 ${data?.length || 0} catégories chargées`);
    } catch (error) {
      console.error('[LOAD] 💥 Error loading categories:', error);
      toast.error('Erreur lors du chargement des catégories');
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadProductData = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      console.log('[LOAD] 📥 Chargement produit:', productId);

      // CHARGER LE PRODUIT
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .maybeSingle();

      if (productError) {
        console.error('[LOAD] ❌ Erreur chargement produit:', productError);
        throw new Error(`Erreur: ${productError.message}`);
      }

      if (!product) {
        throw new Error('Produit introuvable');
      }

      console.log('[LOAD] ✅ Produit chargé:', product.name);

      // CHARGER LES CATÉGORIES DU PRODUIT
      const { data: productCategories, error: categoriesError } = await supabase
        .from('product_categories')
        .select('category_id')
        .eq('product_id', productId)
        .order('display_order');

      if (categoriesError) {
        console.error('[LOAD] ⚠️ Erreur chargement catégories:', categoriesError);
      }

      const childCategoryIds = productCategories?.map(pc => pc.category_id) || [];
      console.log(`[LOAD] 📂 ${childCategoryIds.length} catégories chargées`);

      // CHARGER LES ATTRIBUTS DU PRODUIT
      const { data: productAttributeValues, error: attributesError } = await supabase
        .from('product_attribute_values')
        .select('attribute_id, term_id')
        .eq('product_id', productId);

      if (attributesError) {
        console.error('[LOAD] ⚠️ Erreur chargement attributs:', attributesError);
      }

      const attributesMap = new Map<string, string[]>();
      productAttributeValues?.forEach(pav => {
        if (!attributesMap.has(pav.attribute_id)) {
          attributesMap.set(pav.attribute_id, []);
        }
        attributesMap.get(pav.attribute_id)!.push(pav.term_id);
      });

      const attributes: ProductAttribute[] = Array.from(attributesMap.entries()).map(([attribute_id, term_ids]) => ({
        attribute_id,
        term_ids,
      }));

      console.log(`[LOAD] 🏷️ ${attributes.length} attributs chargés`);

      // CHARGER LES IMAGES DU PRODUIT
      const { data: productImages, error: imagesError } = await supabase
        .from('product_images')
        .select('image_url, is_primary')
        .eq('product_id', productId)
        .order('display_order');

      if (imagesError) {
        console.error('[LOAD] ⚠️ Erreur chargement images:', imagesError);
      }

      let mainImageUrl = '';
      let galleryImages: GalleryImage[] = [];

      if (productImages && productImages.length > 0) {
        const primaryImage = productImages.find(img => img.is_primary);
        mainImageUrl = primaryImage?.image_url || productImages[0].image_url;
        galleryImages = productImages
          .filter(img => !img.is_primary)
          .map((img, idx) => ({
            url: img.image_url,
            id: idx,
          }));
        console.log(`[LOAD] 🖼️ ${productImages.length} images chargées (1 principale + ${galleryImages.length} galerie)`);
      } else {
        console.log('[LOAD] ⚠️ Aucune image trouvée');
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
        attributes: attributes,
      });

      console.log('[LOAD] 🎉 Chargement complet réussi');
    } catch (error) {
      console.error('[LOAD] 💥 ERREUR CRITIQUE:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors du chargement du produit');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();

    try {
      console.log('[SAVE] 🚀 Début sauvegarde produit:', productId);

      // STEP 1: UPDATE PRODUCTS TABLE
      const { error: productError } = await supabase
        .from('products')
        .update({
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          short_description: formData.short_description,
          regular_price: parseFloat(formData.regular_price) || 0,
          sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
          stock_quantity: formData.stock_quantity,
          stock_status: formData.stock_status,
          featured: formData.featured,
          is_active: formData.status === 'publish',
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);

      if (productError) {
        console.error('[SAVE] ❌ Erreur UPDATE products:', productError);
        throw new Error(`Erreur produit: ${productError.message}`);
      }
      console.log('[SAVE] ✅ Produit mis à jour');

      // STEP 2: DELETE + INSERT PRODUCT_CATEGORIES
      const { error: deleteCategoriesError } = await supabase
        .from('product_categories')
        .delete()
        .eq('product_id', productId);

      if (deleteCategoriesError) {
        console.error('[SAVE] ❌ Erreur DELETE product_categories:', deleteCategoriesError);
        throw new Error(`Erreur suppression catégories: ${deleteCategoriesError.message}`);
      }

      if (formData.child_category_ids.length > 0) {
        const categoriesToInsert = formData.child_category_ids.map((categoryId, index) => ({
          product_id: productId,
          category_id: categoryId,
          is_primary: index === 0,
          display_order: index,
        }));

        const { error: insertCategoriesError } = await supabase
          .from('product_categories')
          .insert(categoriesToInsert);

        if (insertCategoriesError) {
          console.error('[SAVE] ❌ Erreur INSERT product_categories:', insertCategoriesError);
          throw new Error(`Erreur insertion catégories: ${insertCategoriesError.message}`);
        }
        console.log(`[SAVE] ✅ ${formData.child_category_ids.length} catégories sauvegardées`);
      } else {
        console.log('[SAVE] ℹ️ Aucune catégorie à sauvegarder');
      }

      // STEP 3: DELETE + INSERT PRODUCT_ATTRIBUTE_VALUES
      const { error: deleteAttributesError } = await supabase
        .from('product_attribute_values')
        .delete()
        .eq('product_id', productId);

      if (deleteAttributesError) {
        console.error('[SAVE] ❌ Erreur DELETE product_attribute_values:', deleteAttributesError);
        throw new Error(`Erreur suppression attributs: ${deleteAttributesError.message}`);
      }

      if (formData.attributes && formData.attributes.length > 0) {
        const attributeValuesToInsert = formData.attributes.flatMap(attr =>
          attr.term_ids.map(termId => ({
            product_id: productId,
            attribute_id: attr.attribute_id,
            term_id: termId,
          }))
        );

        if (attributeValuesToInsert.length > 0) {
          const { error: insertAttributesError } = await supabase
            .from('product_attribute_values')
            .insert(attributeValuesToInsert);

          if (insertAttributesError) {
            console.error('[SAVE] ❌ Erreur INSERT product_attribute_values:', insertAttributesError);
            throw new Error(`Erreur insertion attributs: ${insertAttributesError.message}`);
          }
          console.log(`[SAVE] ✅ ${attributeValuesToInsert.length} attributs sauvegardés`);
        }
      } else {
        console.log('[SAVE] ℹ️ Aucun attribut à sauvegarder');
      }

      // STEP 4: DELETE + INSERT PRODUCT_IMAGES
      const { error: deleteImagesError } = await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productId);

      if (deleteImagesError) {
        console.error('[SAVE] ❌ Erreur DELETE product_images:', deleteImagesError);
        throw new Error(`Erreur suppression images: ${deleteImagesError.message}`);
      }

      const allImages = formData.image_url
        ? [{ url: formData.image_url, id: 0 }, ...formData.gallery_images]
        : formData.gallery_images;

      if (allImages.length > 0) {
        const imagesToInsert = allImages.map((img, index) => ({
          product_id: productId,
          image_url: img.url || img.src || '',
          display_order: index,
          is_primary: index === 0,
        }));

        const { error: insertImagesError } = await supabase
          .from('product_images')
          .insert(imagesToInsert);

        if (insertImagesError) {
          console.error('[SAVE] ❌ Erreur INSERT product_images:', insertImagesError);
          throw new Error(`Erreur insertion images: ${insertImagesError.message}`);
        }
        console.log(`[SAVE] ✅ ${allImages.length} images sauvegardées`);
      } else {
        console.log('[SAVE] ℹ️ Aucune image à sauvegarder');
      }

      console.log('[SAVE] 🎉 Sauvegarde complète réussie');
      toast.success('Produit mis à jour avec succès');

      setTimeout(() => {
        router.push('/admin/products');
        router.refresh();
      }, 500);
    } catch (error: any) {
      console.error('[SAVE] 💥 ERREUR CRITIQUE:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour');
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
