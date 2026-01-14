"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Edit, Eye, Package, Diamond, Star, Trash2 } from "lucide-react";
import { decodeHtmlEntities } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Product, Category } from "@/types/product";

interface ProductsTableProps {
  products: Product[];
  categories: Category[];
}

export default function ProductsTable({
  products,
  categories,
}: ProductsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [localProducts, setLocalProducts] = useState(products);

  const handleToggleDiamond = async (productId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_diamond: !currentValue })
        .eq("id", productId);

      if (error) throw error;

      setLocalProducts(prev =>
        prev.map(p => p.id === productId ? { ...p, is_diamond: !currentValue } : p)
      );

      toast.success(!currentValue ? "Produit marqué comme diamant" : "Diamant retiré");
    } catch (error) {
      console.error("Error toggling diamond:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleToggleFeatured = async (productId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_featured: !currentValue })
        .eq("id", productId);

      if (error) throw error;

      setLocalProducts(prev =>
        prev.map(p => p.id === productId ? { ...p, is_featured: !currentValue } : p)
      );

      toast.success(!currentValue ? "Produit ajouté aux coups de coeur" : "Produit retiré des coups de coeur");
    } catch (error) {
      console.error("Error toggling featured:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le produit "${decodeHtmlEntities(productName)}" ?\n\nCette action est irréversible.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;

      setLocalProducts(prev => prev.filter(p => p.id !== productId));

      toast.success("Produit supprimé avec succès");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const filteredProducts = useMemo(() => {
    return localProducts.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || product.status === statusFilter;

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "in-stock" && product.stock_quantity > 0) ||
        (stockFilter === "out-of-stock" && product.stock_quantity === 0);

      const matchesCategory =
        categoryFilter === "all" ||
        (categoryFilter === "uncategorized" && (!product.category_ids || product.category_ids.length === 0)) ||
        (product.category_ids && product.category_ids.includes(categoryFilter));

      return matchesSearch && matchesStatus && matchesStock && matchesCategory;
    });
  }, [localProducts, searchTerm, statusFilter, stockFilter, categoryFilter]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-4 md:pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="publish">Publié</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                <SelectItem value="uncategorized">Non catégorisés</SelectItem>
                {categories.filter((cat) => !cat.parent_id).map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {decodeHtmlEntities(category.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les stocks</SelectItem>
                <SelectItem value="in-stock">En stock</SelectItem>
                <SelectItem value="out-of-stock">Rupture</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        {filteredProducts.length} produit(s) trouvé(s)
      </div>

      {/* Products Table - Desktop */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Aucun produit trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Image</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-center w-20">
                      <Diamond className="h-4 w-4 inline" />
                    </TableHead>
                    <TableHead className="text-center w-20">
                      <Star className="h-4 w-4 inline" />
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={decodeHtmlEntities(product.name)}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-500">
                        {product.id}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">
                          {decodeHtmlEntities(product.name)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.slug}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {product.category_ids && product.category_ids.length > 0 ? (
                            product.category_ids.map((catId) => {
                              const category = categories.find(c => c.id === catId);
                              return category ? (
                                <Badge key={catId} variant="outline" className="text-xs">
                                  {decodeHtmlEntities(category.name)}
                                </Badge>
                              ) : null;
                            })
                          ) : (
                            <span className="text-xs text-gray-400 italic">Non catégorisé</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {product.sale_price ? (
                            <>
                              <div className="text-sm line-through text-gray-400">
                                {product.regular_price.toFixed(2)} €
                              </div>
                              <div className="font-medium text-red-600">
                                {product.sale_price.toFixed(2)} €
                              </div>
                            </>
                          ) : (
                            <div className="font-medium">
                              {product.regular_price.toFixed(2)} €
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            product.stock_quantity > 0 ? "default" : "destructive"
                          }
                        >
                          {product.stock_quantity > 0
                            ? `${product.stock_quantity} en stock`
                            : "Rupture"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            product.status === "publish"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {product.status === "publish"
                            ? "Publié"
                            : "Brouillon"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={product.is_diamond || false}
                          onCheckedChange={() => handleToggleDiamond(product.id, product.is_diamond || false)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={product.is_featured || false}
                          onCheckedChange={() => handleToggleFeatured(product.id, product.is_featured || false)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/product/${product.slug}`}>
                            <Button variant="ghost" size="sm" title="Voir le produit">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/admin/products/${product.id}`}>
                            <Button variant="ghost" size="sm" title="Modifier le produit">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Supprimer le produit"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Aucun produit trouvé</p>
            </CardContent>
          </Card>
        ) : (
          filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex gap-3 p-3">
                  {/* Image */}
                  <div className="flex-shrink-0">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={decodeHtmlEntities(product.name)}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">
                        {decodeHtmlEntities(product.name)}
                      </h3>
                      <div className="flex gap-1 flex-shrink-0">
                        {product.is_diamond && (
                          <Diamond className="h-4 w-4 text-[#D4AF37] fill-[#D4AF37]" />
                        )}
                        {product.is_featured && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                    </div>

                    {/* Price & Stock */}
                    <div className="flex items-center gap-3 mb-2">
                      <div>
                        {product.sale_price ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs line-through text-gray-400">
                              {product.regular_price.toFixed(2)}€
                            </span>
                            <span className="font-bold text-red-600">
                              {product.sale_price.toFixed(2)}€
                            </span>
                          </div>
                        ) : (
                          <span className="font-bold text-gray-900">
                            {product.regular_price.toFixed(2)}€
                          </span>
                        )}
                      </div>
                      <Badge
                        variant={product.stock_quantity > 0 ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {product.stock_quantity > 0 ? `Stock: ${product.stock_quantity}` : "Rupture"}
                      </Badge>
                    </div>

                    {/* Categories */}
                    {product.category_ids && product.category_ids.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {product.category_ids.slice(0, 2).map((catId) => {
                          const category = categories.find(c => c.id === catId);
                          return category ? (
                            <Badge key={catId} variant="outline" className="text-[10px] px-1.5 py-0">
                              {decodeHtmlEntities(category.name)}
                            </Badge>
                          ) : null;
                        })}
                        {product.category_ids.length > 2 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            +{product.category_ids.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Status */}
                    <Badge
                      variant={product.status === "publish" ? "default" : "secondary"}
                      className="text-xs mb-3"
                    >
                      {product.status === "publish" ? "Publié" : "Brouillon"}
                    </Badge>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link href={`/product/${product.slug}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full h-11">
                          <Eye className="h-4 w-4 mr-2" />
                          Voir
                        </Button>
                      </Link>
                      <Link href={`/admin/products/${product.id}`} className="flex-1">
                        <Button variant="default" size="sm" className="w-full h-11 bg-blue-600 hover:bg-blue-700">
                          <Edit className="h-4 w-4 mr-2" />
                          Éditer
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id, product.name)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-11 w-11 flex-shrink-0"
                        title="Supprimer"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
