"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
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
import { MediaSelector } from "@/components/media-selector";
import RichTextEditor from "@/components/RichTextEditor";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  regular_price: number;
  sale_price: number | null;
  stock_quantity: number;
  status: string;
  image_url: string | null;
  images: any;
  is_diamond?: boolean;
  is_featured?: boolean;
  is_variable_product?: boolean;
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
  const supabase = createClient();
  const [saving, setSaving] = useState(false);

  // États du formulaire
  const [product, setProduct] = useState(initialProduct);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [selectedAttributeTerms, setSelectedAttributeTerms] = useState<Record<string, string[]>>({});
  const [variations, setVariations] = useState<ProductVariation[]>([]);
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
  }, []);

  const loadAttributes = async () => {
    const { data: attrs } = await supabase
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

    if (attrs) {
      const formatted = attrs.map(attr => ({
        ...attr,
        terms: attr.product_attribute_terms
      }));
      setAttributes(formatted as any);
    }
  };

  const loadSeoData = async () => {
    const { data } = await supabase
      .from("seo_metadata")
      .select("*")
      .eq("product_id", product.id)
      .maybeSingle();

    if (data) {
      setSeoData({
        seo_title: data.seo_title || "",
        meta_description: data.meta_description || "",
        og_title: data.og_title || "",
        og_description: data.og_description || "",
        og_image: data.og_image || "",
      });
    }
  };

  const loadVariations = async () => {
    const { data } = await supabase
      .from("product_variations")
      .select("*")
      .eq("product_id", product.id)
      .eq("is_active", true);

    if (data) {
      setVariations(data);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleAttributeTermToggle = (attributeId: string, termId: string) => {
    setSelectedAttributeTerms(prev => {
      const current = prev[attributeId] || [];
      const updated = current.includes(termId)
        ? current.filter(id => id !== termId)
        : [...current, termId];
      return { ...prev, [attributeId]: updated };
    });
  };

  const addVariation = () => {
    setVariations(prev => [...prev, {
      sku: "",
      attributes: {},
      regular_price: product.regular_price,
      sale_price: product.sale_price,
      stock_quantity: 0,
      image_url: null,
      stock_status: "instock",
    }]);
  };

  const updateVariation = (index: number, field: string, value: any) => {
    setVariations(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeVariation = (index: number) => {
    setVariations(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!product.name || !product.slug) {
      toast.error("Le nom et le slug sont requis");
      return;
    }

    setSaving(true);

    try {
      // 1. Mettre à jour le produit
      const { error: productError } = await supabase
        .from("products")
        .update({
          name: product.name,
          slug: product.slug,
          description: product.description,
          regular_price: product.regular_price,
          sale_price: product.sale_price,
          stock_quantity: product.stock_quantity,
          status: product.status,
          image_url: product.image_url,
          is_diamond: product.is_diamond,
          is_featured: product.is_featured,
          is_variable_product: variations.length > 0,
        })
        .eq("id", product.id);

      if (productError) throw productError;

      // 2. Mettre à jour les catégories
      await supabase
        .from("product_category_mapping")
        .delete()
        .eq("product_id", product.id);

      if (selectedCategories.length > 0) {
        const categoryMappings = selectedCategories.map((catId, index) => ({
          product_id: product.id,
          category_id: catId,
          is_primary: index === 0,
          display_order: index,
        }));

        await supabase
          .from("product_category_mapping")
          .insert(categoryMappings);
      }

      // 3. Mettre à jour les variations
      await supabase
        .from("product_variations")
        .delete()
        .eq("product_id", product.id);

      if (variations.length > 0) {
        const variationsToInsert = variations.map(v => ({
          product_id: product.id,
          sku: v.sku,
          attributes: v.attributes,
          regular_price: v.regular_price,
          sale_price: v.sale_price,
          stock_quantity: v.stock_quantity,
          image_url: v.image_url,
          stock_status: v.stock_status || "instock",
          is_active: true,
        }));

        await supabase
          .from("product_variations")
          .insert(variationsToInsert);
      }

      // 4. Mettre à jour le SEO
      await supabase
        .from("seo_metadata")
        .delete()
        .eq("product_id", product.id);

      if (seoData.seo_title || seoData.meta_description) {
        await supabase
          .from("seo_metadata")
          .insert({
            entity_type: "product",
            entity_identifier: product.slug,
            product_id: product.id,
            seo_title: seoData.seo_title,
            meta_description: seoData.meta_description,
            og_title: seoData.og_title,
            og_description: seoData.og_description,
            og_image: seoData.og_image,
            is_active: true,
          });
      }

      toast.success("Produit mis à jour");
      router.refresh();
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast.error(error.message || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  // Organiser les catégories par niveau
  const getCategoriesByLevel = () => {
    const level1 = allCategories.filter(c => !c.parent_id);
    const level2 = allCategories.filter(c => c.parent_id && level1.some(p => p.id === c.parent_id));
    const level3 = allCategories.filter(c => c.parent_id && level2.some(p => p.id === c.parent_id));
    return { level1, level2, level3 };
  };

  const { level1, level2, level3 } = getCategoriesByLevel();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/admin/products" className="inline-flex items-center text-gray-600 hover:text-[#d4af37]">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux produits
        </Link>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d] text-white"
        >
          <Save className="h-4 w-4 mr-2" />
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

        {/* Image principale */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-[#d4af37]">Image principale</CardTitle>
          </CardHeader>
          <CardContent>
            <MediaSelector
              currentImageUrl={product.image_url || ""}
              onSelect={(url) => setProduct({ ...product, image_url: url })}
            />
          </CardContent>
        </Card>

        {/* Catégories */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-[#d4af37]">Catégories</CardTitle>
            <CardDescription>Sélectionnez les catégories du produit (tous niveaux)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Niveau 1 */}
            {level1.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-gray-900">Catégories principales</h4>
                <div className="space-y-2">
                  {level1.map((category) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cat-${category.id}`}
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={() => handleCategoryToggle(category.id)}
                      />
                      <Label htmlFor={`cat-${category.id}`} className="cursor-pointer text-gray-900">
                        {category.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Niveau 2 */}
            {level2.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-gray-900">Sous-catégories</h4>
                <div className="space-y-2 pl-4">
                  {level2.map((category) => {
                    const parent = level1.find(p => p.id === category.parent_id);
                    return (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`cat-${category.id}`}
                          checked={selectedCategories.includes(category.id)}
                          onCheckedChange={() => handleCategoryToggle(category.id)}
                        />
                        <Label htmlFor={`cat-${category.id}`} className="cursor-pointer text-gray-900">
                          {parent?.name} → {category.name}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Niveau 3 */}
            {level3.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-gray-900">Sous-sous-catégories</h4>
                <div className="space-y-2 pl-8">
                  {level3.map((category) => {
                    const parent = level2.find(p => p.id === category.parent_id);
                    const grandparent = parent ? level1.find(gp => gp.id === parent.parent_id) : null;
                    return (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`cat-${category.id}`}
                          checked={selectedCategories.includes(category.id)}
                          onCheckedChange={() => handleCategoryToggle(category.id)}
                        />
                        <Label htmlFor={`cat-${category.id}`} className="cursor-pointer text-gray-900">
                          {grandparent?.name} → {parent?.name} → {category.name}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attributs et Variations */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-[#d4af37]">Attributs et Variations</CardTitle>
            <CardDescription>
              Sélectionnez les attributs du produit. Les variations seront créées automatiquement.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Couleurs */}
            {attributes.find(attr => attr.slug === "couleurs-principales") && (
              <div>
                <Label className="text-lg font-semibold text-gray-900">Couleurs principales</Label>
                <div className="flex flex-wrap gap-3 mt-3">
                  {attributes
                    .find(attr => attr.slug === "couleurs-principales")
                    ?.terms?.map((term) => (
                      <button
                        key={term.id}
                        type="button"
                        onClick={() => handleAttributeTermToggle(term.attribute_id, term.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
                          selectedAttributeTerms[term.attribute_id]?.includes(term.id)
                            ? "border-[#d4af37] bg-[#d4af37]/10"
                            : "border-gray-300 hover:border-[#d4af37]"
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-full border-2 border-gray-300"
                          style={{ backgroundColor: term.color_code || "#gray" }}
                        />
                        <span className="text-sm font-medium text-gray-900">{term.name}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Tailles */}
            {attributes.find(attr => attr.slug === "tailles") && (
              <div>
                <Label className="text-lg font-semibold text-gray-900">Tailles</Label>
                <div className="flex flex-wrap gap-3 mt-3">
                  {attributes
                    .find(attr => attr.slug === "tailles")
                    ?.terms?.map((term) => (
                      <button
                        key={term.id}
                        type="button"
                        onClick={() => handleAttributeTermToggle(term.attribute_id, term.id)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          selectedAttributeTerms[term.attribute_id]?.includes(term.id)
                            ? "border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37] font-semibold"
                            : "border-gray-300 text-gray-700 hover:border-[#d4af37]"
                        }`}
                      >
                        {term.name}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Variations */}
            {variations.length > 0 && (
              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold text-gray-900">Variations ({variations.length})</Label>
                  <Button
                    type="button"
                    onClick={addVariation}
                    variant="outline"
                    size="sm"
                    className="border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>

                {variations.map((variation, index) => (
                  <Card key={index} className="bg-gray-50 border border-gray-200">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900">Variation {index + 1}</h4>
                        <Button
                          type="button"
                          onClick={() => removeVariation(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Image de la variation</Label>
                          <MediaSelector
                            currentImageUrl={variation.image_url || ""}
                            onSelect={(url) => updateVariation(index, "image_url", url)}
                          />
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label>Référence (UGS)</Label>
                            <Input
                              value={variation.sku}
                              onChange={(e) => updateVariation(index, "sku", e.target.value)}
                              placeholder="SKU-001"
                              className="bg-white"
                            />
                          </div>

                          <div>
                            <Label>Prix régulier (€)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={variation.regular_price || ""}
                              onChange={(e) => updateVariation(index, "regular_price", parseFloat(e.target.value) || null)}
                              className="bg-white"
                            />
                          </div>

                          <div>
                            <Label>Prix promo (€)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={variation.sale_price || ""}
                              onChange={(e) => updateVariation(index, "sale_price", parseFloat(e.target.value) || null)}
                              className="bg-white"
                            />
                          </div>

                          <div>
                            <Label>Stock</Label>
                            <Input
                              type="number"
                              value={variation.stock_quantity || 0}
                              onChange={(e) => updateVariation(index, "stock_quantity", parseInt(e.target.value) || 0)}
                              className="bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {variations.length === 0 && (
              <Button
                type="button"
                onClick={addVariation}
                variant="outline"
                className="w-full border-dashed border-2 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer une première variation
              </Button>
            )}
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
              <MediaSelector
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
