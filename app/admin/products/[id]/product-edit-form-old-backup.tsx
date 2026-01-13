"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { MediaSelector } from "@/components/media-selector";

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
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  display_order: number | null;
}

interface ProductEditFormProps {
  product: Product;
  selectedCategories: string[];
  allCategories: Category[];
}

export default function ProductEditForm({
  product,
  selectedCategories,
  allCategories,
}: ProductEditFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: product.name,
    slug: product.slug,
    description: product.description || "",
    regular_price: product.regular_price,
    sale_price: product.sale_price || "",
    stock_quantity: product.stock_quantity,
    status: product.status,
    image_url: product.image_url || "",
  });
  const [categories, setCategories] = useState<string[]>(selectedCategories);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const supabase = createClient();

      const updateData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        regular_price: parseFloat(formData.regular_price.toString()),
        sale_price: formData.sale_price
          ? parseFloat(formData.sale_price.toString())
          : null,
        stock_quantity: parseInt(formData.stock_quantity.toString()),
        status: formData.status,
        image_url: formData.image_url || null,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", product.id);

      if (updateError) throw updateError;

      const { error: deleteError } = await supabase
        .from("product_category_mapping")
        .delete()
        .eq("product_id", product.id);

      if (deleteError) throw deleteError;

      if (categories.length > 0) {
        const mappings = categories.map((categoryId) => ({
          product_id: product.id,
          category_id: categoryId,
        }));

        const { error: insertError } = await supabase
          .from("product_category_mapping")
          .insert(mappings);

        if (insertError) throw insertError;
      }

      toast.success("Produit mis à jour avec succès");
      router.refresh();
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Erreur lors de la mise à jour du produit");
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const buildCategoryTree = () => {
    const categoryMap = new Map();

    allCategories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    const rootCategories: any[] = [];

    allCategories.forEach((cat) => {
      const node = categoryMap.get(cat.id);
      if (cat.parent_id && categoryMap.has(cat.parent_id)) {
        const parent = categoryMap.get(cat.parent_id);
        parent.children.push(node);
      } else {
        rootCategories.push(node);
      }
    });

    const sortRecursively = (nodes: any[]) => {
      nodes.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      nodes.forEach((node) => {
        if (node.children.length > 0) {
          sortRecursively(node.children);
        }
      });
    };

    sortRecursively(rootCategories);
    return rootCategories;
  };

  const categoryTree = buildCategoryTree();

  const renderCategoryOption = (category: any, level: number = 0): JSX.Element[] => {
    const indent = "  ".repeat(level);
    const result: JSX.Element[] = [
      <div key={category.id} className="space-y-2">
        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg" style={{ marginLeft: `${level * 1.5}rem` }}>
          <Checkbox
            id={`cat-${category.id}`}
            checked={categories.includes(category.id)}
            onCheckedChange={() => toggleCategory(category.id)}
          />
          <Label
            htmlFor={`cat-${category.id}`}
            className={`cursor-pointer ${level === 0 ? 'font-semibold text-base' : 'text-sm'}`}
          >
            {indent}{category.name}
          </Label>
        </div>
      </div>
    ];

    if (category.children && category.children.length > 0) {
      category.children.forEach((child: any) => {
        result.push(...renderCategoryOption(child, level + 1));
      });
    }

    return result;
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center justify-between mb-6">
        <Link href="/admin/products">
          <Button type="button" variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
        <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info">Informations</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nom du produit *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="regular_price">Prix régulier (€) *</Label>
                  <Input
                    id="regular_price"
                    type="number"
                    step="0.01"
                    value={formData.regular_price}
                    onChange={(e) =>
                      setFormData({ ...formData, regular_price: parseFloat(e.target.value) })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="sale_price">Prix promo (€)</Label>
                  <Input
                    id="sale_price"
                    type="number"
                    step="0.01"
                    value={formData.sale_price}
                    onChange={(e) =>
                      setFormData({ ...formData, sale_price: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="publish">Publié</SelectItem>
                    <SelectItem value="draft">Brouillon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Catégories du produit</CardTitle>
            </CardHeader>
            <CardContent>
              {allCategories.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Aucune catégorie disponible
                </p>
              ) : (
                <div className="space-y-2">
                  {categoryTree.map((category) => renderCategoryOption(category))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images">
          <Card>
            <CardHeader>
              <CardTitle>Image du produit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <MediaSelector
                currentImageUrl={formData.image_url}
                onSelect={(imageUrl) =>
                  setFormData({ ...formData, image_url: imageUrl })
                }
                label="Image principale du produit"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock">
          <Card>
            <CardHeader>
              <CardTitle>Gestion du stock</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="stock_quantity">Quantité en stock</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stock_quantity: parseInt(e.target.value) || 0,
                    })
                  }
                  min="0"
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Stock actuel :{" "}
                  <span className="font-bold">{formData.stock_quantity}</span>{" "}
                  unité(s)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  );
}
