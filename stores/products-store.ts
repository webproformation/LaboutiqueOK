import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/types/product';

interface ProductsStore {
  products: Product[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  toggleProductVisibility: (id: string, visible: boolean) => Promise<void>;
  toggleProductFeatured: (id: string, featured: boolean) => Promise<void>;
}

export const useProductsStore = create<ProductsStore>((set, get) => ({
  products: [],
  categories: [],
  loading: false,
  error: null,

  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      // Récupérer les produits
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      // Récupérer les mappings produit-catégorie
      const { data: mappings, error: mappingsError } = await supabase
        .from('product_category_mapping')
        .select('product_id, category_id');

      if (mappingsError) throw mappingsError;

      // Ajouter les category_ids à chaque produit
      const productsWithCategories = (productsData || []).map((product) => {
        const categoryIds = (mappings || [])
          .filter((m) => m.product_id === product.id)
          .map((m) => m.category_id);

        return {
          ...product,
          category_ids: categoryIds
        };
      });

      set({ products: productsWithCategories, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch products',
        loading: false
      });
    }
  },

  fetchCategories: async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;

      set({ categories: data || [] });
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  },

  deleteProduct: async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        products: state.products.filter(p => p.id !== id)
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete product'
      });
    }
  },

  toggleProductVisibility: async (id: string, visible: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ visible })
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        products: state.products.map(p =>
          p.id === id ? { ...p, visible } : p
        )
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update product'
      });
    }
  },

  toggleProductFeatured: async (id: string, featured: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ featured })
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        products: state.products.map(p =>
          p.id === id ? { ...p, featured } : p
        )
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update product'
      });
    }
  },
}));
