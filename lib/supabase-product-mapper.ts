/**
 * SERVICE DE MAPPING PRODUITS SUPABASE
 *
 * Force l'utilisation des images WebP depuis la table products
 * au lieu des URLs WordPress
 */

import { supabase } from './supabase-client';
import { Product } from '@/types';

interface SupabaseProduct {
  woocommerce_id: number;
  image_url: string;
  images: any;
}

// Cache pour éviter les requêtes multiples
const imageCache = new Map<number, string | null>();

/**
 * Récupère l'URL d'image Supabase pour un produit WooCommerce
 * @param woocommerceId - L'ID WooCommerce du produit
 * @returns L'URL Supabase ou null si non trouvée
 */
export async function getSupabaseImageForProduct(woocommerceId: number): Promise<string | null> {
  // Vérifier le cache d'abord
  if (imageCache.has(woocommerceId)) {
    return imageCache.get(woocommerceId) || null;
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('image_url, images')
      .eq('woocommerce_id', woocommerceId)
      .maybeSingle();

    if (error) {
      console.error(`[SupabaseMapper] Error fetching product ${woocommerceId}:`, error);
      imageCache.set(woocommerceId, null);
      return null;
    }

    if (!data) {
      console.warn(`[SupabaseMapper] No product found for WooCommerce ID ${woocommerceId}`);
      imageCache.set(woocommerceId, null);
      return null;
    }

    const imageUrl = data.image_url;

    if (imageUrl) {
      // Cache le résultat
      imageCache.set(woocommerceId, imageUrl);
      console.log(`[SupabaseMapper] ✅ Found Supabase image for product ${woocommerceId}:`, imageUrl);
      return imageUrl;
    }

    imageCache.set(woocommerceId, null);
    return null;
  } catch (error) {
    console.error(`[SupabaseMapper] Exception for product ${woocommerceId}:`, error);
    imageCache.set(woocommerceId, null);
    return null;
  }
}

/**
 * Enrichit un produit WooCommerce avec les images Supabase
 * @param product - Le produit WooCommerce
 * @returns Le produit avec les URLs Supabase si disponibles
 */
export async function enrichProductWithSupabaseImages(product: Product): Promise<Product> {
  const woocommerceId = product.databaseId;

  if (!woocommerceId) {
    console.warn('[SupabaseMapper] Product without databaseId:', product.name);
    return product;
  }

  const supabaseImageUrl = await getSupabaseImageForProduct(woocommerceId);

  if (supabaseImageUrl) {
    console.log(`[MediaMapper] ✅ Success: Swapped WP URL for Supabase WebP for product ID ${woocommerceId} (${product.name})`);
    console.log(`  ❌ Old: ${product.image?.sourceUrl}`);
    console.log(`  ✅ New: ${supabaseImageUrl}`);

    // Remplacer l'URL de l'image principale
    return {
      ...product,
      image: {
        ...product.image,
        sourceUrl: supabaseImageUrl,
      },
    };
  } else {
    console.log(`[MediaMapper] ⚠️  No Supabase image for product ID ${woocommerceId} (${product.name}), using WordPress URL`);
    return product;
  }
}

/**
 * Enrichit plusieurs produits en batch
 * @param products - Liste de produits WooCommerce
 * @returns Liste de produits avec URLs Supabase
 */
export async function enrichProductsWithSupabaseImages(products: Product[]): Promise<Product[]> {
  console.log('[SupabaseMapper] Starting batch enrichment for', products.length, 'products');

  const enrichedProducts = await Promise.all(
    products.map(product => enrichProductWithSupabaseImages(product))
  );

  const successCount = enrichedProducts.filter(p =>
    p.image?.sourceUrl?.includes('supabase.co')
  ).length;

  console.log(`[SupabaseMapper] ✅ Enrichment complete: ${successCount}/${products.length} products using Supabase images`);

  return enrichedProducts;
}

/**
 * Efface le cache (utile pour les tests)
 */
export function clearImageCache() {
  imageCache.clear();
  console.log('[SupabaseMapper] Cache cleared');
}
