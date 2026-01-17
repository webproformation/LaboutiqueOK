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
import { Save, ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import { ProductMediaSelector } from "@/components/product-media-selector";
import RichTextEditor from "@/components/RichTextEditor";
import ProductVariationsManager from "@/components/ProductVariationsManager";
import ProductAttributesSelector from "@/components/ProductAttributesSelector";

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

interface SeoData {
  seo_title: string;
  meta_description: string;
  og_title: string;
  og_description: string;
  og_image: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // États du formulaire
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [regularPrice, setRegularPrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number | null>(null);
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [status, setStatus] = useState("draft");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isDiamond, setIsDiamond] = useState(false);

  // Nouveaux champs pour le système de filtres
  const [mainColor, setMainColor] = useState<string>("");
  const [sizeRangeStart, setSizeRangeStart] = useState<number | null>(null);
  const [sizeRangeEnd, setSizeRangeEnd] = useState<number | null>(null);
  const [secondaryColor, setSecondaryColor] = useState<string>("");
  const [availableColors, setAvailableColors] = useState<Array<{id: string, name: string, color_code?: string}>>([]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [variations, setVariations] = useState<any[]>([]);
  const [selectedAttributeTerms, setSelectedAttributeTerms] = useState<Record<string, string[]>>({});
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [seoData, setSeoData] = useState<SeoData>({
    seo_title: "",
    meta_description: "",
    og_title: "",
    og_description: "",
    og_image: "",
  });

  useEffect(() => {
    loadCategories();
    loadAttributes();
    loadColors();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_order");

      if (error) throw error;
      if (data) setAllCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Erreur lors du chargement des catégories");
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
      toast.error("Erreur lors du chargement des attributs");
    }
  };

  const loadColors = async () => {
    try {
      // Charger l'attribut "Couleur" et ses termes
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
          // Filtrer les valeurs vides
          const validColors = colorTerms.filter(c => c.name && c.name.trim());
          setAvailableColors(validColors);
        }
      }
    } catch (error) {
      console.error("Error loading colors:", error);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug) {
      setSlug(generateSlug(value));
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
    if (!name || !slug) {
      toast.error("Le nom et le slug sont requis", {
        position: "bottom-right",
      });
      return;
    }

    setSaving(true);

    try {
      // 1. Créer le produit
      const productData = {
        name: name.trim(),
        slug: slug.trim(),
        description: description || "",
        regular_price: parseFloat(String(regularPrice)) || 0,
        sale_price: salePrice ? parseFloat(String(salePrice)) : null,
        stock_quantity: parseInt(String(stockQuantity)) || 0,
        status: status || "draft",
        image_url: imageUrl || null,
        gallery_images: galleryImages.length > 0 ? galleryImages : null,
        is_diamond: isDiamond,
        is_featured: isFeatured,
        is_variable_product: variations.length > 0,
        has_variations: variations.length > 0,
        main_color: mainColor || null,
        size_range_start: sizeRangeStart,
        size_range_end: sizeRangeEnd,
      };

      const { data: newProduct, error: productError } = await supabase
        .from("products")
        .insert(productData)
        .select()
        .single();

      if (productError) throw productError;

      if (!newProduct) throw new Error("Produit non créé");

      const productId = newProduct.id;

      // 2. Ajouter les catégories
      if (selectedCategories.length > 0) {
        const categoryMappings = selectedCategories.map((catId, index) => ({
          product_id: productId,
          category_id: catId,
          is_primary: index === 0,
          display_order: index,
        }));

        const { error: catError } = await supabase
          .from("product_category_mapping")
          .insert(categoryMappings);

        if (catError) throw catError;
      }

      // 3. Ajouter les variations
      if (variations.length > 0) {
        const variationsToInsert = variations.map(v => ({
          product_id: productId,
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

        const { error: varError } = await supabase
          .from("product_variations")
          .insert(variationsToInsert);

        if (varError) throw varError;
      }

      // 4. Ajouter le SEO
      if (seoData.seo_title || seoData.meta_description) {
        const seoInsertData = {
          entity_type: "product",
          entity_identifier: slug.trim(),
          product_id: productId,
          seo_title: seoData.seo_title.trim(),
          meta_description: seoData.meta_description.trim(),
          og_title: seoData.og_title.trim(),
          og_description: seoData.og_description.trim(),
          og_image: seoData.og_image.trim() || null,
          is_active: true,
        };

        const { error: seoError } = await supabase
          .from("seo_metadata")
          .insert(seoInsertData);

        if (seoError) throw seoError;
      }

      toast.success("Produit créé avec succès", {
        duration: 4000,
        position: "bottom-right",
      });

      router.refresh();
      setTimeout(() => {
        router.push("/admin/products");
      }, 500);
    } catch (error: any) {
      console.error("Error creating product:", error);

      let errorMessage = "Erreur lors de la création";

      if (error?.message) {
        errorMessage = error.message;
      }

      if (error?.details) {
        errorMessage += ` - Détails: ${error.details}`;
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
    <div className="space-y-6 max-w-7xl mx-auto p-6">
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
          {saving ? "Création..." : "Créer le produit"}
        </Button>
      </div>

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
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="bg-white"
                placeholder="Ex: T-shirt en coton bio"
              />
            </div>

            <div>
              <Label htmlFor="slug">Slug (URL) *</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="bg-white"
                placeholder="t-shirt-en-coton-bio"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <RichTextEditor
                value={description}
                onChange={(value) => setDescription(value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="regular_price">Prix régulier (€) *</Label>
                <Input
                  id="regular_price"
                  type="number"
                  step="0.01"
                  value={regularPrice}
                  onChange={(e) => setRegularPrice(parseFloat(e.target.value) || 0)}
                  className="bg-white"
                />
              </div>

              <div>
                <Label htmlFor="sale_price">Prix promo (€)</Label>
                <Input
                  id="sale_price"
                  type="number"
                  step="0.01"
                  value={salePrice || ""}
                  onChange={(e) => setSalePrice(e.target.value ? parseFloat(e.target.value) : null)}
                  className="bg-white"
                />
              </div>

              <div>
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                  className="bg-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Statut</Label>
              <Select value={status} onValueChange={(value) => setStatus(value)}>
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
                  checked={isFeatured}
                  onCheckedChange={(checked) => setIsFeatured(!!checked)}
                />
                <Label htmlFor="is_featured" className="cursor-pointer">Produit vedette</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_diamond"
                  checked={isDiamond}
                  onCheckedChange={(checked) => setIsDiamond(!!checked)}
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
                value={mainColor}
                onChange={(e) => setMainColor(e.target.value)}
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
                  // Si une couleur secondaire est sélectionnée, activer les variations
                  if (value && value !== "none") {
                    // Créer une variation par défaut si aucune n'existe
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
                  value={sizeRangeStart?.toString() || "none"}
                  onValueChange={(value) => setSizeRangeStart(value === "none" ? null : parseInt(value))}
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
                  value={sizeRangeEnd?.toString() || "none"}
                  onValueChange={(value) => setSizeRangeEnd(value === "none" ? null : parseInt(value))}
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

            {sizeRangeStart && sizeRangeEnd && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  <strong>Intervalle de tailles:</strong> {sizeRangeStart} à {sizeRangeEnd}
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
              currentImageUrl={imageUrl || ""}
              onSelect={(url) => setImageUrl(url)}
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

        {/* Attributs de Produit (Couleurs, Tailles, etc.) */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-[#d4af37]">Attributs de Produit</CardTitle>
            <CardDescription>
              Sélectionnez les attributs disponibles pour ce produit (couleurs, tailles, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductAttributesSelector
              selectedTerms={selectedAttributeTerms}
              onChange={setSelectedAttributeTerms}
            />
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
                placeholder={name || "Titre optimisé pour le SEO"}
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
                placeholder={seoData.seo_title || name}
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
          {saving ? "Création..." : "Créer le produit"}
        </Button>
      </div>
    </div>
  );
}
