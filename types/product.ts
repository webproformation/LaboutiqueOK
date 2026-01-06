export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string | null;
  price: number;
  regular_price: number;
  sale_price: number | null;
  stock_quantity: number;
  stock_status: string;
  status: string;
  sku: string | null;
  featured: boolean;
  visible: boolean;
  image_url: string | null;
  gallery_images: string[] | null;
  category_ids: string[] | null;
  is_diamond: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  image_url: string | null;
  display_order: number;
  meta_title: string | null;
  meta_description: string | null;
  seo_keywords: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}
