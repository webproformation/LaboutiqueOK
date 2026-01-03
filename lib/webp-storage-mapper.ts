/**
 * SERVICE DE MAPPING AUTOMATIQUE STORAGE → PRODUITS
 *
 * Ce service scanne le Storage Supabase pour trouver les images WebP
 * et les mappe automatiquement aux produits WooCommerce
 *
 * Pattern de fichier: product-{woocommerce_id}-{timestamp}.webp
 * Exemple: product-532-1735739286597.webp → woocommerce_id = 532
 */

import { supabase } from './supabase-client';

interface WebPImageIndex {
  [woocommerceId: number]: string[]; // Multiple images par produit (galerie)
}

class WebPStorageMapper {
  private imageIndex: WebPImageIndex | null = null;
  private isIndexing: boolean = false;
  private lastIndexTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Scanne le Storage et construit l'index
   */
  private async buildIndex(): Promise<WebPImageIndex> {
    console.log('[WebPMapper] 🔍 Scanning Storage for WebP images...');

    try {
      const { data: files, error } = await supabase.storage
        .from('product-images')
        .list('products', { limit: 1000 });

      if (error) {
        console.error('[WebPMapper] Storage error:', error);
        return {};
      }

      console.log(`[WebPMapper] Found ${files?.length || 0} total files`);

      const webpFiles = files?.filter(f => f.name.endsWith('.webp')) || [];
      console.log(`[WebPMapper] WebP files: ${webpFiles.length}`);

      const index: WebPImageIndex = {};
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (!supabaseUrl) {
        console.error('[WebPMapper] Missing NEXT_PUBLIC_SUPABASE_URL');
        return {};
      }

      webpFiles.forEach(file => {
        // Pattern: product-532-1735739286597.webp
        const match = file.name.match(/^product-(\d+)-\d+\.webp$/);
        if (match) {
          const wooId = parseInt(match[1]);
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/product-images/products/${file.name}`;

          if (!index[wooId]) {
            index[wooId] = [];
          }
          index[wooId].push(publicUrl);
        }
      });

      const productCount = Object.keys(index).length;
      console.log(`[WebPMapper] ✅ Indexed ${productCount} products with WebP images`);
      console.log(`[WebPMapper] Product IDs:`, Object.keys(index).slice(0, 20));

      return index;
    } catch (error) {
      console.error('[WebPMapper] Exception during indexing:', error);
      return {};
    }
  }

  /**
   * Obtient l'index (construit ou met à jour si nécessaire)
   */
  private async getIndex(): Promise<WebPImageIndex> {
    const now = Date.now();
    const cacheExpired = now - this.lastIndexTime > this.CACHE_DURATION;

    // Si on a un index en cache et qu'il n'est pas expiré
    if (this.imageIndex && !cacheExpired) {
      return this.imageIndex;
    }

    // Si on est déjà en train d'indexer, attendre
    if (this.isIndexing) {
      console.log('[WebPMapper] Indexing already in progress, waiting...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.imageIndex || {};
    }

    // Construire l'index
    this.isIndexing = true;
    try {
      this.imageIndex = await this.buildIndex();
      this.lastIndexTime = now;
      return this.imageIndex;
    } finally {
      this.isIndexing = false;
    }
  }

  /**
   * Récupère les images WebP pour un produit donné
   * @param woocommerceId - L'ID WooCommerce du produit
   * @returns Tableau d'URLs WebP (vide si aucune image)
   */
  async getImagesForProduct(woocommerceId: number): Promise<string[]> {
    const index = await this.getIndex();
    const images = index[woocommerceId] || [];

    if (images.length > 0) {
      console.log(`[WebPMapper] ✅ Found ${images.length} WebP image(s) for product ${woocommerceId}`);
    } else {
      console.log(`[WebPMapper] ⚠️  No WebP images for product ${woocommerceId}`);
    }

    return images;
  }

  /**
   * Récupère l'image principale (la première) pour un produit
   * @param woocommerceId - L'ID WooCommerce du produit
   * @returns URL WebP ou null
   */
  async getMainImageForProduct(woocommerceId: number): Promise<string | null> {
    const images = await this.getImagesForProduct(woocommerceId);
    return images.length > 0 ? images[0] : null;
  }

  /**
   * Vérifie si un produit a des images WebP
   */
  async hasWebPImages(woocommerceId: number): Promise<boolean> {
    const images = await this.getImagesForProduct(woocommerceId);
    return images.length > 0;
  }

  /**
   * Efface le cache (utile pour forcer un refresh)
   */
  clearCache() {
    this.imageIndex = null;
    this.lastIndexTime = 0;
    console.log('[WebPMapper] Cache cleared');
  }

  /**
   * Pré-charge l'index en arrière-plan
   */
  async preloadIndex() {
    console.log('[WebPMapper] Preloading index...');
    await this.getIndex();
  }
}

// Instance singleton
export const webpMapper = new WebPStorageMapper();

// Fonction helper pour l'utilisation directe
export async function getWebPImagesForProduct(woocommerceId: number): Promise<string[]> {
  return webpMapper.getImagesForProduct(woocommerceId);
}

export async function getMainWebPImageForProduct(woocommerceId: number): Promise<string | null> {
  return webpMapper.getMainImageForProduct(woocommerceId);
}
