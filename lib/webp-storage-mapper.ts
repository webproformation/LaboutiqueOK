/**
 * SERVICE DE MAPPING AUTOMATIQUE STORAGE → PRODUITS
 *
 * Ce service scanne le Storage Supabase pour trouver les images
 * et les mappe automatiquement aux produits WooCommerce
 *
 * Pattern de fichier: product-{woocommerce_id}-{timestamp}.{ext}
 * Exemple: product-532-1735739286597.webp → woocommerce_id = 532
 * Supporte: .webp, .jpg, .jpeg, .png
 */

import { createClient } from '@supabase/supabase-js';

// CRITIQUE: Utiliser le BON projet Supabase (qcqbtmv) avec les credentials BYPASS
const supabaseUrl = process.env.NEXT_PUBLIC_BYPASS_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.BYPASS_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('[WebPMapper] Missing Supabase credentials!');
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

      // Chercher TOUS les formats d'image (webp, jpg, png)
      const imageFiles = files?.filter(f =>
        f.name.endsWith('.webp') ||
        f.name.endsWith('.jpg') ||
        f.name.endsWith('.jpeg') ||
        f.name.endsWith('.png')
      ) || [];

      const webpCount = files?.filter(f => f.name.endsWith('.webp')).length || 0;
      const jpgCount = files?.filter(f => f.name.endsWith('.jpg') || f.name.endsWith('.jpeg')).length || 0;
      const pngCount = files?.filter(f => f.name.endsWith('.png')).length || 0;

      console.log(`[WebPMapper] Image files breakdown:`);
      console.log(`  - WebP: ${webpCount}`);
      console.log(`  - JPG/JPEG: ${jpgCount}`);
      console.log(`  - PNG: ${pngCount}`);
      console.log(`  - TOTAL: ${imageFiles.length}`);

      const index: WebPImageIndex = {};
      // CRITIQUE: Utiliser le BON projet Supabase (qcqbtmv) pour les URLs publiques
      const publicSupabaseUrl = process.env.NEXT_PUBLIC_BYPASS_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (!publicSupabaseUrl) {
        console.error('[WebPMapper] Missing NEXT_PUBLIC_BYPASS_SUPABASE_URL');
        return {};
      }

      imageFiles.forEach(file => {
        // Pattern: product-532-1735739286597.{ext}
        // Supporte: webp, jpg, jpeg, png
        const match = file.name.match(/^product-(\d+)-\d+\.(webp|jpg|jpeg|png)$/);
        if (match) {
          const wooId = parseInt(match[1]);
          const publicUrl = `${publicSupabaseUrl}/storage/v1/object/public/product-images/products/${file.name}`;

          if (!index[wooId]) {
            index[wooId] = [];
          }
          index[wooId].push(publicUrl);

          // Log de détail pour CHAQUE produit trouvé
          console.log(`[WebPMapper] FOUND: ${file.name} for WooCommerce ID ${wooId}`);
        }
      });

      const productCount = Object.keys(index).length;
      const totalImages = Object.values(index).reduce((sum, imgs) => sum + imgs.length, 0);
      console.log(`[WebPMapper] ✅ Indexed ${productCount} products with ${totalImages} images`);
      console.log(`[WebPMapper] Product IDs (first 30):`, Object.keys(index).slice(0, 30).join(', '));
      console.log(`[WebPMapper] Products with multiple images:`, Object.entries(index).filter(([_, imgs]) => imgs.length > 1).length);

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
      console.log(`[WebPMapper] ✅ Found ${images.length} image(s) for product ${woocommerceId}:`);
      images.forEach((img, i) => {
        const ext = img.split('.').pop();
        console.log(`  ${i + 1}. ${ext?.toUpperCase()} - ${img}`);
      });
    } else {
      console.log(`[WebPMapper] ⚠️  No images found in Supabase for product ${woocommerceId}`);
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
