import { createClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import CategoryForm from "../category-form";

export const revalidate = 0;

async function getCategory(id: string) {
  const supabase = createClient();

  const { data: category, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching category:", error);
    return null;
  }

  return category;
}

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

interface PageProps {
  params: {
    id: string;
  };
}

export default async function EditCategoryPage({ params }: PageProps) {
  const [category, categories] = await Promise.all([
    getCategory(params.id),
    getCategories(),
  ]);

  if (!category) {
    notFound();
  }

  return <CategoryForm category={category} categories={categories} />;
}
