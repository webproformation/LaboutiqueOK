import { createClient } from "@/lib/supabase";
import ProductsTable from "./products-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export const revalidate = 0;

async function getProducts() {
  const supabase = createClient();

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  return products || [];
}

async function getCategories() {
  const supabase = createClient();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }

  return categories || [];
}

export default async function ProductsPage() {
  const products = await getProducts();
  const categories = await getCategories();

  console.log(`Found ${products.length} products in database`);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Produits</h1>
          <p className="text-gray-600 mt-2">
            Gérez vos produits ({products.length} produits)
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un produit
          </Button>
        </Link>
      </div>

      <ProductsTable products={products} categories={categories} />
    </div>
  );
}
