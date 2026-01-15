"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, ArrowLeft, Plus, X, Upload } from "lucide-react";
import Link from "next/link";
import { ProductMediaSelector } from "@/components/product-media-selector";
import RichTextEditor from "@/components/RichTextEditor";
import ProductVariationsManager from "@/components/ProductVariationsManager";
import ProductAttributesSelector from "@/components/ProductAttributesSelector";

interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;
  description: string;
  regular_price: number;
  sale_price: number | null;
  stock_quantity: number;
  status: string;
  image_url: string | null;
  images: any;
  gallery_images?: string[] | any;
  is_diamond?: boolean;
  is_featured?: boolean;
  is_variable_product?: boolean;
  has_variations?: boolean;
  attributes?: any;
  main_color?: string | null;
  size_range_start?: number | null;
  size_range_end?: number | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  display_order: number | null;
}

interface AttributeTerm {
  id: string;
  attribute_id: string;
  name: string;
  slug: string;
  color_code: string | null;
  value: string;
  order_by: number;
}

interface ProductAttribute {
  id: string;
  name: string;
  slug: string;
  type: string;
  terms?: AttributeTerm[];
}

interface ProductVariation {
  id?: string;
  sku: string;
  attributes: Record<string, string>;
  regular_price: number | null;
  sale_price: number | null;
  stock_quantity: number | null;
  image_url: string | null;
  stock_status: string;
}

interface SeoData {
  seo_title: string;
  meta_description: string;
  og_title: string;
  og_description: string;
  og_image: string;
}

interface ProductEditFormProps {
  product: Product;
  selectedCategories: string[];
  allCategories: Category[];
}

export default function ProductEditForm({
  product: initialProduct,
  selectedCategories: initialCategories,
  allCategories,
}: ProductEditFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // États du formulaire
  const [product, setProduct] = useState(initialProduct);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [variations, setVariations] = useState<any[]>([]);
  const [selectedAttributeTerms, setSelectedAttributeTerms] = useState<Record<string, string[]>>({});
  const [secondaryColor, setSecondaryColor] = useState<string>("");
  const [availableColors, setAvailableColors] = useState<Array<{id: string, name: string, color_code?: string}>>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>(
    Array.isArray(initialProduct.gallery_images) ? initialProduct.gallery_images :
    (initialProduct.images?.gallery_images || [])
  );
  const [seoData, setSeoData] = useState<SeoData>({
    seo_title: "",
    meta_description: "",
    og_title: "",
    og_description: "",
    og_image: "",
  });

  // Charger les attributs et données SEO
  useEffect(() => {
    loadAttributes();
    loadSeoData();
    loadVariations();
    loadProductAttributes();
    loadColors();
  }, []);


  const loadProductAttributes = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("attributes")
        .eq("id", product.id)
        .maybeSingle();

      if (error) throw error;

      if (data && data.attributes) {
        const attrs = data.attributes;
        if (typeof attrs === 'object' && !Array.isArray(attrs)) {
          setSelectedAttributeTerms(attrs);
        }
      }
    } catch (error) {
      console.error("Error loading product attributes:", error);
    }
  };

  const loadAttributes = async () => {
    try {
      const { data: attrs, error } = await supabase
        .from("product_attributes")
        .select(`
          *,
          product_attribute_terms (
            id,
            name,
            slug,
            value,
            color_code,
            order_by,
            attribute_id
          )
        `)
        .eq("is_visible", true)
        .order("order_by");

      if (error) throw error;

      if (attrs) {
        const formatted = attrs.map(attr => ({
          ...attr,
          terms: attr.product_attribute_terms
        }));
        setAttributes(formatted as any);
      }
    } catch (error) {
      console.error("Error loading attributes:", error);
      toast.error("Erreur lors du chargement des attributs", {
        position: "bottom-right",
      });
    }
  };

  const loadSeoData = async () => {
    try {
      const { data, error } = await supabase
        .from("seo_metadata")
        .select("*")
        .eq("product_id", product.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSeoData({
          seo_title: data.seo_title || "",
          meta_description: data.meta_description || "",
          og_title: data.og_title || "",
          og_description: data.og_description || "",
          og_image: data.og_image || "",
        });
      }
    } catch (error) {
      console.error("Error loading SEO data:", error);
      toast.error("Erreur lors du chargement des données SEO", {
        position: "bottom-right",
      });
    }
  };

  const loadColors = async () => {
    try {
      const { data: colorAttr, error: attrError } = await supabase
        .from("product_attributes")
        .select("id")
        .or("slug.eq.couleur,slug.ilike.%couleur%,name.ilike.%couleur%")
        .maybeSingle();

      if (attrError) throw attrError;

      if (colorAttr) {
        const { data: colorTerms, error: termsError } = await supabase
          .from("product_attribute_terms")
          .select("id, name, slug, color_code")
          .eq("attribute_id", colorAttr.id)
          .order("order_by");

        if (termsError) throw termsError;

        if (colorTerms) {
          const validColors = colorTerms.filter(c => c.name && c.name.trim());
          setAvailableColors(validColors);
        }
      }
    } catch (error) {
      console.error("Error loading colors:", error);
    }
  };

  const loadVariations = async () => {
    try {
      const { data, error } = await supabase
        .from("product_variations")
        .select("*")
        .eq("product_id", product.id)
        .eq("is_active", true);

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedVariations = data.map(v => ({
          attributes: v.attributes || {},
          image_url: v.image_url,
          sku: v.sku,
          regular_price: v.regular_price,
          sale_price: v.sale_price,
          stock_quantity: v.stock_quantity,
          size_min: v.size_min,
          size_max: v.size_max,
        }));
        setVariations(formattedVariations);
      }
    } catch (error) {
      console.error("Error loading variations:", error);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleVariationsChange = (newVariations: any[]) => {
    setVariations(newVariations);
  };

  const handleSave = async () => {
    if (!product.name || !product.slug) {
      toast.error("Le nom et le slug sont requis", {
        position: "bottom-right",
      });
      return;
    }

    setSaving(true);

    try {
      // 1. Mettre à jour le produit
      const productUpdateData: any = {
        name: String(product.name).trim(),
        slug: String(product.slug).trim(),
        sku: product.sku ? String(product.sku).trim() : null,
        description: product.description || "",
        regular_price: parseFloat(String(product.regular_price)) || 0,
        sale_price: product.sale_price ? parseFloat(String(product.sale_price)) : null,
        stock_quantity: parseInt(String(product.stock_quantity)) || 0,
        status: product.status || "draft",
        image_url: product.image_url || null,
        gallery_images: galleryImages.length > 0 ? galleryImages : null,
        is_diamond: Boolean(product.is_diamond),
        is_featured: Boolean(product.is_featured),
        has_variations: variations.length > 0,
        is_variable_product: variations.length > 0,
        attributes: {},
        main_color: product.main_color || null,
        size_range_start: product.size_range_start,
        size_range_end: product.size_range_end,
      };

      const { error: productError } = await supabase
        .from("products")
        .update(productUpdateData)
        .eq("id", String(product.id));

      if (productError) {
        console.error("Product Update Error:", productError);
        throw productError;
      }

      // 2. Mettre à jour les catégories
      const { error: deleteCatError } = await supabase
        .from("product_category_mapping")
        .delete()
        .eq("product_id", String(product.id));

      if (deleteCatError) {
        console.error("Delete Category Mapping Error:", deleteCatError);
        throw deleteCatError;
      }

      if (selectedCategories.length > 0) {
        const categoryMappings = selectedCategories.map((catId, index) => ({
          product_id: String(product.id),
          category_id: String(catId),
          is_primary: index === 0,
          display_order: index,
        }));

        const { error: insertCatError } = await supabase
          .from("product_category_mapping")
          .insert(categoryMappings);

        if (insertCatError) {
          console.error("Insert Category Mapping Error:", insertCatError);
          throw insertCatError;
        }
      }

      // 3. Mettre à jour les variations (seulement pour les produits variables)
      const { error: deleteVarError } = await supabase
        .from("product_variations")
        .delete()
        .eq("product_id", String(product.id));

      if (deleteVarError) {
        console.error("Delete Variations Error:", deleteVarError);
        throw deleteVarError;
      }

      if (variations.length > 0) {
        const variationsToInsert = variations.map(v => ({
          product_id: String(product.id),
          sku: String(v.sku || ""),
          attributes: v.attributes || {},
          regular_price: v.regular_price ? parseFloat(String(v.regular_price)) : null,
          sale_price: v.sale_price ? parseFloat(String(v.sale_price)) : null,
          stock_quantity: v.stock_quantity ? parseInt(String(v.stock_quantity)) : null,
          image_url: v.image_url || null,
          size_min: v.size_min ? parseInt(String(v.size_min)) : null,
          size_max: v.size_max ? parseInt(String(v.size_max)) : null,
          stock_status: "instock",
          is_active: true,
        }));

        const { data: insertedVariations, error: insertVarError } = await supabase
          .from("product_variations")
          .insert(variationsToInsert)
          .select();

        if (insertVarError) {
          console.error("Insert Variations Error:", insertVarError);
          throw insertVarError;
        }
      }

      // 4. Mettre à jour le SEO
      const { error: deleteSeoError } = await supabase
        .from("seo_metadata")
        .delete()
        .eq("product_id", String(product.id));

      if (deleteSeoError) {
        console.error("Delete SEO Error:", deleteSeoError);
        throw deleteSeoError;
      }

      if (seoData.seo_title || seoData.meta_description) {
        const seoInsertData = {
          entity_type: "product",
          entity_identifier: String(product.slug).trim(),
          product_id: String(product.id),
          seo_title: String(seoData.seo_title || "").trim(),
          meta_description: String(seoData.meta_description || "").trim(),
          og_title: String(seoData.og_title || "").trim(),
          og_description: String(seoData.og_description || "").trim(),
          og_image: String(seoData.og_image || "").trim() || null,
          is_active: true,
        };

        const { error: insertSeoError } = await supabase
          .from("seo_metadata")
          .insert(seoInsertData);

        if (insertSeoError) {
          console.error("Insert SEO Error:", insertSeoError);
          throw insertSeoError;
        }
      }

      toast.success("Produit mis à jour avec succès", {
        duration: 4000,
        position: "bottom-right",
      });

      // Rafraîchir le cache puis rediriger
      router.refresh();

      setTimeout(() => {
        router.push("/admin/products");
      }, 500);
    } catch (error: any) {
      console.error("=== FULL SUPABASE ERROR ===");
      console.error("Error Object:", JSON.stringify(error, null, 2));
      console.error("Error Message:", error?.message);
      console.error("Error Details:", error?.details);
      console.error("Error Hint:", error?.hint);
      console.error("Error Code:", error?.code);
      console.error("========================");

      let errorMessage = "Erreur lors de la sauvegarde";

      if (error?.message) {
        errorMessage = error.message;
      }

      if (error?.details) {
        errorMessage += ` - Détails: ${error.details}`;
      }

      if (error?.hint) {
        errorMessage += ` - Conseil: ${error.hint}`;
      }

      if (error?.code) {
        errorMessage += ` (Code: ${error.code})`;
      }

      toast.error(errorMessage, {
        duration: 8000,
        position: "bottom-right",
      });
    } finally {
      setSaving(false);
    }
  };

  // Organiser les catégories de façon hiérarchique
  const buildCategoryTree = () => {
    const rootCategories = allCategories.filter(c => !c.parent_id);

    const buildChildren = (parentId: string): Category[] => {
      return allCategories
        .filter(c => c.parent_id === parentId)
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    };

    const addChildren = (category: Category): any => {
      const children = buildChildren(category.id);
      return {
        ...category,
        children: children.map(child => addChildren(child))
      };
    };

    return rootCategories.map(root => addChildren(root));
  };

  const categoryTree = buildCategoryTree();

  const renderCategoryCheckbox = (category: any, level: number = 0) => {
    return (
      <div key={category.id}>
        <div className="flex items-center space-x-2" style={{ paddingLeft: `${level * 24}px` }}>
          <Checkbox
            id={`cat-${category.id}`}
            checked={selectedCategories.includes(category.id)}
            onCheckedChange={() => handleCategoryToggle(category.id)}
          />
          <Label htmlFor={`cat-${category.id}`} className="cursor-pointer text-gray-900">
            {category.name}
          </Label>
        </div>
        {category.children && category.children.length > 0 && (
          <div className="mt-1">
            {category.children.map((child: any) => renderCategoryCheckbox(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto pb-20 md:pb-0">
      {/* Header - Responsive */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <Link href="/admin/products" className="inline-flex items-center text-gray-600 hover:text-[#d4af37] text-sm md:text-base">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux produits
        </Link>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="hidden md:flex bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d] text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>

      {/* Mobile Save Button - Sticky */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-lg z-40">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d] text-white"
        >
          <Save className="h-5 w-5 mr-2" />
          {saving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>

      {/* Formulaire Mobile-First - Tout en dessous */}
      <div className="space-y-6">

        {/* Informations de base */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-[#d4af37]">Informations de base</CardTitle>
            <CardDescription>Détails principaux du produit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nom du produit *</Label>
              <Input
                id="name"
                value={product.name}
                onChange={(e) => setProduct({ ...product, name: e.target.value })}
                className="bg-white"
              />
            </div>

            <div>
              <Label htmlFor="slug">Slug (URL) *</Label>
              <Input
                id="slug"
                value={product.slug}
                onChange={(e) => setProduct({ ...product, slug: e.target.value })}
                className="bg-white"
              />
            </div>

            <div>
              <Label htmlFor="sku">UGS / SKU (Référence produit)</Label>
              <p className="text-xs text-gray-500 mb-2">
                Cette référence sera affichée dans le panier, checkout et commandes
              </p>
              <Input
                id="sku"
                value={product.sku || ""}
                onChange={(e) => setProduct({ ...product, sku: e.target.value })}
                placeholder="Ex: PROD-001"
                className="bg-white"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <RichTextEditor
                value={product.description || ""}
                onChange={(value) => setProduct({ ...product, description: value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="regular_price">Prix régulier (€) *</Label>
                <Input
                  id="regular_price"
                  type="number"
                  step="0.01"
                  value={product.regular_price}
                  onChange={(e) => setProduct({ ...product, regular_price: parseFloat(e.target.value) })}
                  className="bg-white"
                />
              </div>

              <div>
                <Label htmlFor="sale_price">Prix promo (€)</Label>
                <Input
                  id="sale_price"
                  type="number"
                  step="0.01"
                  value={product.sale_price || ""}
                  onChange={(e) => setProduct({ ...product, sale_price: e.target.value ? parseFloat(e.target.value) : null })}
                  className="bg-white"
                />
              </div>

              <div>
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={product.stock_quantity}
                  onChange={(e) => setProduct({ ...product, stock_quantity: parseInt(e.target.value) })}
                  className="bg-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Statut</Label>
              <Select
                value={product.status}
                onValueChange={(value) => setProduct({ ...product, status: value })}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="publish">Publié</SelectItem>
                  <SelectItem value="private">Privé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_featured"
                  checked={product.is_featured || false}
                  onCheckedChange={(checked) => setProduct({ ...product, is_featured: !!checked })}
                />
                <Label htmlFor="is_featured" className="cursor-pointer">Produit vedette</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_diamond"
                  checked={product.is_diamond || false}
                  onCheckedChange={(checked) => setProduct({ ...product, is_diamond: !!checked })}
                />
                <Label htmlFor="is_diamond" className="cursor-pointer">Diamant caché</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Caractéristiques Produit */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-[#d4af37]">Caractéristiques & Filtres</CardTitle>
            <CardDescription>Définir les caractéristiques du produit pour les filtres</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="mainColor">Couleur Principale *</Label>
              <Input
                id="mainColor"
                type="text"
                value={product.main_color || ""}
                onChange={(e) => setProduct({ ...product, main_color: e.target.value })}
                className="bg-white"
                placeholder="Ex: Gris, Bleu, Noir..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Cette couleur sera utilisée pour les filtres (ex: Gris, Bleu, Beige)
              </p>
            </div>

            <div>
              <Label htmlFor="secondaryColor">Couleur Secondaire (Optionnel)</Label>
              <Select
                value={secondaryColor}
                onValueChange={(value) => {
                  setSecondaryColor(value);
                  if (value && value !== "none") {
                    if (variations.length === 0) {
                      setVariations([{
                        sku: "",
                        attributes: { "Couleur": value },
                        regular_price: null,
                        sale_price: null,
                        stock_quantity: null,
                        image_url: null,
                        stock_status: "instock"
                      }]);
                    }
                  }
                }}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Sélectionner une couleur secondaire..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune (produit simple)</SelectItem>
                  {availableColors.map(color => (
                    <SelectItem key={color.id} value={color.name}>
                      {color.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Si vous sélectionnez une couleur secondaire, vous pourrez créer des variations du produit
              </p>
            </div>

            {secondaryColor && secondaryColor !== "none" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-900 font-medium">
                  ⚙️ Mode Variations Activé
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Une couleur secondaire a été sélectionnée. Vous pourrez définir des prix, stocks et images spécifiques pour cette variation dans la section ci-dessous.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sizeRangeStart">Taille Minimum</Label>
                <Select
                  value={product.size_range_start?.toString() || "none"}
                  onValueChange={(value) => setProduct({ ...product, size_range_start: value === "none" ? null : parseInt(value) })}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Choisir la taille min" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    {Array.from({ length: 11 }, (_, i) => 34 + (i * 2)).map(size => (
                      <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="sizeRangeEnd">Taille Maximum</Label>
                <Select
                  value={product.size_range_end?.toString() || "none"}
                  onValueChange={(value) => setProduct({ ...product, size_range_end: value === "none" ? null : parseInt(value) })}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Choisir la taille max" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    {Array.from({ length: 11 }, (_, i) => 34 + (i * 2)).map(size => (
                      <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {product.size_range_start && product.size_range_end && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  <strong>Intervalle de tailles:</strong> {product.size_range_start} à {product.size_range_end}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Le produit sera affiché pour les utilisateurs ayant une taille dans cet intervalle
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Image principale */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-[#d4af37]">Image principale</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductMediaSelector
              currentImageUrl={product.image_url || ""}
              onSelect={(url) => setProduct({ ...product, image_url: url })}
            />
          </CardContent>
        </Card>

        {/* Galerie d'images */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-[#d4af37]">Galerie d'images</CardTitle>
            <CardDescription>Ajoutez plusieurs images pour la galerie du produit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Liste des images de la galerie */}
              {galleryImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {galleryImages.map((imageUrl, index) => (
                    <div key={index} className="relative group border-2 border-gray-200 rounded-lg overflow-hidden aspect-square">
                      <img
                        src={imageUrl}
                        alt={`Galerie ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            setGalleryImages(prev => prev.filter((_, i) => i !== index));
                            toast.success("Image retirée de la galerie");
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Ajouter une nouvelle image à la galerie */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Ajouter une image à la galerie
                </Label>
                <ProductMediaSelector
                  currentImageUrl=""
                  onSelect={(url) => {
                    if (!galleryImages.includes(url)) {
                      setGalleryImages(prev => [...prev, url]);
                      toast.success("Image ajoutée à la galerie");
                    } else {
                      toast.error("Cette image est déjà dans la galerie");
                    }
                  }}
                />
              </div>

              {galleryImages.length === 0 && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-sm">Aucune image dans la galerie</p>
                  <p className="text-xs mt-1">Utilisez le sélecteur ci-dessus pour ajouter des images</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Catégories */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-[#d4af37]">Catégories</CardTitle>
            <CardDescription>Sélectionnez les catégories du produit - Hiérarchie complète</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-96 overflow-y-auto p-1">
              {categoryTree.map((category: any) => renderCategoryCheckbox(category))}
            </div>
          </CardContent>
        </Card>

        {/* Variations de Produit */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-[#d4af37]">Variations de Produit</CardTitle>
            <CardDescription>
              Tous les produits ont des variations. Sélectionnez les attributs pour générer automatiquement les combinaisons.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductVariationsManager
              initialVariations={variations}
              onChange={handleVariationsChange}
            />
          </CardContent>
        </Card>

        {/* SEO */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-[#d4af37]">Référencement (SEO)</CardTitle>
            <CardDescription>Optimisez le produit pour les moteurs de recherche</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="seo_title">Titre SEO</Label>
              <Input
                id="seo_title"
                value={seoData.seo_title}
                onChange={(e) => setSeoData({ ...seoData, seo_title: e.target.value })}
                placeholder={product.name || "Titre optimisé pour le SEO"}
                className="bg-white"
              />
              <p className="text-xs text-gray-500 mt-1">Recommandé : 50-60 caractères</p>
            </div>

            <div>
              <Label htmlFor="meta_description">Meta Description</Label>
              <Textarea
                id="meta_description"
                value={seoData.meta_description}
                onChange={(e) => setSeoData({ ...seoData, meta_description: e.target.value })}
                placeholder="Description du produit pour les résultats de recherche"
                rows={3}
                className="bg-white"
              />
              <p className="text-xs text-gray-500 mt-1">Recommandé : 150-160 caractères</p>
            </div>

            <div>
              <Label htmlFor="og_title">Titre Open Graph (réseaux sociaux)</Label>
              <Input
                id="og_title"
                value={seoData.og_title}
                onChange={(e) => setSeoData({ ...seoData, og_title: e.target.value })}
                placeholder={seoData.seo_title || product.name}
                className="bg-white"
              />
            </div>

            <div>
              <Label htmlFor="og_description">Description Open Graph</Label>
              <Textarea
                id="og_description"
                value={seoData.og_description}
                onChange={(e) => setSeoData({ ...seoData, og_description: e.target.value })}
                placeholder={seoData.meta_description || "Description pour les réseaux sociaux"}
                rows={2}
                className="bg-white"
              />
            </div>

            <div>
              <Label>Image Open Graph</Label>
              <ProductMediaSelector
                currentImageUrl={seoData.og_image || ""}
                onSelect={(url) => setSeoData({ ...seoData, og_image: url })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bouton de sauvegarde fixe en bas */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-end shadow-lg">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d] text-white"
        >
          <Save className="h-5 w-5 mr-2" />
          {saving ? "Enregistrement..." : "Enregistrer le produit"}
        </Button>
      </div>
    </div>
  );
}
