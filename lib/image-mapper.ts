/**
 * Image URL Mapper - WordPress to Supabase
 *
 * This module provides functions to map WordPress image URLs to Supabase Storage URLs.
 * It automatically replaces WordPress URLs with optimized WebP versions from Supabase.
 */

import { createClient } from '@/lib/supabase-client';

interface MediaLibraryEntry {
  id: string;
  filename: string;
  url: string;
  file_path: string;
  bucket_name: string;
}

let mediaLibraryCache: Map<string, string> | null = null;
let cacheLoadPromise: Promise<void> | null = null;
let lastCacheUpdate = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Extracts the filename (without extension) from a URL
 */
function extractFilenameFromUrl(url: string): string | null {
  try {
    const urlPath = url.split('?')[0];
    const filename = urlPath.split('/').pop();
    if (!filename) return null;

    // Remove extension
    return filename.replace(/\.[^.]+$/, '');
  } catch {
    return null;
  }
}

/**
 * Loads the media library into memory cache
 */
async function loadMediaLibraryCache(): Promise<void> {
  const now = Date.now();

  // If cache is fresh, skip reload
  if (mediaLibraryCache && (now - lastCacheUpdate) < CACHE_DURATION) {
    return;
  }

  // If already loading, wait for that promise
  if (cacheLoadPromise) {
    return cacheLoadPromise;
  }

  cacheLoadPromise = (async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('media_library')
        .select('filename, url, file_path, bucket_name');

      if (error) {
        console.error('Error loading media library cache:', error);
        return;
      }

      if (data) {
        const newCache = new Map<string, string>();

        data.forEach((entry: MediaLibraryEntry) => {
          const baseFilename = extractFilenameFromUrl(entry.filename);
          if (baseFilename) {
            // Store with different extensions as keys
            newCache.set(baseFilename.toLowerCase(), entry.url);

            // Also store with original filename as key
            newCache.set(entry.filename.toLowerCase(), entry.url);
          }
        });

        mediaLibraryCache = newCache;
        lastCacheUpdate = now;
      }
    } catch (error) {
      console.error('Failed to load media library cache:', error);
    } finally {
      cacheLoadPromise = null;
    }
  })();

  return cacheLoadPromise;
}

/**
 * Maps a WordPress image URL to a Supabase Storage URL
 *
 * @param wordpressUrl - The WordPress image URL
 * @returns The Supabase URL if found, otherwise the original URL
 */
export async function mapWordPressImageToSupabase(wordpressUrl: string | null | undefined): Promise<string> {
  // Return empty string for null/undefined
  if (!wordpressUrl) return '';

  // If already a Supabase URL, return as-is
  if (wordpressUrl.includes('supabase')) {
    return wordpressUrl;
  }

  // Load cache if needed
  await loadMediaLibraryCache();

  // If cache not available, return original
  if (!mediaLibraryCache) {
    return wordpressUrl;
  }

  // Extract filename from WordPress URL
  const filename = extractFilenameFromUrl(wordpressUrl);
  if (!filename) {
    return wordpressUrl;
  }

  // Look up in cache (case-insensitive)
  const supabaseUrl = mediaLibraryCache.get(filename.toLowerCase());

  return supabaseUrl || wordpressUrl;
}

/**
 * Maps multiple WordPress image URLs to Supabase URLs
 *
 * @param urls - Array of WordPress image URLs
 * @returns Array of mapped URLs
 */
export async function mapWordPressImagesToSupabase(urls: (string | null | undefined)[]): Promise<string[]> {
  // Load cache once for all URLs
  await loadMediaLibraryCache();

  return Promise.all(urls.map(url => mapWordPressImageToSupabase(url)));
}

/**
 * Hook-friendly synchronous version that returns the original URL immediately
 * and triggers a re-render when the mapped URL is ready
 */
export function useImageMapper(wordpressUrl: string | null | undefined): string {
  if (!wordpressUrl) return '';
  if (wordpressUrl.includes('supabase')) return wordpressUrl;

  // Trigger cache load in background
  loadMediaLibraryCache();

  // If cache is ready, do the mapping
  if (mediaLibraryCache) {
    const filename = extractFilenameFromUrl(wordpressUrl);
    if (filename) {
      const supabaseUrl = mediaLibraryCache.get(filename.toLowerCase());
      if (supabaseUrl) return supabaseUrl;
    }
  }

  // Return original URL as fallback
  return wordpressUrl;
}

/**
 * Preload the media library cache
 * Call this on app initialization
 */
export function preloadMediaLibraryCache(): void {
  loadMediaLibraryCache().catch(console.error);
}

/**
 * Clear the cache (useful for testing or forcing reload)
 */
export function clearMediaLibraryCache(): void {
  mediaLibraryCache = null;
  lastCacheUpdate = 0;
}
