"use client";

import { useEffect } from "react";
import { useProductsStore } from "@/stores/products-store";
import ProductsTable from "./products-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, RefreshCw } from "lucide-react";

export default function ProductsClientWrapper() {
  const { products, categories, loading, error, fetchProducts, fetchCategories } = useProductsStore();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-gray-600">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erreur: {error}</p>
        <Button
          onClick={() => fetchProducts()}
          className="mt-2"
          variant="outline"
        >
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-0">
      {/* Header - Responsive */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Produits</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">
            Gérez vos produits ({products.length} produits)
          </p>
        </div>
        <div className="hidden md:flex gap-2">
          <Button
            onClick={() => fetchProducts()}
            variant="outline"
            className="border-gray-300"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Link href="/admin/products/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un produit
            </Button>
          </Link>
        </div>
      </div>

      <ProductsTable products={products} categories={categories} />

      {/* Floating Action Buttons - Mobile Only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-lg z-40 flex gap-2">
        <Button
          onClick={() => fetchProducts()}
          variant="outline"
          className="flex-1 h-12 border-gray-300"
        >
          <RefreshCw className="h-5 w-5 mr-2" />
          Actualiser
        </Button>
        <Link href="/admin/products/new" className="flex-1">
          <Button className="bg-blue-600 hover:bg-blue-700 w-full h-12">
            <Plus className="h-5 w-5 mr-2" />
            Ajouter
          </Button>
        </Link>
      </div>
    </div>
  );
}
