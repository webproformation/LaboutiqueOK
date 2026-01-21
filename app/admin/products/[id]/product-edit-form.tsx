"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import RichTextEditor from "@/components/RichTextEditor";
import ColorSwatchSelector from "@/components/ColorSwatchSelector";
import ProductMediaGalleryManager from "@/components/ProductMediaGalleryManager";
import HierarchicalCategorySelector from "@/components/HierarchicalCategorySelector";
import GeneralAttributesSelector from "@/components/GeneralAttributesSelector";
import VariationDetailsForm from "@/components/VariationDetailsForm";

// --- IMPORT DU HOOK DE SAUVEGARDE ---
import { useAutoSave } from "@/hooks/useAutoSave"; 

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
  gallery_images?: string[] | any;
  is_diamond?: boolean;
  is_featured?: boolean;
  is_variable_product?: boolean;
  has_variations?: boolean;
  main_color?: string | null;
  size_range_start?: number | null;
  size_range_end?: number | null;
  attributes?: any;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  display_order: number | null;
}

interface Variation {
  id?: string;
  colorName: string;
  colorId: string;
  sku: string;
  regular_price: number | null;
  sale_price: number | null;
  stock_quantity: number | null;
  image_url: string | null;
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

  // --- ÉTATS DU FORMULAIRE ---
  const [name, setName] = useState(initialProduct.name);
  const [slug, setSlug] = useState(initialProduct.slug);
  const [sku, setSku] = useState(initialProduct.sku || "");
  const [description, setDescription] = useState(initialProduct.description || "");
  const [regularPrice, setRegularPrice] = useState<number>(initialProduct.regular_price);
  const [salePrice, setSalePrice] = useState<number | null>(initialProduct.sale_price);
  const [stockQuantity, setStockQuantity] = useState<number>(initialProduct.stock_quantity);
  const [status, setStatus] = useState(initialProduct.status);
  const [isFeatured, setIsFeatured] = useState(initialProduct.is_featured || false);
  const [isDiamond, setIsDiamond] = useState(initialProduct.is_diamond || false);

  const [mainImage, setMainImage] = useState<string>(initialProduct.image_url || "");
  const [galleryImages, setGalleryImages] = useState<string[]>(
    Array.isArray(initialProduct.gallery_images)
      ? initialProduct.gallery_images
      : []
  );

  const [mainColor, setMainColor] = useState<string>(initialProduct.main_color || "");
  const [mainColorId, setMainColorId] = useState<string>("");
  const [selectedSecondaryColors, setSelectedSecondaryColors] = useState<string[]>([]);
  const [secondaryColorIds, setSecondaryColorIds] = useState<Record<string, string>>({});

  const [sizeRangeStart, setSizeRangeStart] = useState<number | null>(initialProduct.size_range_start || null);
  const [sizeRangeEnd, setSizeRangeEnd] = useState<number | null>(initialProduct.size_range_end || null);

  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string[]>>(() => {
    if (typeof initialProduct.attributes === 'object' && initialProduct.attributes !== null) {
      const filtered = Object.entries(initialProduct.attributes)
        .filter(([key]) => key !== 'Couleur')
        .reduce((acc, [key, value]) => {
          if (Array.isArray(value)) {
            acc[key] = value as string[];
          }
          return acc;
        }, {} as Record<string, string[]>);
      return filtered;
    }
    return {};
  });
  
  const [variations, setVariations] = useState<Variation[]>([]);
  const [existingVariationsIds, setExistingVariationsIds] = useState<Record<string, string>>({});

  // --- INTÉGRATION AUTO-SAVE ---
  
  // 1. On regroupe tout l'état actuel dans un objet pour le Hook
  const currentFormData = {
    name, slug, sku, description,
    regularPrice, salePrice, stockQuantity, status,
    isFeatured, isDiamond,
    mainImage, galleryImages,
    mainColor, mainColorId, selectedSecondaryColors, secondaryColorIds,
    sizeRangeStart, sizeRangeEnd,
    selectedCategories, selectedAttributes,
    variations, existingVariationsIds
  };

  // 2. On appelle le Hook
  const { clearSavedData } = useAutoSave(
    `draft_product_${initialProduct.id}`, // Clé unique par produit
    currentFormData, // Les données à sauver
    (savedData: any) => { // La fonction de restauration
        // On remet chaque valeur à sa place
        if (savedData.name !== undefined) setName(savedData.name);
        if (savedData.slug !== undefined) setSlug(savedData.slug);
        if (savedData.sku !== undefined) setSku(savedData.sku);
        if (savedData.description !== undefined) setDescription(savedData.description);
        if (savedData.regularPrice !== undefined) setRegularPrice(savedData.regularPrice);
        if (savedData.salePrice !== undefined) setSalePrice(savedData.salePrice);
        if (savedData.stockQuantity !== undefined) setStockQuantity(savedData.stockQuantity);
        if (savedData.status !== undefined) setStatus(savedData.status);
        if (savedData.isFeatured !== undefined) setIsFeatured(savedData.isFeatured);
        if (savedData.isDiamond !== undefined) setIsDiamond(savedData.isDiamond);
        
        if (savedData.mainImage !== undefined) setMainImage(savedData.mainImage);
        if (savedData.galleryImages !== undefined) setGalleryImages(savedData.galleryImages);
        
        if (savedData.mainColor !== undefined) setMainColor(savedData.mainColor);
        if (savedData.mainColorId !== undefined) setMainColorId(savedData.mainColorId);
        if (savedData.selectedSecondaryColors !== undefined) setSelectedSecondaryColors(savedData.selectedSecondaryColors);
        if (savedData.secondaryColorIds !== undefined) setSecondaryColorIds(savedData.secondaryColorIds);
        
        if (savedData.sizeRangeStart !== undefined) setSizeRangeStart(savedData.sizeRangeStart);
        if (savedData.sizeRangeEnd !== undefined) setSizeRangeEnd(savedData.sizeRangeEnd);
        
        if (savedData.selectedCategories !== undefined) setSelectedCategories(savedData.selectedCategories);
        if (savedData.selectedAttributes !== undefined) setSelectedAttributes(savedData.selectedAttributes);
        
        if (savedData.variations !== undefined) setVariations(savedData.variations);
        if (savedData.existingVariationsIds !== undefined) setExistingVariationsIds(savedData.existingVariationsIds);
    }
  );

  // --- FIN INTÉGRATION AUTO-SAVE ---


  useEffect(() => {
    // Note: Si une variation a été chargée par le AutoSave, on évite d'écraser avec le loadExistingVariations
    // On ne charge depuis la DB que si variations est vide (chargement initial propre)
    if (variations.length === 0) {
        loadExistingVariations();
    }
  }, []);

  // --- LOGIQUE AUTO-SÉLECTION DES TAILLES ---
  useEffect(() => {
    if (sizeRangeStart && sizeRangeEnd) {
      const start = Math.min(sizeRangeStart, sizeRangeEnd);
      const end = Math.max(sizeRangeStart, sizeRangeEnd);
      
      const autoSizes: string[] = [];
      for (let s = start; s <= end; s += 2) {
        autoSizes.push(s.toString());
      }

      setSelectedAttributes(prev => ({
        ...prev,
        "Tailles": autoSizes
      }));
    }
  }, [sizeRangeStart, sizeRangeEnd]);

  useEffect(() => {
    // Si nous avons restauré des variations via AutoSave, on ne veut pas que cet effet les écrase 
    // sauf si l'utilisateur change activement les couleurs secondaires.
    // Cette logique reste inchangée mais attention aux conflits potentiels.
    // Dans le doute, l'utilisateur verra ce qui est à l'écran.
    
    if (selectedSecondaryColors.length > 0) {
        // On vérifie si les variations actuelles correspondent déjà aux couleurs (cas d'une restauration)
        const currentColors = variations.map(v => v.colorName).sort().join(',');
        const newColors = [...selectedSecondaryColors].sort().join(',');
        
        if (currentColors !== newColors) {
             const newVariations: Variation[] = selectedSecondaryColors.map(colorName => {
                const existingVar = variations.find(v => v.colorName === colorName);
                return existingVar || {
                  id: existingVariationsIds[colorName],
                  colorName,
                  colorId: secondaryColorIds[colorName] || "",
                  sku: "",
                  regular_price: regularPrice || null,
                  sale_price: salePrice,
                  stock_quantity: stockQuantity || null,
                  image_url: null,
                };
              });
              setVariations(newVariations);
        }
    } else {
      // Si on vide la sélection, on vide les variations (sauf si c'est un chargement initial ?)
      // On garde la logique d'origine pour ne pas casser le comportement
      if (variations.length > 0 && selectedSecondaryColors.length === 0) {
          setVariations([]);
      }
    }
  }, [selectedSecondaryColors]);

  const loadExistingVariations = async () => {
    try {
      const { data, error } = await supabase
        .from("product_variations")
        .select("*")
        .eq("product_id", initialProduct.id)
        .eq("is_active", true);

      if (error) throw error;

      if (data && data.length > 0) {
        const colorNames: string[] = [];
        const varIds: Record<string, string> = {};
        const vars: Variation[] = [];

        for (const v of data) {
          const colorName = v.attributes?.Couleur || "";
          if (colorName) {
            colorNames.push(colorName);
            varIds[colorName] = v.id;
            vars.push({
              id: v.id,
              colorName,
              colorId: "",
              sku: v.sku || "",
              regular_price: v.regular_price,
              sale_price: v.sale_price,
              stock_quantity: v.stock_quantity,
              image_url: v.image_url,
            });
          }
        }

        // On ne met à jour que si l'état local est vide (pour éviter d'écraser le brouillon restauré)
        if (variations.length === 0) {
            setSelectedSecondaryColors(colorNames);
            setExistingVariationsIds(varIds);
            setVariations(vars);
        }
      }
    } catch (error) {
      console.error("Error loading variations:", error);
    }
  };

  const handleMainColorSelect = (colorName: string, colorId: string) => {
    setMainColor(colorName);
    setMainColorId(colorId);
  };

  const handleSecondaryColorToggle = (colorName: string, colorId: string, selected: boolean) => {
    if (selected) {
      setSelectedSecondaryColors(prev => [...prev, colorName]);
      setSecondaryColorIds(prev => ({ ...prev, [colorName]: colorId }));
    } else {
      setSelectedSecondaryColors(prev => prev.filter(c => c !== colorName));
      setSecondaryColorIds(prev => {
        const newIds = { ...prev };
        delete newIds[colorName];
        return newIds;
      });
    }
  };

  const handleVariationUpdate = (colorName: string, field: keyof Variation, value: any) => {
    setVariations(prev => {
      const existingIndex = prev.findIndex(v => v.colorName === colorName);

      if (existingIndex >= 0) {
        const newVars = [...prev];
        newVars[existingIndex] = { ...newVars[existingIndex], [field]: value };
        return newVars;
      } else {
        const newVar: Variation = {
          id: existingVariationsIds[colorName],
          colorName,
          colorId: secondaryColorIds[colorName] || "",
          sku: field === 'sku' ? value : "",
          regular_price: field === 'regular_price' ? value : regularPrice || null,
          sale_price: field === 'sale_price' ? value : salePrice,
          stock_quantity: field === 'stock_quantity' ? value : stockQuantity || null,
          image_url: field === 'image_url' ? value : null,
        };
        return [...prev, newVar];
      }
    });
  };

  const handleSave = async () => {
    if (!name || !slug) {
      toast.error("Le nom et le slug sont requis");
      return;
    }

    if (!mainColor) {
      toast.error("Veuillez sélectionner une couleur principale");
      return;
    }

    setSaving(true);

    try {
      const allAttributes: Record<string, string[]> = { ...selectedAttributes };
      if (mainColor) {
        allAttributes['Couleur'] = [mainColor, ...selectedSecondaryColors];
      }

      const productData = {
        name: name.trim(),
        slug: slug.trim(),
        sku: sku.trim() || null,
        description: description || "",
        regular_price: parseFloat(String(regularPrice)) || 0,
        sale_price: salePrice ? parseFloat(String(salePrice)) : null,
        stock_quantity: parseInt(String(stockQuantity)) || 0,
        status: status || "draft",
        image_url: mainImage || null,
        gallery_images: galleryImages.length > 0 ? galleryImages : null,
        is_diamond: isDiamond,
        is_featured: isFeatured,
        is_variable_product: variations.length > 0,
        has_variations: variations.length > 0,
        main_color: mainColor,
        size_range_start: sizeRangeStart,
        size_range_end: sizeRangeEnd,
        attributes: Object.keys(allAttributes).length > 0 ? allAttributes : null,
      };

      const { error: productError } = await supabase
        .from("products")
        .update(productData)
        .eq("id", initialProduct.id);

      if (productError) throw productError;

      await supabase
        .from("product_category_mapping")
        .delete()
        .eq("product_id", initialProduct.id);

      if (selectedCategories.length > 0) {
        const categoryMappings = selectedCategories.map((catId, index) => ({
          product_id: initialProduct.id,
          category_id: catId,
          is_primary: index === 0,
          display_order: index,
        }));

        const { error: catError } = await supabase
          .from("product_category_mapping")
          .insert(categoryMappings);

        if (catError) throw catError;
      }

      await supabase
        .from("product_variations")
        .delete()
        .eq("product_id", initialProduct.id);

      if (variations.length > 0) {
        const variationsToInsert = variations.map(v => ({
          product_id: initialProduct.id,
          sku: v.sku || "",
          attributes: { "Couleur": v.colorName },
          regular_price: v.regular_price ? parseFloat(String(v.regular_price)) : null,
          sale_price: v.sale_price ? parseFloat(String(v.sale_price)) : null,
          stock_quantity: v.stock_quantity ? parseInt(String(v.stock_quantity)) : null,
          image_url: v.image_url || null,
          stock_status: (v.stock_quantity || 0) > 0 ? "instock" : "outofstock",
          is_active: true,
        }));

        const { error: varError } = await supabase
          .from("product_variations")
          .insert(variationsToInsert);

        if (varError) throw varError;
      }

      // --- SUCCÈS : NETTOYAGE DU BROUILLON ---
      clearSavedData();
      // ---------------------------------------

      toast.success("Produit mis à jour avec succès!");
      router.push("/admin/products");
      router.refresh();
    } catch (error: any) {
      console.error("Error updating product:", error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Modifier le Produit</h1>
            <div className="flex items-center gap-2 text-gray-600 mt-1">
                <span>{initialProduct.name}</span>
                {/* Petit indicateur visuel de sécurité (optionnel) */}
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Auto-save actif
                </span>
            </div>
          </div>
          <Link href="/admin/products">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
        </div>

        <div className="space-y-6">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-[#d4af37]">Informations Générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom du Produit *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white"
                  />
                </div>

                <div>
                  <Label htmlFor="slug">Slug (URL) *</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="bg-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="sku">SKU (Référence)</Label>
                  <Input
                    id="sku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="bg-white"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select value={status} onValueChange={setStatus}>
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

                <div className="flex items-end gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_featured"
                      checked={isFeatured}
                      onCheckedChange={(checked) => setIsFeatured(!!checked)}
                    />
                    <Label htmlFor="is_featured" className="cursor-pointer">Vedette</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_diamond"
                      checked={isDiamond}
                      onCheckedChange={(checked) => setIsDiamond(!!checked)}
                    />
                    <Label htmlFor="is_diamond" className="cursor-pointer">Diamant</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <ProductMediaGalleryManager
            mainImage={mainImage}
            galleryImages={galleryImages}
            onMainImageChange={setMainImage}
            onGalleryImagesChange={setGalleryImages}
          />

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-[#d4af37]">Prix & Stock (Par défaut)</CardTitle>
              <CardDescription>
                Ces valeurs seront utilisées si aucune variation n'est définie
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="regularPrice">Prix Régulier (€) *</Label>
                  <Input
                    id="regularPrice"
                    type="number"
                    step="0.01"
                    value={regularPrice}
                    onChange={(e) => setRegularPrice(parseFloat(e.target.value) || 0)}
                    className="bg-white"
                  />
                </div>

                <div>
                  <Label htmlFor="salePrice">Prix Promo (€)</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    step="0.01"
                    value={salePrice || ""}
                    onChange={(e) => setSalePrice(e.target.value ? parseFloat(e.target.value) : null)}
                    className="bg-white"
                  />
                </div>

                <div>
                  <Label htmlFor="stockQuantity">Stock</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                    className="bg-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <ColorSwatchSelector
            selectedMainColor={mainColor}
            selectedSecondaryColors={selectedSecondaryColors}
            onMainColorSelect={handleMainColorSelect}
            onSecondaryColorToggle={handleSecondaryColorToggle}
            showSecondaryColors={true}
          />

          <VariationDetailsForm
            selectedSecondaryColors={selectedSecondaryColors}
            secondaryColorIds={secondaryColorIds}
            variations={variations}
            onVariationUpdate={handleVariationUpdate}
            defaultRegularPrice={regularPrice}
            defaultSalePrice={salePrice}
            defaultStock={stockQuantity}
          />

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-[#d4af37]">Filtres de Taille</CardTitle>
              <CardDescription>
                Définissez les tailles min/max pour le filtre "À ma taille"
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Taille Minimum</Label>
                  <Select
                    value={sizeRangeStart?.toString() || "none"}
                    onValueChange={(value) => setSizeRangeStart(value === "none" ? null : parseInt(value))}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Choisir" />
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
                  <Label>Taille Maximum</Label>
                  <Select
                    value={sizeRangeEnd?.toString() || "none"}
                    onValueChange={(value) => setSizeRangeEnd(value === "none" ? null : parseInt(value))}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Choisir" />
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
            </CardContent>
          </Card>

          <GeneralAttributesSelector
            selectedAttributes={selectedAttributes}
            onAttributesChange={setSelectedAttributes}
          />

          <HierarchicalCategorySelector
            selectedCategories={selectedCategories}
            onCategoriesChange={setSelectedCategories}
          />

          <div className="flex justify-end gap-4 pb-6">
            <Link href="/admin/products">
              <Button variant="outline">Annuler</Button>
            </Link>
            <Button onClick={handleSave} disabled={saving} className="bg-[#d4af37] hover:bg-[#c19b2f]">
              {saving ? (
                <>Enregistrement...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Mettre à jour
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}