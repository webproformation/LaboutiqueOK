"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Look {
  id: string;
  title: string;
  hero_image_url: string;
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

export default function AdminLookProductsPage() {
  const params = useParams();
  const router = useRouter();
  const lookId = params?.id as string;

  const [look, setLook] = useState<Look | null>(null);
  const [products, setProducts] = useState<LookProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [hotspotPosition, setHotspotPosition] = useState({ x: 50, y: 50 });

  useEffect(() => {
    if (lookId) {
      fetchLook();
      fetchProducts();
    }
  }, [lookId]);

  const fetchLook = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("looks")
        .select("*")
        .eq("id", lookId)
        .single();

      if (error) throw error;
      setLook(data);
    } catch (error) {
      console.error("Error fetching look:", error);
      toast.error("Erreur lors du chargement du look");
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("look_products")
        .select("*")
        .eq("look_id", lookId)
        .order("display_order");

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Erreur lors du chargement des produits");
    } finally {
      setIsLoading(false);
    }
  };

  const searchProducts = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/woocommerce/products?search=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();

      if (data.products) {
        setSearchResults(data.products);
      }
    } catch (error) {
      console.error("Error searching products:", error);
      toast.error("Erreur lors de la recherche");
    } finally {
      setIsSearching(false);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setHotspotPosition({ x, y });
  };

  const handleAddProduct = async () => {
    if (!selectedProduct) {
      toast.error("Veuillez sélectionner un produit");
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from("look_products").insert([
        {
          look_id: lookId,
          woocommerce_product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          product_image_url: selectedProduct.images?.[0]?.src || "",
          hotspot_x: hotspotPosition.x,
          hotspot_y: hotspotPosition.y,
          display_order: products.length,
          is_required: true,
        },
      ]);

      if (error) throw error;

      toast.success("Produit ajouté au look");
      setIsDialogOpen(false);
      setSelectedProduct(null);
      setSearchQuery("");
      setSearchResults([]);
      fetchProducts();
    } catch (error: any) {
      console.error("Error adding product:", error);
      toast.error(error.message || "Erreur lors de l'ajout");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir retirer ce produit du look ?"))
      return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("look_products")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Produit retiré du look");
      fetchProducts();
    } catch (error: any) {
      console.error("Error deleting product:", error);
      toast.error(error.message || "Erreur lors de la suppression");
    }
  };

  const updateHotspot = async (productId: string, x: number, y: number) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("look_products")
        .update({ hotspot_x: x, hotspot_y: y })
        .eq("id", productId);

      if (error) throw error;
      toast.success("Position mise à jour");
      fetchProducts();
    } catch (error: any) {
      console.error("Error updating hotspot:", error);
      toast.error(error.message || "Erreur lors de la mise à jour");
    }
  };

  if (isLoading || !look) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/looks")}
          size="icon"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{look.title}</h1>
          <p className="text-muted-foreground">
            Gérez les produits de ce look
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Image du Look</span>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un Produit
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Ajouter un Produit au Look</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Rechercher un Produit</Label>
                      <div className="flex gap-2">
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") searchProducts();
                          }}
                          placeholder="Nom du produit..."
                        />
                        <Button onClick={searchProducts} disabled={isSearching}>
                          Rechercher
                        </Button>
                      </div>
                    </div>

                    {searchResults.length > 0 && (
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {searchResults.map((product) => (
                          <div
                            key={product.id}
                            onClick={() => setSelectedProduct(product)}
                            className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                              selectedProduct?.id === product.id
                                ? "border-[#D4AF37] bg-[#D4AF37]/5"
                                : ""
                            }`}
                          >
                            <div className="flex gap-3">
                              {product.images?.[0] && (
                                <img
                                  src={product.images[0].src}
                                  alt={product.name}
                                  className="w-16 h-16 object-cover rounded"
                                />
                              )}
                              <div>
                                <p className="font-semibold">{product.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {product.price}€
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedProduct && (
                      <div className="space-y-2">
                        <Label>Position du Hotspot sur l&apos;Image</Label>
                        <div
                          className="relative aspect-[3/4] rounded-lg overflow-hidden border cursor-crosshair"
                          onClick={handleImageClick}
                        >
                          <img
                            src={look.hero_image_url}
                            alt={look.title}
                            className="w-full h-full object-cover"
                          />
                          <div
                            className="absolute w-8 h-8 rounded-full bg-[#D4AF37] shadow-lg flex items-center justify-center"
                            style={{
                              left: `${hotspotPosition.x}%`,
                              top: `${hotspotPosition.y}%`,
                              transform: "translate(-50%, -50%)",
                            }}
                          >
                            <MapPin className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Cliquez sur l&apos;image pour positionner le hotspot
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={handleAddProduct}
                      disabled={!selectedProduct}
                      className="w-full bg-[#D4AF37] hover:bg-[#B8941F]"
                    >
                      Ajouter au Look
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
              <img
                src={look.hero_image_url}
                alt={look.title}
                className="w-full h-full object-cover"
              />

              {products.map((product) => (
                <div
                  key={product.id}
                  className="absolute w-8 h-8 rounded-full bg-[#D4AF37] shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                  style={{
                    left: `${product.hotspot_x}%`,
                    top: `${product.hotspot_y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  title={product.product_name}
                >
                  <MapPin className="h-4 w-4 text-white" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produits du Look ({products.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun produit ajouté à ce look
              </div>
            ) : (
              <div className="space-y-3">
                {products.map((product, index) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    {product.product_image_url && (
                      <img
                        src={product.product_image_url}
                        alt={product.product_name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">{product.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Position: {product.hotspot_x.toFixed(1)}%,{" "}
                        {product.hotspot_y.toFixed(1)}%
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
