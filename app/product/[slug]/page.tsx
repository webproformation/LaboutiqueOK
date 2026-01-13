"use client";

import { useEffect, useState } from "react";
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
  const [diamondPosition] = useState<"title" | "image" | "description">(() =>
    diamondPositions[Math.floor(Math.random() * diamondPositions.length)]
  );

  useEffect(() => {
    loadProduct();
    checkAdminStatus();
  }, [slug, user]);

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

          variations.forEach((variation) => {
            if (variation.attributes) {
              // Ne garder que les attributs d'affichage (pas les codes techniques)
              if (variation.attributes.couleur_name) {
                if (!attributesMap.has("Couleur")) {
                  attributesMap.set("Couleur", new Set());
                }
                attributesMap.get("Couleur")?.add(variation.attributes.couleur_name as string);
              }

              // Ajouter d'autres attributs (taille, etc.) sauf couleur, color_code
              Object.entries(variation.attributes).forEach(([key, value]) => {
                const lowerKey = key.toLowerCase();
                // Ignorer les champs techniques de couleur
                if (!lowerKey.includes('couleur') && !lowerKey.includes('color')) {
                  const displayName = key.charAt(0).toUpperCase() + key.slice(1);
                  if (!attributesMap.has(displayName)) {
                    attributesMap.set(displayName, new Set());
                  }
                  attributesMap.get(displayName)?.add(value as string);
                }
              });
            }
          });

          const attributes = Array.from(attributesMap.entries()).map(([name, options]) => ({
            name,
            options: Array.from(options),
          }));

          const formattedVariations = variations.map((v) => ({
            id: v.id,
            attributes: Object.entries(v.attributes || {})
              .filter(([key]) => {
                const lowerKey = key.toLowerCase();
                // Pour les couleurs, ne garder que couleur_name
                if (lowerKey.includes('couleur') || lowerKey.includes('color')) {
                  return key === 'couleur_name';
                }
                return true; // Garder les autres attributs
              })
              .map(([name, option]) => ({
                name: name === 'couleur_name' ? 'Couleur' : (name.charAt(0).toUpperCase() + name.slice(1)),
                option: option as string,
              })),
            price: v.sale_price || v.regular_price || productData.sale_price || productData.regular_price || "0",
            regular_price: v.regular_price || productData.regular_price || "0",
            sale_price: v.sale_price || (v.regular_price ? null : productData.sale_price),
            stock_status: v.stock_status || "outofstock",
            stock_quantity: v.stock_quantity,
            image: v.image_url
              ? { src: v.image_url, alt: productData.name }
              : (productData.image_url ? { src: productData.image_url, alt: productData.name } : undefined),
          }));

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
    } catch (error) {
      console.error("Error loading product:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
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

    toast.success("Vous serez notifié quand le produit sera de nouveau en stock !");
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

  const currentPrice =
    selectedVariation?.sale_price ||
    selectedVariation?.price ||
    product.sale_price ||
    product.regular_price;
  const regularPrice =
    selectedVariation?.regular_price || product.regular_price;
  const hasDiscount =
    currentPrice && regularPrice && currentPrice < regularPrice;
  const isVariable = product.type === "VARIABLE";
  const isInStock = isVariable
    ? selectedVariation?.stock_status === "instock"
    : product.stock_status === "instock" && (product.stock_quantity ?? 0) > 0;

  const galleryImages = (() => {
    const images: Array<{ id: string; src: string; alt: string }> = [];

    if (product.image_url) {
      images.push({
        id: "main",
        src: product.image_url,
        alt: product.name,
      });
    }

    if (product.gallery_images && Array.isArray(product.gallery_images) && product.gallery_images.length > 0) {
      product.gallery_images.forEach((imgUrl: string, idx: number) => {
        if (imgUrl && imgUrl !== product.image_url) {
          images.push({
            id: `gallery-${idx}`,
            src: imgUrl,
            alt: product.name,
          });
        }
      });
    }

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
  })();

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-gray-900 flex items-center gap-1">
            <Home className="h-4 w-4" />
            Accueil
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">{decodeHtmlEntities(product.name)}</span>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div className="relative">
            <ProductGallery images={galleryImages} productName={decodeHtmlEntities(product.name)} />
            {product.is_diamond && (
              <div className="mt-4">
                <HiddenDiamond productId={product.id} position="image" selectedPosition={diamondPosition} />
              </div>
            )}
          </div>

          <div className="space-y-6">
            {product.is_diamond && (
              <HiddenDiamond productId={product.id} position="title" selectedPosition={diamondPosition} />
            )}

            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                {decodeHtmlEntities(product.name)}
              </h1>

              <div className="flex items-baseline gap-4 mb-4">
                {hasDiscount && regularPrice && (
                  <>
                    <span className="text-2xl text-gray-400 line-through">
                      {Number(regularPrice).toFixed(2)} €
                    </span>
                    <Badge className="bg-[#DF30CF] hover:bg-[#DF30CF]">PROMO</Badge>
                  </>
                )}
                <span className="text-4xl font-bold text-[#b8933d]">
                  {currentPrice ? Number(currentPrice).toFixed(2) : "0.00"} €
                </span>
              </div>

              {isVariable && (
                <p className="text-sm text-gray-600 mb-4">
                  Sélectionnez les options ci-dessous
                </p>
              )}

              {!isVariable && (
                <div className="flex items-center gap-2 mb-4">
                  {isInStock ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-green-600 font-medium">
                        Produit disponible
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-[#DF30CF]" />
                      <span className="text-[#DF30CF] font-medium">
                        Rupture de stock
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
                onVariationChange={setSelectedVariation}
              />
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

            <div className="space-y-4">
              <div>
                <Label htmlFor="quantity" className="mb-2 block">
                  Quantité
                </Label>
                <div className="flex items-center border border-gray-300 rounded-md w-32">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="border-0 text-center focus-visible:ring-0"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuantityChange(1)}
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
                    className="flex-1 bg-[#b8933d] hover:bg-[#a07c2f] text-white"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Ajouter au panier
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowNotifyDialog(true)}
                    className="flex-1 bg-[#B6914A] hover:bg-[#a07c2f] text-white"
                  >
                    <Bell className="h-5 w-5 mr-2" />
                    Me notifier
                  </Button>
                )}

                <WishlistButton
                  productId={product.id}
                  variant="icon"
                  size="icon"
                  className="border border-gray-300"
                />
              </div>

              <ShareButtons
                url={`/product/${product.slug}`}
                title={product.name}
                description={product.short_description || undefined}
              />
            </div>

            <Accordion type="single" collapsible defaultValue="description" className="w-full">
              <AccordionItem value="description">
                <AccordionTrigger>Description</AccordionTrigger>
                <AccordionContent>
                  {product.is_diamond && (
                    <div className="mb-4">
                      <HiddenDiamond productId={product.id} position="description" selectedPosition={diamondPosition} />
                    </div>
                  )}
                  {product.description ? (
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                  ) : (
                    <p className="text-gray-600">Aucune description disponible.</p>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="composition">
                <AccordionTrigger>Composition & Entretien</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-gray-600">
                    <p>Composition : À compléter</p>
                    <p>Entretien : Lavage en machine à 30°C</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="delivery">
                <AccordionTrigger>Livraison & Retours</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-gray-600">
                    <p>Livraison standard : 3-5 jours ouvrés</p>
                    <p>Retours gratuits sous 30 jours</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </main>

      <Dialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notification de disponibilité</DialogTitle>
            <DialogDescription>
              Entrez votre email pour être notifié quand ce produit sera de nouveau en stock.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="email">Adresse email</Label>
            <Input
              id="email"
              type="email"
              placeholder="votre@email.com"
              value={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotifyDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleNotifyMe} className="bg-[#b8933d] hover:bg-[#a07c2f]">
              Me notifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
