"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, Product } from "@/lib/supabase";
import {
  ChevronRight,
  Home,
  ShoppingCart,
  Bell,
  Plus,
  Minus,
  Edit,
  Trash2,
  Shield,
} from "lucide-react";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductVariationSelector } from "@/components/ProductVariationSelector";
import { HiddenDiamond } from "@/components/HiddenDiamond";
import { ShareButtons } from "@/components/ShareButtons";
import { WishlistButton } from "@/components/wishlist-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { decodeHtmlEntities } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { CUSTOM_TEXTS } from "@/lib/texts";

const diamondPositions: Array<"title" | "image" | "description"> = ["title", "image", "description"];

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  
  // --- ÉTAT POUR LA TAILLE SÉLECTIONNÉE ---
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  
  const [notifyEmail, setNotifyEmail] = useState("");
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);
  const [userSelectedGalleryImage, setUserSelectedGalleryImage] = useState<string | null>(null);
  const [initialAttributes, setInitialAttributes] = useState<Record<string, string>>({});
  const [informativeAttributes, setInformativeAttributes] = useState<Array<{ name: string; values: string[] }>>([]);
  const [diamondPosition] = useState<"title" | "image" | "description">(() =>
    diamondPositions[Math.floor(Math.random() * diamondPositions.length)]
  );

  useEffect(() => {
    loadProduct();
    checkAdminStatus();
  }, [slug, user]);

  useEffect(() => {
    if (product) {
      loadInformativeAttributes(product);
    }
  }, [product]);

  // --- INITIALISATION TAILLE PAR DÉFAUT ---
  useEffect(() => {
    if (product?.size_range_start) {
      setSelectedSize(product.size_range_start.toString());
    }
  }, [product]);

  // --- CALCUL DES TAILLES DISPONIBLES ---
  const availableSizes = useMemo(() => {
    if (!product?.size_range_start || !product?.size_range_end) return [];
    const sizes = [];
    for (let i = product.size_range_start; i <= product.size_range_end; i += 2) {
      sizes.push(i.toString());
    }
    return sizes;
  }, [product]);

  useEffect(() => {
    if (product && product.type === "VARIABLE" && product.attributes && product.variations && !selectedVariation) {
      const firstSelections: Record<string, string> = {};

      product.attributes.forEach((attr: any) => {
        if (attr.options && attr.options.length > 0) {
          firstSelections[attr.name] = attr.options[0];
        }
      });

      const matchingVariation = product.variations.find((variation: any) =>
        variation.attributes?.every((attr: any) =>
          firstSelections[attr.name]?.toLowerCase() === attr.option?.toLowerCase()
        )
      );

      if (matchingVariation) {
        const variationAttributes: Record<string, string> = {};
        matchingVariation.attributes?.forEach((attr: any) => {
          variationAttributes[attr.name] = attr.option;
        });

        setInitialAttributes(variationAttributes);
        setSelectedVariation(matchingVariation);
      }
    }
  }, [product]);

  async function loadInformativeAttributes(productData: Product) {
    try {
      const rawAttributes = productData.attributes;
      if (!rawAttributes || typeof rawAttributes !== 'object') return;

      const termNames: string[] = [];
      Object.values(rawAttributes).forEach((names) => {
        if (Array.isArray(names)) {
          names.forEach(name => termNames.push(String(name)));
        }
      });

      if (termNames.length === 0) return;

      const { data, error } = await supabase
        .from('product_attribute_terms')
        .select(`
          name, 
          product_attributes (name, slug)
        `)
        .in('name', termNames);

      if (error) return;
      if (!data) return;

      const groups = new Map<string, string[]>();

      data.forEach((item: any) => {
        const attrInfo = Array.isArray(item.product_attributes) ? item.product_attributes[0] : item.product_attributes;
        const attrName = attrInfo?.name;
        const attrSlug = attrInfo?.slug?.toLowerCase() || '';
        const termValue = item.name;

        if (attrName && termValue) {
          if (
            attrSlug.includes('couleur') || 
            attrSlug.includes('taille') || 
            attrSlug === 'color' || 
            attrSlug === 'size' ||
            attrName.toLowerCase() === 'couleur' ||
            attrName.toLowerCase() === 'taille'
          ) {
            return;
          }
          
          if (!groups.has(attrName)) groups.set(attrName, []);
          if (!groups.get(attrName)?.includes(termValue)) {
            groups.get(attrName)?.push(termValue);
          }
        }
      });

      const result = Array.from(groups.entries()).map(([name, values]) => ({ name, values }));
      setInformativeAttributes(result);
      
    } catch (err) {
      console.error("Exception loadInformativeAttributes:", err);
    }
  }

  async function checkAdminStatus() {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data) setIsAdmin(data.is_admin || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  }

  async function loadProduct() {
    try {
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (productError) throw productError;
      if (!productData) {
        router.push("/");
        return;
      }

      if (productData.is_variable_product) {
        const { data: variations } = await supabase
          .from("product_variations")
          .select("*")
          .eq("product_id", productData.id);

        if (variations) {
          const attributesMap = new Map<string, Set<string>>();
          const extractValue = (value: any): string => {
            if (typeof value === 'object' && value !== null) return value.name || value.value || String(value);
            return String(value);
          };
          const normalizeAttributeName = (key: string): string => {
            const lowerKey = key.toLowerCase();
            if (lowerKey.includes('couleur') || lowerKey === 'couleur_name') return 'Couleur';
            if (lowerKey.includes('taille') || lowerKey.includes('size')) return 'Taille';
            return key.charAt(0).toUpperCase() + key.slice(1);
          };

          variations.forEach((variation) => {
            if (variation.attributes && typeof variation.attributes === 'object') {
              Object.entries(variation.attributes).forEach(([key, value]) => {
                const lowerKey = key.toLowerCase();
                if (lowerKey.includes('color_code') || lowerKey.includes('id')) return;
                const displayName = normalizeAttributeName(key);
                const displayValue = extractValue(value);
                if (displayValue && displayValue.trim()) {
                  if (!attributesMap.has(displayName)) attributesMap.set(displayName, new Set());
                  attributesMap.get(displayName)?.add(displayValue);
                }
              });
            }
          });

          const originalAttributesJSON = JSON.parse(JSON.stringify(productData.attributes || {}));

          const attributesForSelector = Array.from(attributesMap.entries()).map(([name, options]) => ({
            name,
            options: Array.from(options),
          }));

          const allOptionNames = attributesForSelector.flatMap(a => a.options);
          
          if (allOptionNames.length > 0) {
             const { data: termsData } = await supabase
               .from('product_attribute_terms')
               .select('name, color_code')
               .in('name', allOptionNames);
               
             if (termsData) {
               const colorMap = new Map(termsData.map(t => [t.name, t.color_code]));
               attributesForSelector.forEach((attr: any) => {
                 if (attr.name.toLowerCase().includes('couleur') || attr.name.toLowerCase().includes('color')) {
                   attr.colorCodes = attr.options.map((opt: string) => colorMap.get(opt) || undefined);
                 }
               });
             }
          }

          const formattedVariations = variations.map((v) => {
            const variationAttributes: Array<{name: string; option: string}> = [];
            if (v.attributes && typeof v.attributes === 'object') {
              Object.entries(v.attributes).forEach(([key, value]) => {
                const lowerKey = key.toLowerCase();
                if (lowerKey.includes('color_code') || lowerKey.includes('id')) return;
                const displayName = normalizeAttributeName(key);
                const displayValue = extractValue(value);
                if (displayValue && displayValue.trim()) {
                  variationAttributes.push({ name: displayName, option: displayValue });
                }
              });
            }
            return {
              id: v.id,
              attributes: variationAttributes,
              price: v.sale_price || v.regular_price || productData.sale_price || productData.regular_price || "0",
              regular_price: v.regular_price || productData.regular_price || "0",
              sale_price: v.sale_price || (v.regular_price ? null : productData.sale_price),
              stock_status: v.stock_status || "outofstock",
              stock_quantity: v.stock_quantity,
              image: v.image_url
                ? { src: v.image_url, alt: productData.name }
                : (productData.image_url ? { src: productData.image_url, alt: productData.name } : undefined),
            };
          });

          productData.attributes = attributesForSelector;
          (productData as any).original_attributes_json = originalAttributesJSON;
          productData.variations = formattedVariations;
          productData.type = "VARIABLE";
        }
      } else if (productData.attributes && typeof productData.attributes === 'object') {
        const simpleAttributes = productData.attributes;
        (productData as any).original_attributes_json = simpleAttributes;

        const attributeTermIds: string[] = [];
        Object.values(simpleAttributes).forEach((termIds: any) => {
          if (Array.isArray(termIds)) attributeTermIds.push(...termIds);
        });

        if (attributeTermIds.length > 0) {
          const { data: attributeTerms } = await supabase
            .from("product_attribute_terms")
            .select("id, name, slug, color_code, attribute_id, product_attributes!inner(name, slug)")
            .in("id", attributeTermIds);

          if (attributeTerms) {
            const attributesMap = new Map<string, { options: string[], colorCodes?: string[] }>();
            attributeTerms.forEach((term: any) => {
              const attrName = term.product_attributes?.name || "Attribut";
              if (!attributesMap.has(attrName)) attributesMap.set(attrName, { options: [], colorCodes: [] });
              attributesMap.get(attrName)?.options.push(term.name);
              if (term.color_code) attributesMap.get(attrName)?.colorCodes?.push(term.color_code);
            });
            const formattedAttributes = Array.from(attributesMap.entries()).map(([name, data]) => ({
              name,
              options: data.options,
              colorCodes: data.colorCodes && data.colorCodes.length > 0 ? data.colorCodes : undefined,
            }));
            productData.attributes = formattedAttributes;
            productData.type = "SIMPLE";
          }
        }
      }

      setProduct(productData);
      const dataForInfo = { ...productData, attributes: (productData as any).original_attributes_json || productData.attributes };
      loadInformativeAttributes(dataForInfo);

    } catch (error) {
      console.error("Error loading product:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleVariationChange = (variation: any) => {
    setSelectedVariation(variation);
    setUserSelectedGalleryImage(null);
  };

  const handleImageClick = (image: { id: string; src: string }) => {
    let isVariation = false;
    let targetVariation = null;

    if (image.id.startsWith("variation") || image.id === "variation-selected") {
      isVariation = true;
      if (image.id.startsWith("variation-") && image.id !== "variation-selected") {
        const parts = image.id.split("-");
        const idx = parseInt(parts[1]);
        if (!isNaN(idx) && product?.variations && product.variations[idx]) {
          targetVariation = product.variations[idx];
        }
      }
    }

    if (!isVariation && product?.variations) {
      const matchingVar = product.variations.find((v: any) => v.image?.src === image.src);
      if (matchingVar) {
        isVariation = true;
        targetVariation = matchingVar;
      }
    }

    if (isVariation) {
      setUserSelectedGalleryImage(null);

      if (targetVariation && targetVariation.id !== selectedVariation?.id) {
        const variationAttributes: Record<string, string> = {};
        targetVariation.attributes?.forEach((attr: any) => {
          variationAttributes[attr.name] = attr.option;
        });
        setInitialAttributes(variationAttributes);
        setSelectedVariation(targetVariation);
      }
    } else {
      setUserSelectedGalleryImage(image.src);
    }
  };
  
  const handleAddToCart = () => {
    if (!product) return;

    // --- VÉRIFICATION TAILLE OBLIGATOIRE ---
    if (availableSizes.length > 0 && !selectedSize) {
      toast.error("Veuillez sélectionner une taille");
      return;
    }

    if (product?.type === "VARIABLE" && !selectedVariation) {
      toast.error("Veuillez sélectionner toutes les options");
      return;
    }

    const productToAdd = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: selectedVariation?.sale_price || selectedVariation?.price || product.sale_price || product.regular_price || 0,
      image: selectedVariation?.image?.src
        ? { sourceUrl: selectedVariation.image.src }
        : (product.image_url ? { sourceUrl: product.image_url } : undefined),
      variationId: selectedVariation?.id || null,
      variationPrice: selectedVariation?.sale_price || selectedVariation?.price || product.sale_price || product.regular_price || null,
      variationImage: selectedVariation?.image || (product.image_url ? { src: product.image_url, alt: product.name } : null),
      // --- TRANSMISSION DE LA TAILLE ---
      selectedAttributes: {
        ...selectedVariation?.attributes,
        ...(selectedSize ? { "Taille": selectedSize } : {})
      },
    };
    addToCart(productToAdd, quantity);
    toast.success("Ajouté au panier !");
  };

  const handleNotifyMe = async () => {
    if (!notifyEmail) { toast.error("Veuillez entrer votre email"); return; }
    toast.success(CUSTOM_TEXTS.stockAlert.success);
    setShowNotifyDialog(false);
    setNotifyEmail("");
  };

  const handleDeleteProduct = async () => {
    if (!product || !isAdmin) return;
    if (!confirm(`Supprimer "${decodeHtmlEntities(product.name)}" ?`)) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', product.id);
      if (error) throw error;
      toast.success('Produit supprimé');
      router.push('/admin/products');
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    }
  };

  const getCurrentImageUrl = (): string | undefined => {
    if (!product) return undefined;
    if (userSelectedGalleryImage) return userSelectedGalleryImage;
    if (selectedVariation?.image?.src) return selectedVariation.image.src;
    if (product?.image_url) return product.image_url;
    return undefined;
  };

  const galleryImages = useMemo(() => {
    if (!product) return [{ id: "placeholder", src: "/placeholder.png", alt: "Product" }];
    const images: Array<{ id: string; src: string; alt: string }> = [];
    if (product.variations && Array.isArray(product.variations)) {
      product.variations.forEach((variation: any, idx: number) => {
        if (variation.image?.src && !images.some(i => i.src === variation.image.src)) {
          images.push({ id: `variation-${idx}`, src: variation.image.src, alt: variation.image.alt || product.name });
        }
      });
    }
    if (product.image_url && !images.some(i => i.src === product.image_url)) {
      images.push({ id: "main", src: product.image_url, alt: product.name });
    }
    if (product.gallery_images && Array.isArray(product.gallery_images)) {
      product.gallery_images.forEach((imgUrl: string, idx: number) => {
        if (imgUrl && !images.some(i => i.src === imgUrl)) {
          images.push({ id: `gallery-${idx}`, src: imgUrl, alt: product.name });
        }
      });
    }
    return images.length > 0 ? images : [{ id: "placeholder", src: "/placeholder.png", alt: product.name }];
  }, [product]);

  const currentPrice = selectedVariation?.sale_price || selectedVariation?.price || product?.sale_price || product?.regular_price;
  const regularPrice = selectedVariation?.regular_price || product?.regular_price;
  const hasDiscount = currentPrice && regularPrice && currentPrice < regularPrice;
  const isVariable = product?.type === "VARIABLE";
  const isInStock = isVariable
    ? selectedVariation?.stock_status === "instock"
    : product?.stock_status === "instock" && (product?.stock_quantity ?? 0) > 0;

  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  if (!product) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#FFF9F0] to-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6 sm:mb-8">
          <Link href="/" className="hover:text-[#b8933d] transition-colors flex items-center gap-1">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Accueil</span>
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium truncate">{decodeHtmlEntities(product.name)}</span>
        </nav>

        {isAdmin && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div><p className="text-sm font-medium text-blue-900">Mode Administrateur</p></div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/admin/products/${product.id}`}><Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100"><Edit className="h-4 w-4 mr-2" /> Modifier</Button></Link>
                <Button variant="outline" size="sm" onClick={handleDeleteProduct} className="border-red-300 text-red-700 hover:bg-red-100"><Trash2 className="h-4 w-4 mr-2" /> Supprimer</Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12 sm:mb-16">
          <div className="relative lg:sticky lg:top-4 lg:self-start">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <ProductGallery images={galleryImages} productName={decodeHtmlEntities(product.name)} selectedImageUrl={getCurrentImageUrl()} onImageClick={handleImageClick} />
            </div>
            {product.is_diamond && <div className="mt-4"><HiddenDiamond productId={product.id} position="image" selectedPosition={diamondPosition} /></div>}
          </div>

          <div className="space-y-6 bg-white rounded-2xl shadow-lg p-6 sm:p-8 h-fit">
            {product.is_diamond && <HiddenDiamond productId={product.id} position="title" selectedPosition={diamondPosition} />}

            <div className="border-b border-gray-100 pb-6">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#b8933d] mb-4 leading-tight">{decodeHtmlEntities(product.name)}</h1>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4">
                <div className="flex items-baseline gap-3">
                  {hasDiscount && regularPrice && <span className="text-xl sm:text-2xl text-gray-400 line-through">{Number(regularPrice).toFixed(2)} €</span>}
                  <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#b8933d] to-[#D4AF37] bg-clip-text text-transparent">{currentPrice ? Number(currentPrice).toFixed(2) : "0.00"} €</span>
                </div>
                {hasDiscount && <Badge className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-4 py-1.5 text-sm font-bold animate-pulse">PROMO</Badge>}
              </div>

              {informativeAttributes.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                  {informativeAttributes.map((attr) => (
                    <div key={attr.name} className="flex flex-col gap-1 items-center text-center">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{attr.name}</span>
                      <span className="text-sm font-medium text-gray-900">{attr.values.join(", ")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* --- SECTION TAILLES PAR BOUTONS --- */}
            {availableSizes.length > 0 && (
              <div className="space-y-4 pt-4">
                <Label className="text-sm font-bold text-gray-700">Choisir ma taille :</Label>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`h-11 w-11 sm:h-12 sm:w-12 rounded-xl border-2 font-bold transition-all ${
                        selectedSize === size
                          ? "border-[#b8933d] bg-[#b8933d] text-white shadow-md scale-105"
                          : "border-gray-200 bg-white text-gray-600 hover:border-[#b8933d] hover:text-[#b8933d]"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isVariable && product.attributes && product.variations && (
              <ProductVariationSelector attributes={product.attributes} variations={product.variations} onVariationChange={handleVariationChange} initialSelectedAttributes={initialAttributes} />
            )}

            <div className="space-y-6 bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100">
              <div>
                <Label htmlFor="quantity" className="mb-3 block text-sm font-semibold text-gray-700">{CUSTOM_TEXTS.product.quantity}</Label>
                <div className="flex items-center bg-white border-2 border-gray-200 rounded-xl w-36 shadow-sm hover:border-[#b8933d] transition-colors">
                  <Button variant="ghost" size="icon" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1} className="hover:bg-[#FFF9F0] rounded-l-xl"><Minus className="h-4 w-4" /></Button>
                  <Input id="quantity" type="number" min="1" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="border-0 text-center focus-visible:ring-0 font-semibold text-lg" />
                  <Button variant="ghost" size="icon" onClick={() => handleQuantityChange(1)} className="hover:bg-[#FFF9F0] rounded-r-xl"><Plus className="h-4 w-4" /></Button>
                </div>
              </div>

              <div className="flex gap-3">
                {isInStock ? (
                  <Button onClick={handleAddToCart} disabled={isVariable && !selectedVariation} className="flex-1 bg-gradient-to-r from-[#b8933d] to-[#D4AF37] hover:from-[#a07c2f] hover:to-[#C6A15B] text-white font-bold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] text-base">
                    <ShoppingCart className="h-5 w-5 mr-2" /> {CUSTOM_TEXTS.buttons.addToCart}
                  </Button>
                ) : (
                  <Button onClick={() => setShowNotifyDialog(true)} className="flex-1 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] text-base">
                    <Bell className="h-5 w-5 mr-2" /> {CUSTOM_TEXTS.buttons.alertStock}
                  </Button>
                )}
                <WishlistButton productId={product.id} variant="icon" size="icon" className="border-2 border-gray-200 hover:border-pink-300 hover:bg-pink-50 rounded-xl shadow-sm hover:shadow-md transition-all w-14 h-14" />
              </div>
              <ShareButtons url={`/product/${product.slug}`} title={product.name} description={product.short_description || undefined} />
            </div>

            <Accordion type="single" collapsible defaultValue="description" className="w-full border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <AccordionItem value="description" className="border-b last:border-b-0">
                <AccordionTrigger className="px-6 py-4 hover:bg-[#FFF9F0] transition-colors text-base font-semibold">📝 Description</AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-2">
                   {product.is_diamond && <div className="mb-4"><HiddenDiamond productId={product.id} position="description" selectedPosition={diamondPosition} /></div>}
                   {product.description ? <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: product.description }} /> : <p className="text-gray-600">Aucune description disponible.</p>}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="delivery" className="border-b-0">
                <AccordionTrigger className="px-6 py-4 hover:bg-[#FFF9F0] transition-colors text-base font-semibold">{CUSTOM_TEXTS.shipping.label}</AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-2">
                  <div className="space-y-3 text-gray-700">
                    <div className="flex items-start gap-2"><span className="text-green-600">✅</span><span>Livraison standard : 3-5 jours ouvrés</span></div>
                    <div className="flex items-start gap-2"><span className="text-blue-600">↩️</span><span>Retours gratuits sous 30 jours</span></div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </main>

      <Dialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="text-2xl font-bold flex items-center gap-2"><Bell className="h-6 w-6 text-[#b8933d]" />{CUSTOM_TEXTS.buttons.alertStock}</DialogTitle><DialogDescription>Entrez votre email pour être notifié quand cette pépite sera de nouveau disponible.</DialogDescription></DialogHeader>
          <div className="py-4"><Label htmlFor="email">Adresse email</Label><Input id="email" type="email" placeholder="votre@email.com" value={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value)} className="mt-2" /></div>
          <DialogFooter><Button variant="outline" onClick={() => setShowNotifyDialog(false)}>Annuler</Button><Button onClick={handleNotifyMe} className="bg-[#b8933d] text-white">Me notifier</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}