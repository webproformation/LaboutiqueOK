import { createClient } from "@/lib/supabase";
import CategoriesTable from "./categories-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export const revalidate = 0;

async function getCategories() {
  const supabase = createClient();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }

  return categories || [];
}

async function getCategoryProductCounts() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("product_category_mapping")
    .select("category_id");

  if (error) {
    console.error("Error fetching category counts:", error);
    return {};
  }

  const counts: { [key: string]: number } = {};
  data?.forEach((item) => {
    counts[item.category_id] = (counts[item.category_id] || 0) + 1;
  });

  return counts;
}

export default async function CategoriesManagementPage() {
  const categories = await getCategories();
  const productCounts = await getCategoryProductCounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Catégories</h1>
          <p className="text-gray-600 mt-2">
            Gérez vos catégories de produits ({categories.length} catégories)
          </p>
        </div>
        <Link href="/admin/categories-management/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une catégorie
          </Button>
        </Link>
      </div>

      <CategoriesTable categories={categories} productCounts={productCounts} />
    </div>
  );
}
