import { createClient } from "@supabase/supabase-js";
import CategoriesTable from "./categories-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Plus, FolderTree, ShoppingBag, Eye, EyeOff } from "lucide-react";

export const revalidate = 0;

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

async function getCategories() {
  const supabase = getAdminClient();

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
  const supabase = getAdminClient();

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

  const totalProducts = Object.values(productCounts).reduce((sum, count) => sum + count, 0);
  const rootCategories = categories.filter(cat => !cat.parent_id);
  const subCategories = categories.filter(cat => cat.parent_id);
  const visibleCategories = categories.filter(cat => cat.is_visible !== false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#b8933d] to-[#d4af37] bg-clip-text text-transparent">
            Gestion des Catégories
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Organisez et structurez votre catalogue produits
          </p>
        </div>
        <Link href="/admin/categories-management/new">
          <Button className="bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d] text-white shadow-lg hover:shadow-xl transition-all duration-200">
            <Plus className="h-5 w-5 mr-2" />
            Nouvelle Catégorie
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[#d4af37]/20 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Catégories</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{categories.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#b8933d]/10 to-[#d4af37]/10 rounded-lg flex items-center justify-center">
                <FolderTree className="h-6 w-6 text-[#d4af37]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Catégories Principales</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{rootCategories.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <FolderTree className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sous-catégories</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{subCategories.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <FolderTree className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Produits Assignés</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalProducts}</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <CategoriesTable categories={categories} productCounts={productCounts} />
    </div>
  );
}
