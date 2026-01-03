/**
 * SERVICE DE MAPPING PRODUITS SUPABASE
 *
 * Utilise le Storage Supabase directement pour mapper les images WebP
 * Fallback vers la table products si elle est remplie
 */

import { supabase } from './supabase-client';
import { Product } from '@/types';
import { getMainWebPImageForProduct, getWebPImagesForProduct } from './webp-storage-mapper';

interface SupabaseProduct {
  woocommerce_id: number;
  image_url: string;
  images: any;
}

/**
 * Récupère l'URL d'image Supabase pour un produit WooCommerce
 * PRIORITÉ 1: Storage direct (webp-storage-mapper)
 * PRIORITÉ 2: Table products (si remplie)
 * @param woocommerceId - L'ID WooCommerce du produit
 * @returns L'URL Supabase ou null si non trouvée
 */
export async function getSupabaseImageForProduct(woocommerceId: number): Promise<string | null> {
  // PRIORITÉ 1: Chercher dans le Storage via le mapper
  const webpUrl = await getMainWebPImageForProduct(woocommerceId);
  if (webpUrl) {
    return webpUrl;
  }

  // PRIORITÉ 2: Fallback vers la table products (au cas où elle serait remplie)
  try {
    const { data, error } = await supabase
      .from('products')
      .select('image_url')
      .eq('woocommerce_id', woocommerceId)
      .maybeSingle();

    if (!error && data?.image_url) {
      console.log(`[SupabaseMapper] ✅ Found image in products table for ${woocommerceId}`);
      return data.image_url;
    }
  } catch (error) {
    console.error(`[SupabaseMapper] Exception querying products table:`, error);
  }

  return null;
}

/**
 * Récupère TOUTES les images (galerie) pour un produit
 * @param woocommerceId - L'ID WooCommerce du produit
 * @returns Tableau d'URLs WebP
 */
export async function getSupabaseGalleryForProduct(woocommerceId: number): Promise<string[]> {
  return getWebPImagesForProduct(woocommerceId);
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
