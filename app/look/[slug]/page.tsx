"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, ShoppingBag, AlertCircle, Heart } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import { Product } from "@/types";

interface Look {
  id: string;
  title: string;
  slug: string;
  description: string;
  morgane_advice: string;
  hero_image_url: string;
  discount_percentage: number;
  is_active: boolean;
}

interface LookProduct {
  id: string;
  look_id: string;
  woocommerce_product_id: number;
  product_name: string;
  product_image_url: string;
  hotspot_x: number;
  hotspot_y: number;
  display_order: number;
  is_required: boolean;
}

interface ProductVariant {
  id: number;
  name: string;
  price: number;
  regularPrice: number;
  stockStatus: string;
  stockQuantity: number | null;
  attributes: Array<{
    name: string;
    option: string;
  }>;
}

interface SelectedVariant {
  productId: number;
  variantId: number | null;
  name: string;
  price: number;
  attributes: any;
}

export default function LookPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { addToCart } = useCart();

  const [look, setLook] = useState<Look | null>(null);
  const [products, setProducts] = useState<LookProduct[]>([]);
  const [productDetails, setProductDetails] = useState<Map<number, any>>(new Map());
  const [selectedVariants, setSelectedVariants] = useState<Map<number, SelectedVariant>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchLook();
    }
  }, [slug]);

  const fetchLook = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      const { data: lookData, error: lookError } = await supabase
        .from("looks")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (lookError) throw lookError;
      setLook(lookData);

      const { data: productsData, error: productsError } = await supabase
        .from("look_products")
        .select("*")
        .eq("look_id", lookData.id)
        .order("display_order");

      if (productsError) throw productsError;
      setProducts(productsData || []);

      await fetchProductDetails(productsData || []);
    } catch (error) {
      console.error("Error fetching look:", error);
      toast.error("Erreur lors du chargement du look");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProductDetails = async (products: LookProduct[]) => {
    const details = new Map();

    for (const product of products) {
      try {
        const response = await fetch(
          `/api/woocommerce/products?id=${product.woocommerce_product_id}&include_variations=true`
        );
        const data = await response.json();

        if (data.products && data.products.length > 0) {
          details.set(product.woocommerce_product_id, data.products[0]);
        }
      } catch (error) {
        console.error(`Error fetching product ${product.woocommerce_product_id}:`, error);
      }
    }

    setProductDetails(details);
  };

  const calculateTotalPrice = () => {
    let total = 0;
    let originalTotal = 0;

    products.forEach((product) => {
      const selected = selectedVariants.get(product.woocommerce_product_id);
      if (selected) {
        total += selected.price;
        originalTotal += selected.price;
      } else {
        const details = productDetails.get(product.woocommerce_product_id);
        if (details) {
          const price = parseFloat(details.price || "0");
          originalTotal += price;
        }
      }
    });

    if (look && allRequiredSelected()) {
      const discountedTotal = total * (1 - look.discount_percentage / 100);
      return {
        original: originalTotal,
        discounted: discountedTotal,
        savings: originalTotal - discountedTotal,
      };
    }

    return {
      original: originalTotal,
      discounted: total,
      savings: 0,
    };
  };

  const allRequiredSelected = () => {
    const requiredProducts = products.filter((p) => p.is_required);
    return requiredProducts.every((product) => {
      const details = productDetails.get(product.woocommerce_product_id);
      if (!details) return false;

      if (details.type === "variable") {
        return selectedVariants.has(product.woocommerce_product_id);
      }
      return true;
    });
  };

  const isOutOfStock = () => {
    return products.some((product) => {
      const details = productDetails.get(product.woocommerce_product_id);
      if (!details) return true;

      if (details.type === "variable") {
        const selected = selectedVariants.get(product.woocommerce_product_id);
        if (!selected) return false;

        const variant = details.variations?.find((v: any) => v.id === selected.variantId);
        return variant?.stock_status !== "instock";
      }

      return details.stock_status !== "instock";
    });
  };

  const handleAddToCart = async () => {
    if (!allRequiredSelected()) {
      toast.error("Veuillez sélectionner toutes les options");
      return;
    }

    if (isOutOfStock()) {
      toast.error("Un ou plusieurs articles sont en rupture de stock");
      return;
    }

    try {
      for (const product of products) {
        const selected = selectedVariants.get(product.woocommerce_product_id);
        const details = productDetails.get(product.woocommerce_product_id);

        if (details) {
          const productForCart: Product = {
            id: details.id.toString(),
            name: details.name,
            price: details.type === "variable" && selected ? selected.price.toString() : (details.price || "0"),
            slug: details.slug || "",
            image: details.images?.[0] ? { sourceUrl: details.images[0].src } : undefined,
          };

          if (details.type === "variable" && selected) {
            addToCart({
              ...productForCart,
              variationId: selected.variantId,
              selectedAttributes: selected.attributes,
            } as any, 1);
          } else {
            addToCart(productForCart, 1);
          }
        }
      }

      toast.success(`Look "${look?.title}" ajouté au panier avec -${look?.discount_percentage}% !`);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Erreur lors de l'ajout au panier");
    }
  };

  const handleHotspotClick = (productId: string) => {
    setActiveHotspot(productId);
    const element = document.getElementById(`product-${productId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">Chargement du look...</div>
      </div>
    );
  }

  if (!look) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Look introuvable</AlertDescription>
        </Alert>
      </div>
    );
  }

  const pricing = calculateTotalPrice();
  const canPurchase = allRequiredSelected() && !isOutOfStock();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{look.title}</h1>
        {look.description && (
          <p className="text-lg text-muted-foreground">{look.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="relative">
          <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-lg">
            <img
              src={look.hero_image_url}
              alt={look.title}
              className="w-full h-full object-cover"
            />

            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => handleHotspotClick(product.id)}
                className={`absolute w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:scale-110 transition-transform ${
                  activeHotspot === product.id ? "ring-4 ring-[#D4AF37]" : ""
                }`}
                style={{
                  left: `${product.hotspot_x}%`,
                  top: `${product.hotspot_y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <Heart className="h-4 w-4 text-[#D4AF37]" />
              </button>
            ))}
          </div>

          {look.morgane_advice && (
            <Card className="mt-4 bg-[#D4AF37]/10 border-[#D4AF37]">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-[#D4AF37] flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold mb-1">Pourquoi j&apos;aime ce look ?</p>
                    <p className="text-sm text-muted-foreground">{look.morgane_advice}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Composez votre look
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {products.map((product) => {
                const details = productDetails.get(product.woocommerce_product_id);
                if (!details) return null;

                return (
                  <div
                    key={product.id}
                    id={`product-${product.id}`}
                    className={`p-4 border rounded-lg ${
                      activeHotspot === product.id ? "border-[#D4AF37] bg-[#D4AF37]/5" : ""
                    }`}
                  >
                    <div className="flex gap-4 mb-4">
                      {details.images?.[0] && (
                        <img
                          src={details.images[0].src}
                          alt={details.name}
                          className="w-20 h-20 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold">{details.name}</h3>
                        <p className="text-lg font-bold text-[#D4AF37]">
                          {parseFloat(details.price || "0").toFixed(2)}€
                        </p>
                        {product.is_required && (
                          <Badge variant="outline" className="mt-1">
                            Obligatoire
                          </Badge>
                        )}
                      </div>
                    </div>

                    {details.type === "variable" && details.variations && (
                      <div className="space-y-3">
                        {details.attributes?.map((attr: any) => (
                          <div key={attr.name}>
                            <Label className="text-sm font-medium mb-2 block">
                              {attr.name}
                            </Label>
                            <div className="flex flex-wrap gap-2">
                              {attr.options?.map((option: string) => {
                                const variant = details.variations?.find((v: any) =>
                                  v.attributes?.some(
                                    (a: any) =>
                                      a.name === attr.name && a.option === option
                                  )
                                );

                                const isSelected =
                                  selectedVariants.get(product.woocommerce_product_id)
                                    ?.attributes?.[attr.name] === option;

                                const isAvailable =
                                  variant?.stock_status === "instock";

                                return (
                                  <Button
                                    key={option}
                                    variant={isSelected ? "default" : "outline"}
                                    size="sm"
                                    disabled={!isAvailable}
                                    onClick={() => {
                                      if (variant) {
                                        const newVariants = new Map(selectedVariants);
                                        newVariants.set(product.woocommerce_product_id, {
                                          productId: product.woocommerce_product_id,
                                          variantId: variant.id,
                                          name: variant.name,
                                          price: parseFloat(variant.price || "0"),
                                          attributes: {
                                            ...selectedVariants.get(
                                              product.woocommerce_product_id
                                            )?.attributes,
                                            [attr.name]: option,
                                          },
                                        });
                                        setSelectedVariants(newVariants);
                                      }
                                    }}
                                    className={
                                      isSelected
                                        ? "bg-[#D4AF37] hover:bg-[#B8941F]"
                                        : ""
                                    }
                                  >
                                    {option}
                                    {!isAvailable && (
                                      <span className="ml-1 line-through">✕</span>
                                    )}
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#D4AF37]/10 to-[#D4AF37]/5 border-[#D4AF37]">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Prix total</span>
                  <span className="text-lg line-through">
                    {pricing.original.toFixed(2)}€
                  </span>
                </div>

                {pricing.savings > 0 && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">
                        Remise (-{look.discount_percentage}%)
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        -{pricing.savings.toFixed(2)}€
                      </span>
                    </div>

                    <div className="h-px bg-border" />

                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold">Prix du look</span>
                      <span className="text-2xl font-bold text-[#D4AF37]">
                        {pricing.discounted.toFixed(2)}€
                      </span>
                    </div>
                  </>
                )}

                {isOutOfStock() && (
                  <Alert className="bg-orange-50 border-orange-200">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription>
                      Ce look est victime de son succès, mais vous pouvez encore
                      adopter les pièces restantes individuellement !
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleAddToCart}
                  disabled={!canPurchase}
                  size="lg"
                  className="w-full bg-[#D4AF37] hover:bg-[#B8941F] text-white"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Je craque pour le look complet (-{look.discount_percentage}%)
                </Button>

                {!allRequiredSelected() && (
                  <p className="text-sm text-center text-muted-foreground">
                    Sélectionnez toutes les options pour continuer
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
