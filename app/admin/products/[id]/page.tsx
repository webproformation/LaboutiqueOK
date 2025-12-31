"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { decodeHtmlEntities } from '@/lib/utils';
import Link from 'next/link';
import RichTextEditor from '@/components/RichTextEditor';
import WordPressMediaSelector from '@/components/WordPressMediaSelector';
import ProductGalleryManager, { GalleryImage } from '@/components/ProductGalleryManager';
import ProductAttributesManager from '@/components/ProductAttributesManager';
import ProductVariationsManager, { ProductVariation } from '@/components/ProductVariationsManager';
import SeoMetadataEditor from '@/components/SeoMetadataEditor';
import RelatedProductsManager from '@/components/RelatedProductsManager';

interface ProductAttribute {
  name: string;
  options: string[];
  visible: boolean;
  variation: boolean;
}

interface WooCategory {
  id: number;
  name: string;
  slug: string;
  parent?: number;
  children?: WooCategory[];
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
  sku: string;
  gallery_images: GalleryImage[];
  attributes: ProductAttribute[];
  categories: number[];
  status: 'publish' | 'draft';
  type: 'simple' | 'variable';
  variations: ProductVariation[];
}

interface CategoryItemProps {
  category: WooCategory;
  selectedCategories: number[];
  onToggle: (categoryId: number, checked: boolean) => void;
  level: number;
}

function CategoryItem({ category, selectedCategories, onToggle, level }: CategoryItemProps) {
  const indent = level * 24;
  const fontWeight = level === 0 ? 'font-semibold' : 'font-normal';
  const textColor = level === 0 ? 'text-gray-900' : 'text-gray-700';

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2" style={{ paddingLeft: `${indent}px` }}>
        <Checkbox
          id={`category-${category.id}`}
          checked={selectedCategories.includes(category.id)}
          onCheckedChange={(checked) => onToggle(category.id, checked as boolean)}
        />
        <Label
          htmlFor={`category-${category.id}`}
          className={`text-sm cursor-pointer ${fontWeight} ${textColor}`}
        >
          {decodeHtmlEntities(category.name)}
        </Label>
      </div>
      {category.children && category.children.length > 0 && (
        <div className="space-y-2">
          {category.children.map((subcategory) => (
            <CategoryItem
              key={subcategory.id}
              category={subcategory}
              selectedCategories={selectedCategories}
              onToggle={onToggle}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
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
    sku: '',
    gallery_images: [],
    attributes: [],
    categories: [],
    status: 'publish',
    type: 'simple',
    variations: [],
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<WooCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (productId) {
      loadProductData();
    }
  }, [productId]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/woocommerce/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        const errorData = await response.json();
        console.error('Error loading categories:', errorData);
        toast.error(`Impossible de charger les catégories: ${errorData.error || 'Erreur serveur'}`);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Erreur lors du chargement des catégories');
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
        throw new Error(errorData.error || 'Erreur lors du chargement du produit');
      }

      const product = await response.json();

      const images = Array.isArray(product.images) ? product.images : [];
      const mainImage = images[0] || {};
      const galleryImages = images.slice(1).map((img: any) => ({
        url: img.src || img.url || '',
        id: img.id || 0
      }));

      setFormData({
        name: product.name || '',
        slug: product.slug || '',
        description: product.description || '',
        short_description: product.short_description || '',
        regular_price: product.regular_price?.toString() || '',
        sale_price: product.sale_price?.toString() || '',
        stock_quantity: product.stock_quantity || null,
        manage_stock: product.manage_stock || false,
        stock_status: product.stock_status || 'instock',
        featured: product.featured || false,
        image_id: mainImage.id || 0,
        image_url: mainImage.src || mainImage.url || '',
        sku: product.sku || '',
        gallery_images: galleryImages,
        attributes: Array.isArray(product.attributes) ? product.attributes : [],
        categories: Array.isArray(product.categories)
          ? product.categories.map((cat: any) => cat.id || cat)
          : [],
        status: product.status || 'publish',
        type: product.type || 'simple',
        variations: Array.isArray(product.variations) ? product.variations : [],
      });
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors du chargement du produit');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const productData = {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        short_description: formData.short_description,
        regular_price: formData.type === 'simple' ? formData.regular_price : '',
        sale_price: formData.type === 'simple' ? formData.sale_price : '',
        manage_stock: formData.type === 'simple' ? formData.manage_stock : false,
        stock_quantity: formData.type === 'simple' ? formData.stock_quantity : undefined,
        stock_status: formData.stock_status,
        featured: formData.featured,
        images: formData.image_id ? [{ id: formData.image_id }, ...formData.gallery_images.map(img => ({ id: img.id }))] : formData.gallery_images.map(img => ({ id: img.id })),
        sku: formData.sku,
        attributes: formData.attributes,
        categories: formData.categories.map(id => ({ id })),
        status: formData.status,
        variations: formData.type === 'variable' ? formData.variations : undefined,
      };

      const response = await fetch('/api/woocommerce/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: parseInt(productId),
          productData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Error updating product:', result);
        const errorMessage = result.details?.message || result.error || 'Erreur lors de la mise à jour du produit';
        throw new Error(errorMessage);
      }

      toast.success('Produit mis à jour avec succès');
      router.push('/admin/products');
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
          <CardContent>
            <WordPressMediaSelector
              selectedImage={formData.image_url}
              onSelect={(url, id) => setFormData({ ...formData, image_url: url, image_id: id })}
            />
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
              <Label htmlFor="sku">UGS (Référence unique)</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Ex: VES-MNK-001"
              />
              <p className="text-xs text-gray-500 mt-1">
                Identifiant unique pour ce produit (SKU)
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
                placeholder="Description détaillée du produit (matières, entretien, détails...)..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Catégories</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCategories ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="space-y-2">
                {categories.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucune catégorie disponible</p>
                ) : (
                  categories.map((category) => (
                    <CategoryItem
                      key={category.id}
                      category={category}
                      selectedCategories={formData.categories}
                      onToggle={(categoryId, checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            categories: [...formData.categories, categoryId]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            categories: formData.categories.filter(id => id !== categoryId)
                          });
                        }
                      }}
                      level={0}
                    />
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Type de produit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => {
                  const newType = e.target.value as 'simple' | 'variable';
                  setFormData({
                    ...formData,
                    type: newType,
                    variations: newType === 'simple' ? [] : formData.variations,
                  });
                }}
                className="border rounded px-3 py-2"
              >
                <option value="simple">Produit simple</option>
                <option value="variable">Produit variable</option>
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {formData.type === 'simple'
                ? 'Un produit simple a un seul prix et stock'
                : 'Un produit variable possède plusieurs variations (ex: différentes couleurs ou tailles)'}
            </p>
          </CardContent>
        </Card>

        {formData.type === 'simple' && (
          <>
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
          </>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Attributs du produit</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductAttributesManager
              attributes={formData.attributes}
              onChange={(attributes) => setFormData({ ...formData, attributes })}
            />
            <p className="text-xs text-gray-500 mt-4">
              Les attributs permettent de définir des caractéristiques comme la couleur, la taille, etc.
              {formData.type === 'variable' && (
                <> Activez "Utilisé pour les variations" pour créer des variantes de produit.</>
              )}
            </p>
          </CardContent>
        </Card>

        {formData.type === 'variable' && (
          <Card>
            <CardHeader>
              <CardTitle>Variations du produit</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductVariationsManager
                attributes={formData.attributes}
                variations={formData.variations}
                onChange={(variations) => setFormData({ ...formData, variations })}
              />
            </CardContent>
          </Card>
        )}

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

        {formData.slug && (
          <SeoMetadataEditor
            entityType="category"
            entityIdentifier={formData.slug}
            autoSave={false}
          />
        )}

        <RelatedProductsManager productId={productId} />

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
    </div>
  );
}
