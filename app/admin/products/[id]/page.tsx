import { createClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import ProductEditForm from "./product-edit-form";

export const revalidate = 0;

async function getProduct(id: string) {
  const supabase = createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching product:", error);
    return null;
  }

  return product;
}

async function getProductCategories(productId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("product_category_mapping")
    .select("category_id")
    .eq("product_id", productId);

  if (error) {
    console.error("Error fetching product categories:", error);
    return [];
  }

  return data?.map((d) => d.category_id) || [];
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

export default async function ProductEditPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await getProduct(params.id);

  if (!product) {
    notFound();
  }

  const [selectedCategories, allCategories] = await Promise.all([
    getProductCategories(params.id),
    getCategories(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Modifier le produit</h1>
        <p className="text-gray-600 mt-2">ID: {product.id}</p>
      </div>

      <ProductEditForm
        product={product}
        selectedCategories={selectedCategories}
        allCategories={allCategories}
      />
    </div>
  );
}
