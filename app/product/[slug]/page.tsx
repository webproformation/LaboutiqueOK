"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, Product } from "@/lib/supabase";
import {
  ChevronRight,
  Home,
  ShoppingCart,
  Heart,
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
  const [notifyEmail, setNotifyEmail] = useState("");
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);
  const [activeImageUrl, setActiveImageUrl] = useState<string | undefined>(undefined);
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

  // Auto-sélection de la première variation au chargement
  useEffect(() => {
    if (product && product.type === "VARIABLE" && product.attributes && product.variations && !selectedVariation) {
      const firstSelections: Record<string, string> = {};

      // Sélectionner la première option de chaque attribut
      product.attributes.forEach((attr: any) => {
        if (attr.options && attr.options.length > 0) {
          firstSelections[attr.name] = attr.options[0];
        }
      });

      // Trouver la variation correspondante
      const matchingVariation = product.variations.find((variation: any) =>
        variation.attributes?.every((attr: any) =>
          firstSelections[attr.name]?.toLowerCase() === attr.option?.toLowerCase()
        )
      );

      if (matchingVariation) {
        // Extraire les attributs de la variation pour les passer au sélecteur
        const variationAttributes: Record<string, string> = {};
        matchingVariation.attributes?.forEach((attr: any) => {
          variationAttributes[attr.name] = attr.option;
        });

        setInitialAttributes(variationAttributes);
        setSelectedVariation(matchingVariation);
        if (matchingVariation.image?.src) {
          setActiveImageUrl(matchingVariation.image.src);
        }
      }
    }
  }, [product]);

  async function checkAdminStatus() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data) {
        setIsAdmin(data.is_admin || false);
      }
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
        const { data: variations, error: variationsError } = await supabase
          .from("product_variations")
          .select("*")
          .eq("product_id", productData.id);

        if (!variationsError && variations) {
          const attributesMap = new Map<string, Set<string>>();

          const extractValue = (value: any): string => {
            if (typeof value === 'object' && value !== null) {
              return value.name || value.value || String(value);
            }
            return String(value);
          };

          const normalizeAttributeName = (key: string): string => {
            const lowerKey = key.toLowerCase();
            if (lowerKey.includes('couleur') || lowerKey === 'couleur_name') {
              return 'Couleur';
            }
            if (lowerKey.includes('taille') || lowerKey.includes('size')) {
              return 'Taille';
            }
            return key.charAt(0).toUpperCase() + key.slice(1);
          };

          variations.forEach((variation) => {
            if (variation.attributes && typeof variation.attributes === 'object') {
              Object.entries(variation.attributes).forEach(([key, value]) => {
                const lowerKey = key.toLowerCase();

                if (lowerKey.includes('color_code') || lowerKey.includes('id')) {
                  return;
                }

                const displayName = normalizeAttributeName(key);
                const displayValue = extractValue(value);

                if (displayValue && displayValue.trim()) {
                  if (!attributesMap.has(displayName)) {
                    attributesMap.set(displayName, new Set());
                  }
                  attributesMap.get(displayName)?.add(displayValue);
                }
              });
            }
          });

          const attributes = Array.from(attributesMap.entries()).map(([name, options]) => ({
            name,
            options: Array.from(options),
          }));

          const formattedVariations = variations.map((v) => {
            const variationAttributes: Array<{name: string; option: string}> = [];

            if (v.attributes && typeof v.attributes === 'object') {
              Object.entries(v.attributes).forEach(([key, value]) => {
                const lowerKey = key.toLowerCase();

                if (lowerKey.includes('color_code') || lowerKey.includes('id')) {
                  return;
                }

                const displayName = normalizeAttributeName(key);
                const displayValue = extractValue(value);

                if (displayValue && displayValue.trim()) {
                  variationAttributes.push({
                    name: displayName,
                    option: displayValue
                  });
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

          productData.attributes = attributes;
          productData.variations = formattedVariations;
          productData.type = "VARIABLE";
        }
      } else if (productData.attributes && typeof productData.attributes === 'object') {
        // Produit simple avec attributs dans products.attributes
        const simpleAttributes = productData.attributes;

        // Charger les noms des termes d'attributs depuis la base
        const attributeTermIds: string[] = [];
        Object.values(simpleAttributes).forEach((termIds: any) => {
          if (Array.isArray(termIds)) {
            attributeTermIds.push(...termIds);
          }
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
              if (!attributesMap.has(attrName)) {
                attributesMap.set(attrName, { options: [], colorCodes: [] });
              }
              attributesMap.get(attrName)?.options.push(term.name);
              if (term.color_code) {
                attributesMap.get(attrName)?.colorCodes?.push(term.color_code);
              }
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

      // Charger les attributs informatifs (non-variations)
      const { data: attributeValues, error: attributeError } = await supabase
        .from("product_attribute_values")
        .select(`
          product_attributes!inner(
            id,
            name,
            slug,
            type
          ),
          product_attribute_terms(
            id,
            name
          )
        `)
        .eq("product_id", productData.id);

      if (!attributeError && attributeValues && attributeValues.length > 0) {
        // Grouper par attribut et exclure uniquement les variations (couleurs-principales, tailles)
        const attributesMap = new Map<string, Set<string>>();

        attributeValues.forEach((av: any) => {
          if (av.product_attributes && av.product_attribute_terms) {
            const attrName = av.product_attributes.name;
            const attrSlug = av.product_attributes.slug?.toLowerCase() || '';
            const termValue = av.product_attribute_terms.name;

            // Exclure uniquement les attributs de variations (couleurs-principales, tailles)
            if (attrSlug === 'couleurs-principales' ||
                attrSlug === 'tailles' ||
                attrSlug.includes('couleur') ||
                attrSlug.includes('color') ||
                attrSlug.includes('taille') ||
                attrSlug.includes('size')) {
              return;
            }

            // Tout le reste est considéré comme informatif (Coupe, Confort, Live, etc.)
            if (!attributesMap.has(attrName)) {
              attributesMap.set(attrName, new Set());
            }
            if (termValue) {
              attributesMap.get(attrName)?.add(termValue);
            }
          }
        });

        const formattedAttributes = Array.from(attributesMap.entries()).map(([name, valuesSet]) => ({
          name,
          values: Array.from(valuesSet),
        }));

        setInformativeAttributes(formattedAttributes);

        if (formattedAttributes.length > 0) {
          console.log('✅ Attributs informatifs chargés:', formattedAttributes);
        }
      } else if (attributeError) {
        console.error('❌ Erreur lors du chargement des attributs informatifs:', attributeError);
      }
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
    if (variation?.image?.src) {
      setActiveImageUrl(variation.image.src);
    }
  };

const handleImageClick = (image: { id: string; src: string }) => {
    console.log("🖱️ CLIC IMAGE:", image); // DEBUG

    let isVariation = false;
    let targetVariation = null;

    // 1. Vérification par l'ID
    if (image.id.startsWith("variation") || image.id === "variation-selected") {
      isVariation = true;
      console.log("✅ Identifié comme variation via ID");
      
      if (image.id.startsWith("variation-") && image.id !== "variation-selected") {
        const parts = image.id.split("-");
        const idx = parseInt(parts[1]);
        if (!isNaN(idx) && product?.variations && product.variations[idx]) {
          targetVariation = product.variations[idx];
        }
      }
    }

    // 2. Vérification de secours par l'URL
    if (!isVariation && product?.variations) {
      const matchingVar = product.variations.find((v: any) => v.image?.src === image.src);
      if (matchingVar) {
        isVariation = true;
        targetVariation = matchingVar;
        console.log("✅ Identifié comme variation via URL (Fallback)");
      } else {
        console.log("❌ URL ne correspond à aucune variation:", image.src);
      }
    }

    if (isVariation) {
      // DÉVERROUILLAGE
      console.log("🔓 DÉVERROUILLAGE de la galerie");
      setUserSelectedGalleryImage(null);

      if (targetVariation && targetVariation.id !== selectedVariation?.id) {
        console.log("🔄 Changement de variation vers:", targetVariation.id);
        const variationAttributes: Record<string, string> = {};
        targetVariation.attributes?.forEach((attr: any) => {
          variationAttributes[attr.name] = attr.option;
        });
        setInitialAttributes(variationAttributes);
        setSelectedVariation(targetVariation);
        
        if (targetVariation.image?.src) {
          setActiveImageUrl(targetVariation.image.src);
        }
      }
    } else {
      // VERROUILLAGE
      console.log("🔒 VERROUILLAGE sur l'image:", image.id);
      setUserSelectedGalleryImage(image.src);
    }
  };
  
  const handleAddToCart = () => {
    if (!product) return;

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
      selectedAttributes: selectedVariation?.attributes || {},
    };

    addToCart(productToAdd, quantity);
  };

  const handleNotifyMe = async () => {
    if (!notifyEmail) {
      toast.error("Veuillez entrer votre email");
      return;
    }

    toast.success(CUSTOM_TEXTS.stockAlert.success);
    setShowNotifyDialog(false);
    setNotifyEmail("");
  };

  const handleDeleteProduct = async () => {
    if (!product || !isAdmin) return;

    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer le produit "${decodeHtmlEntities(product.name)}" ?\n\nCette action est irréversible.`
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (error) throw error;

      toast.success('Produit supprimé avec succès', {
        position: 'bottom-right'
      });

      router.push('/admin/products');
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error(`Erreur lors de la suppression: ${error.message}`, {
        position: 'bottom-right'
      });
    }
  };

  // HOOKS: Déclarer TOUS les hooks AVANT les early returns (règle React)
  // Logique d'héritage d'image en cascade (4 priorités)
  const getCurrentImageUrl = (): string | undefined => {
    if (!product) return undefined;

    // Priorité 1: Sélection manuelle dans la galerie (PRIORITÉ ABSOLUE)
    if (userSelectedGalleryImage) {
      return userSelectedGalleryImage;
    }

    // Priorité 2: Image de la variation exacte sélectionnée
    if (selectedVariation?.image?.src) {
      return selectedVariation.image.src;
    }

    // Priorité 3: Image d'une autre variation avec la même couleur
    if (selectedVariation && product?.variations) {
      // Chercher l'attribut couleur dans la variation sélectionnée
      const colorAttribute = selectedVariation.attributes?.find((attr: any) => {
        const attrName = attr.name?.toLowerCase() || '';
        return attrName.includes('couleur') || attrName.includes('color');
      });

      if (colorAttribute) {
        const selectedColor = colorAttribute.option;

        // Chercher une autre variation avec la même couleur qui a une image
        const variationWithSameColor = product.variations.find((v: any) => {
          if (!v.image?.src || v.id === selectedVariation.id) return false;

          const vColorAttribute = v.attributes?.find((attr: any) => {
            const attrName = attr.name?.toLowerCase() || '';
            return attrName.includes('couleur') || attrName.includes('color');
          });

          return vColorAttribute?.option?.toLowerCase() === selectedColor?.toLowerCase();
        });

        if (variationWithSameColor?.image?.src) {
          return variationWithSameColor.image.src;
        }
      }
    }

    // Priorité 4: Première image du produit parent
    if (product?.image_url) {
      return product.image_url;
    }

    return undefined;
  };

  const galleryImages = useMemo(() => {
      if (!product) return [{ id: "placeholder", src: "/placeholder.png", alt: "Product" }];

      const images: Array<{ id: string; src: string; alt: string }> = [];

      // --- NOUVEL ORDRE DE PRIORITÉ (CORRECTIF) ---

      // 1. D'abord l'image de la variation ACTIVE (Top priorité)
      if (selectedVariation?.image?.src) {
        images.push({
          id: "variation-selected",
          src: selectedVariation.image.src,
          alt: selectedVariation.image.alt || product.name,
        });
      }

      // 2. Ensuite TOUTES les images de variations (C'est ICI le changement clé)
      // On les met AVANT l'image principale pour qu'elles gardent leur identité "variation-x"
      // et déverrouillent la galerie au clic.
      if (product.variations && Array.isArray(product.variations) && product.variations.length > 0) {
        product.variations.forEach((variation: any, idx: number) => {
          // On évite juste le doublon avec l'image "selected" juste au dessus
          if (variation.image?.src && !images.some(i => i.src === variation.image.src)) {
            images.push({
              id: `variation-${idx}`,
              src: variation.image.src,
              alt: variation.image.alt || product.name,
            });
          }
        });
      }

      // 3. Ensuite l'Image Principale (si elle n'est pas déjà ajoutée via les variations)
      if (product.image_url && !images.some(i => i.src === product.image_url)) {
        images.push({
          id: "main",
          src: product.image_url,
          alt: product.name,
        });
      }

      // 4. Enfin les images de la Galerie (si elles ne sont pas déjà là)
      if (product.gallery_images && Array.isArray(product.gallery_images) && product.gallery_images.length > 0) {
        product.gallery_images.forEach((imgUrl: string, idx: number) => {
          if (imgUrl && !images.some(i => i.src === imgUrl)) {
            images.push({
              id: `gallery-${idx}`,
              src: imgUrl,
              alt: product.name,
            });
          }
        });
      }

      // 5. Fallback
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        product.images.forEach((img: any, idx: number) => {
          const imgSrc = img.src || img.sourceUrl || img.url;
          if (imgSrc && !images.some(i => i.src === imgSrc)) {
            images.push({
              id: `img-${idx}`,
              src: imgSrc,
              alt: img.alt || product.name,
            });
          }
        });
      }

      return images.length > 0 ? images : [{ id: "placeholder", src: "/placeholder.png", alt: product.name }];
    }, [product, selectedVariation]);
  
  // Variables calculées (après les hooks, mais avant les early returns si nécessaire)
  const currentPrice =
    selectedVariation?.sale_price ||
    selectedVariation?.price ||
    product?.sale_price ||
    product?.regular_price;
  const regularPrice =
    selectedVariation?.regular_price || product?.regular_price;
  const hasDiscount =
    currentPrice && regularPrice && currentPrice < regularPrice;
  const isVariable = product?.type === "VARIABLE";
  const isInStock = isVariable
    ? selectedVariation?.stock_status === "instock"
    : product?.stock_status === "instock" && (product?.stock_quantity ?? 0) > 0;

  // EARLY RETURNS: Après tous les hooks
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

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
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Mode Administrateur
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Vous voyez ces boutons car vous êtes connecté en tant qu'administrateur
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/admin/products/${product.id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteProduct}
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12 sm:mb-16">
          <div className="relative lg:sticky lg:top-4 lg:self-start">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <ProductGallery
                images={galleryImages}
                productName={decodeHtmlEntities(product.name)}
                selectedImageUrl={getCurrentImageUrl()}
                onImageClick={handleImageClick}
              />
            </div>
            {product.is_diamond && (
              <div className="mt-4">
                <HiddenDiamond productId={product.id} position="image" selectedPosition={diamondPosition} />
              </div>
            )}
          </div>

          <div className="space-y-6 bg-white rounded-2xl shadow-lg p-6 sm:p-8 h-fit">
            {product.is_diamond && (
              <HiddenDiamond productId={product.id} position="title" selectedPosition={diamondPosition} />
            )}

            <div className="border-b border-gray-100 pb-6">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {decodeHtmlEntities(product.name)}
              </h1>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4">
                <div className="flex items-baseline gap-3">
                  {hasDiscount && regularPrice && (
                    <span className="text-xl sm:text-2xl text-gray-400 line-through">
                      {Number(regularPrice).toFixed(2)} €
                    </span>
                  )}
                  <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#b8933d] to-[#D4AF37] bg-clip-text text-transparent">
                    {currentPrice ? Number(currentPrice).toFixed(2) : "0.00"} €
                  </span>
                </div>
                {hasDiscount && (
                  <Badge className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-4 py-1.5 text-sm font-bold animate-pulse">
                    PROMO
                  </Badge>
                )}
              </div>

              {isVariable && (
                <p className="text-sm text-gray-600 mb-4">
                  Sélectionnez les options ci-dessous
                </p>
              )}

              {!isVariable && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200">
                  {isInStock ? (
                    <>
                      {product.stock_quantity === 1 ? (
                        <>
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-300" />
                          <span className="text-red-700 font-bold text-sm">
                            {CUSTOM_TEXTS.stock.lowStock}
                          </span>
                        </>
                      ) : product.stock_quantity && product.stock_quantity < 5 ? (
                        <>
                          <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shadow-lg shadow-orange-300" />
                          <span className="text-orange-700 font-bold text-sm">
                            {CUSTOM_TEXTS.stock.lowStock}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-lg shadow-green-300" />
                          <span className="text-green-700 font-semibold text-sm">
                            {CUSTOM_TEXTS.stock.inStock}
                          </span>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                      <span className="text-pink-700 font-semibold text-sm">
                        {CUSTOM_TEXTS.stock.outOfStock}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {isVariable && product.attributes && product.variations && (
              <ProductVariationSelector
                attributes={product.attributes}
                variations={product.variations}
                onVariationChange={handleVariationChange}
                initialSelectedAttributes={initialAttributes}
              />
            )}

            {informativeAttributes.length > 0 && (
              <div className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-amber-25 to-white rounded-xl p-6 space-y-4 shadow-sm">
                <h3 className="text-base font-bold text-[#b8933d] uppercase tracking-wide flex items-center gap-2">
                  <span className="text-xl">✨</span> Caractéristiques du Produit
                </h3>
                <div className="space-y-3">
                  {informativeAttributes.map((attr, index) => (
                    <div key={index} className="flex items-start gap-3 text-sm bg-white/80 rounded-lg p-3 border border-amber-100">
                      <span className="font-bold text-gray-800 min-w-[120px] text-[#b8933d]">{attr.name} :</span>
                      <span className="text-gray-900 font-medium">{attr.values.join(", ")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isVariable && product.attributes && product.attributes.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Caractéristiques
                </h3>
                {product.attributes.map((attr: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <Label className="text-gray-700">{attr.name}</Label>
                    <div className="flex flex-wrap gap-2">
                      {attr.options.map((option: string, optionIndex: number) => {
                        const colorCode = attr.colorCodes?.[optionIndex];
                        return (
                          <div
                            key={optionIndex}
                            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-white"
                          >
                            {colorCode && (
                              <div
                                className="w-5 h-5 rounded-full border-2 border-gray-300"
                                style={{ backgroundColor: colorCode }}
                              />
                            )}
                            <span className="text-sm text-gray-900">{option}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-6 bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100">
              <div>
                <Label htmlFor="quantity" className="mb-3 block text-sm font-semibold text-gray-700">
                  {CUSTOM_TEXTS.product.quantity}
                </Label>
                <div className="flex items-center bg-white border-2 border-gray-200 rounded-xl w-36 shadow-sm hover:border-[#b8933d] transition-colors">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="hover:bg-[#FFF9F0] rounded-l-xl"
                    aria-label={CUSTOM_TEXTS.buttons.decreaseQuantity}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="border-0 text-center focus-visible:ring-0 font-semibold text-lg"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuantityChange(1)}
                    className="hover:bg-[#FFF9F0] rounded-r-xl"
                    aria-label={CUSTOM_TEXTS.buttons.increaseQuantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                {isInStock ? (
                  <Button
                    onClick={handleAddToCart}
                    disabled={isVariable && !selectedVariation}
                    className="flex-1 bg-gradient-to-r from-[#b8933d] to-[#D4AF37] hover:from-[#a07c2f] hover:to-[#C6A15B] text-white font-bold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] text-base"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {CUSTOM_TEXTS.buttons.addToCart}
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowNotifyDialog(true)}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] text-base"
                  >
                    <Bell className="h-5 w-5 mr-2" />
                    {CUSTOM_TEXTS.buttons.alertStock}
                  </Button>
                )}

                <WishlistButton
                  productId={product.id}
                  variant="icon"
                  size="icon"
                  className="border-2 border-gray-200 hover:border-pink-300 hover:bg-pink-50 rounded-xl shadow-sm hover:shadow-md transition-all w-14 h-14"
                />
              </div>

              <ShareButtons
                url={`/product/${product.slug}`}
                title={product.name}
                description={product.short_description || undefined}
              />
            </div>

            <Accordion type="single" collapsible defaultValue="description" className="w-full border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <AccordionItem value="description" className="border-b last:border-b-0">
                <AccordionTrigger className="px-6 py-4 hover:bg-[#FFF9F0] transition-colors text-base font-semibold">
                  📝 Description
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-2">
                  {product.is_diamond && (
                    <div className="mb-4">
                      <HiddenDiamond productId={product.id} position="description" selectedPosition={diamondPosition} />
                    </div>
                  )}
                  {product.description ? (
                    <div
                      className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                  ) : (
                    <p className="text-gray-600">Aucune description disponible.</p>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="composition" className="border-b last:border-b-0">
                <AccordionTrigger className="px-6 py-4 hover:bg-[#FFF9F0] transition-colors text-base font-semibold">
                  🧵 Composition & Entretien
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-2">
                  <div className="space-y-3 text-gray-700">
                    <div className="flex items-start gap-2">
                      <span className="font-semibold min-w-[120px]">Composition :</span>
                      <span>À compléter</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-semibold min-w-[120px]">Entretien :</span>
                      <span>Lavage en machine à 30°C</span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="delivery" className="border-b-0">
                <AccordionTrigger className="px-6 py-4 hover:bg-[#FFF9F0] transition-colors text-base font-semibold">
                  {CUSTOM_TEXTS.shipping.label}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-2">
                  <div className="space-y-3 text-gray-700">
                    <div className="flex items-start gap-2">
                      <span className="text-green-600">✅</span>
                      <span>Livraison standard : 3-5 jours ouvrés</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600">↩️</span>
                      <span>Retours gratuits sous 30 jours</span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </main>

      <Dialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6 text-[#b8933d]" />
              {CUSTOM_TEXTS.buttons.alertStock}
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              Entrez votre email pour être notifié quand cette pépite sera de nouveau disponible.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="email" className="text-sm font-semibold text-gray-700 mb-2 block">
              Adresse email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="votre@email.com"
              value={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.value)}
              className="mt-2 h-12 rounded-xl border-2 focus:border-[#b8933d]"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowNotifyDialog(false)}
              className="rounded-xl border-2"
            >
              Annuler
            </Button>
            <Button
              onClick={handleNotifyMe}
              className="bg-gradient-to-r from-[#b8933d] to-[#D4AF37] hover:from-[#a07c2f] hover:to-[#C6A15B] text-white rounded-xl font-bold shadow-md"
            >
              Me notifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
