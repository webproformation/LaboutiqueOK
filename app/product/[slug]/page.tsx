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

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [slug]);

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
    if (product?.type === "VARIABLE" && !selectedVariation) {
      toast.error("Veuillez sélectionner toutes les options");
      return;
    }

    toast.success("Produit ajouté au panier !");
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

  const galleryImages = product.images && product.images.length > 0
    ? product.images.map((img: any, idx: number) => ({
        id: `img-${idx}`,
        src: img.src || img.sourceUrl || img.url,
        alt: img.alt || product.name,
      }))
    : [{ id: "main", src: product.image_url || "/placeholder.png", alt: product.name }];

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div className="relative">
            <ProductGallery images={galleryImages} productName={decodeHtmlEntities(product.name)} />
            {product.is_diamond && (
              <div className="mt-4">
                <HiddenDiamond productId={product.id} position="image" />
              </div>
            )}
          </div>

          <div className="space-y-6">
            {product.is_diamond && (
              <HiddenDiamond productId={product.id} position="title" />
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
                      <HiddenDiamond productId={product.id} position="description" />
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
