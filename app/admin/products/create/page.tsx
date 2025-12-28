"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { decodeHtmlEntities } from '@/lib/utils';
import RichTextEditor from '@/components/RichTextEditor';
import WordPressMediaSelector from '@/components/WordPressMediaSelector';
import ProductGalleryManager, { GalleryImage } from '@/components/ProductGalleryManager';
import ProductAttributesManager from '@/components/ProductAttributesManager';
import ProductVariationsManager, { ProductVariation } from '@/components/ProductVariationsManager';

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

export default function CreateProduct() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<WooCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [product, setProduct] = useState({
    name: '',
    description: '',
    short_description: '',
    regular_price: '',
    sale_price: '',
    stock_quantity: '',
    manage_stock: true,
    image_url: '',
    image_id: 0,
    sku: '',
    gallery_images: [] as GalleryImage[],
    attributes: [] as ProductAttribute[],
    categories: [] as number[],
    status: 'publish' as 'publish' | 'draft',
    featured: false,
    type: 'simple' as 'simple' | 'variable',
    variations: [] as ProductVariation[],
  });

  useEffect(() => {
    loadCategories();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/woocommerce/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          productData: {
            name: product.name,
            type: product.type,
            description: product.description,
            short_description: product.short_description,
            regular_price: product.type === 'simple' ? product.regular_price : '',
            sale_price: product.type === 'simple' ? product.sale_price : '',
            manage_stock: product.type === 'simple' ? product.manage_stock : false,
            stock_quantity: product.type === 'simple' ? (parseInt(product.stock_quantity) || 0) : undefined,
            images: product.image_id ? [{ id: product.image_id }, ...product.gallery_images.map(img => ({ id: img.id }))] : product.gallery_images.map(img => ({ id: img.id })),
            sku: product.sku,
            attributes: product.attributes,
            categories: product.categories.map(id => ({ id })),
            status: product.status,
            featured: product.featured,
            variations: product.type === 'variable' ? product.variations : undefined,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Error creating product:', result);
        const errorMessage = result.details?.message || result.error || 'Erreur lors de la création du produit';
        toast.error(errorMessage);
      } else {
        toast.success('Produit créé avec succès');
        router.push('/admin/products');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création');
      console.error('Error creating product:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/products">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Créer un produit</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Image principale</CardTitle>
          </CardHeader>
          <CardContent>
            <WordPressMediaSelector
              selectedImage={product.image_url}
              onSelect={(url, id) => setProduct({ ...product, image_url: url, image_id: id })}
            />
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Galerie d'images</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductGalleryManager
              images={product.gallery_images}
              onChange={(images) => setProduct({ ...product, gallery_images: images })}
            />
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nom du produit *</Label>
              <Input
                id="name"
                required
                value={product.name}
                onChange={(e) => setProduct({ ...product, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="sku">UGS (Référence unique)</Label>
              <Input
                id="sku"
                value={product.sku}
                onChange={(e) => setProduct({ ...product, sku: e.target.value })}
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
                value={product.short_description}
                onChange={(value) => setProduct({ ...product, short_description: value })}
                rows={4}
                placeholder="Description courte visible sur la page produit..."
              />
            </div>
            <div>
              <Label htmlFor="description">Description complète</Label>
              <RichTextEditor
                id="description"
                value={product.description}
                onChange={(value) => setProduct({ ...product, description: value })}
                rows={8}
                placeholder="Description détaillée du produit (matières, entretien, détails...)..."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
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
                      selectedCategories={product.categories}
                      onToggle={(categoryId, checked) => {
                        if (checked) {
                          setProduct({
                            ...product,
                            categories: [...product.categories, categoryId]
                          });
                        } else {
                          setProduct({
                            ...product,
                            categories: product.categories.filter(id => id !== categoryId)
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

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Type de produit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                value={product.type}
                onChange={(e) => {
                  const newType = e.target.value as 'simple' | 'variable';
                  setProduct({
                    ...product,
                    type: newType,
                    variations: newType === 'simple' ? [] : product.variations,
                  });
                }}
                className="border rounded px-3 py-2"
              >
                <option value="simple">Produit simple</option>
                <option value="variable">Produit variable</option>
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {product.type === 'simple'
                ? 'Un produit simple a un seul prix et stock'
                : 'Un produit variable possède plusieurs variations (ex: différentes couleurs ou tailles)'}
            </p>
          </CardContent>
        </Card>

        {product.type === 'simple' && (
          <>
            <Card className="mb-6">
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
                      required
                      value={product.regular_price}
                      onChange={(e) => setProduct({ ...product, regular_price: e.target.value })}
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
                      value={product.sale_price}
                      onChange={(e) => setProduct({ ...product, sale_price: e.target.value })}
                      placeholder="50.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">Ex: 50.00 pour 50,00 €</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Stock</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={product.manage_stock}
                    onCheckedChange={(checked) =>
                      setProduct({ ...product, manage_stock: checked })
                    }
                  />
                  <Label>Gérer le stock</Label>
                </div>
                {product.manage_stock && (
                  <div>
                    <Label htmlFor="stock_quantity">Quantité en stock</Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      value={product.stock_quantity}
                      onChange={(e) => setProduct({ ...product, stock_quantity: e.target.value })}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Attributs du produit</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductAttributesManager
              attributes={product.attributes}
              onChange={(attributes) => setProduct({ ...product, attributes })}
            />
            <p className="text-xs text-gray-500 mt-4">
              Les attributs permettent de définir des caractéristiques comme la couleur, la taille, etc.
              {product.type === 'variable' && (
                <> Activez "Utilisé pour les variations" pour créer des variantes de produit.</>
              )}
            </p>
          </CardContent>
        </Card>

        {product.type === 'variable' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Variations du produit</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductVariationsManager
                attributes={product.attributes}
                variations={product.variations}
                onChange={(variations) => setProduct({ ...product, variations })}
              />
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
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
                value={product.status}
                onChange={(e) => setProduct({
                  ...product,
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
                checked={product.featured}
                onCheckedChange={(checked) =>
                  setProduct({ ...product, featured: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Créer le produit
              </>
            )}
          </Button>
          <Link href="/admin/products">
            <Button type="button" variant="outline">
              Annuler
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
