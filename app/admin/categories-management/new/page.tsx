import { createClient } from "@/lib/supabase";
import CategoryForm from "../category-form";

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

export default async function NewCategoryPage() {
  const categories = await getCategories();

  return <CategoryForm categories={categories} />;
}
