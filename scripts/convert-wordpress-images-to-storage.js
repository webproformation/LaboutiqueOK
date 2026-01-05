#!/usr/bin/env node

/**
 * Script de conversion des URLs d'images WordPress vers Supabase Storage
 *
 * Ce script :
 * 1. Parcourt tous les produits et catégories
 * 2. Identifie les URLs WordPress (wp.laboutiquedemorgane.com)
 * 3. Les convertit vers les URLs Supabase Storage
 * 4. Met à jour la base de données
 *
 * IMPORTANT: Ce script ne supprime AUCUNE donnée, il ne fait que convertir les URLs
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase - VERROUILLÉ sur qcqbtmv
const SUPABASE_URL = 'https://qcqbtmvbvipsxwjlgjvk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzIzNjAsImV4cCI6MjA4MjUwODM2MH0.q-4uGaHsuojj3ejo5IG4V-z2fx-ER9grHsRzYNkYn0c';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Configuration WordPress
const WORDPRESS_DOMAIN = 'wp.laboutiquedemorgane.com';
const WORDPRESS_UPLOAD_PATH = '/wp-content/uploads/';

// Configuration Supabase Storage
const STORAGE_BASE_URL = `${SUPABASE_URL}/storage/v1/object/public`;
const PRODUCT_IMAGES_BUCKET = 'product-images';
const CATEGORY_IMAGES_BUCKET = 'category-images';

/**
 * Convertit une URL WordPress en URL Supabase Storage
 * @param {string} wordpressUrl - URL WordPress complète
 * @param {string} bucket - Nom du bucket ('product-images' ou 'category-images')
 * @returns {string|null} - URL Supabase Storage ou null si non convertible
 */
function convertWordPressUrlToStorage(wordpressUrl, bucket) {
  if (!wordpressUrl || typeof wordpressUrl !== 'string') {
    return null;
  }

  // Vérifie si c'est une URL WordPress
  if (!wordpressUrl.includes(WORDPRESS_DOMAIN) && !wordpressUrl.includes(WORDPRESS_UPLOAD_PATH)) {
    // Si c'est déjà une URL Supabase ou autre, on ne change rien
    return wordpressUrl;
  }

  try {
    // Extrait le nom de fichier de l'URL WordPress
    // Exemple: https://wp.laboutiquedemorgane.com/wp-content/uploads/2024/01/image-123.jpg
    // On veut: image-123.jpg
    const urlParts = wordpressUrl.split('/');
    const filename = urlParts[urlParts.length - 1];

    if (!filename) {
      console.warn(`⚠️  Impossible d'extraire le nom de fichier de: ${wordpressUrl}`);
      return wordpressUrl;
    }

    // Construit l'URL Supabase Storage
    const folder = bucket === PRODUCT_IMAGES_BUCKET ? 'products' : 'categories';
    const storageUrl = `${STORAGE_BASE_URL}/${bucket}/${folder}/${filename}`;

    return storageUrl;
  } catch (error) {
    console.error(`❌ Erreur lors de la conversion de l'URL: ${wordpressUrl}`, error);
    return wordpressUrl;
  }
}

/**
 * Convertit les images d'un produit
 * @param {object} product - Objet produit
 * @returns {object} - Produit avec URLs converties
 */
function convertProductImages(product) {
  const updated = { ...product };
  let hasChanges = false;

  // Convertir l'image principale
  if (updated.image_url) {
    const convertedUrl = convertWordPressUrlToStorage(updated.image_url, PRODUCT_IMAGES_BUCKET);
    if (convertedUrl !== updated.image_url) {
      updated.image_url = convertedUrl;
      hasChanges = true;
    }
  }

  // Convertir les images de la galerie (JSONB)
  if (updated.images && Array.isArray(updated.images)) {
    const convertedImages = updated.images.map(img => {
      if (typeof img === 'object' && img !== null) {
        const newImg = { ...img };

        if (img.src) {
          const converted = convertWordPressUrlToStorage(img.src, PRODUCT_IMAGES_BUCKET);
          if (converted !== img.src) {
            newImg.src = converted;
            hasChanges = true;
          }
        }

        if (img.sourceUrl) {
          const converted = convertWordPressUrlToStorage(img.sourceUrl, PRODUCT_IMAGES_BUCKET);
          if (converted !== img.sourceUrl) {
            newImg.sourceUrl = converted;
            hasChanges = true;
          }
        }

        if (img.url) {
          const converted = convertWordPressUrlToStorage(img.url, PRODUCT_IMAGES_BUCKET);
          if (converted !== img.url) {
            newImg.url = converted;
            hasChanges = true;
          }
        }

        return newImg;
      }
      return img;
    });

    if (hasChanges) {
      updated.images = convertedImages;
    }
  }

  return { updated, hasChanges };
}

/**
 * Met à jour les images des produits
 */
async function updateProductImages() {
  console.log('\n📦 Conversion des images produits...');

  try {
    // Récupérer tous les produits
    const { data: products, error } = await supabase
      .from('products')
      .select('id, image_url, images');

    if (error) {
      console.error('❌ Erreur lors de la récupération des produits:', error);
      return;
    }

    console.log(`✅ ${products.length} produits récupérés`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const product of products) {
      const { updated, hasChanges } = convertProductImages(product);

      if (hasChanges) {
        const { error: updateError } = await supabase
          .from('products')
          .update({
            image_url: updated.image_url,
            images: updated.images,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id);

        if (updateError) {
          console.error(`❌ Erreur mise à jour produit ${product.id}:`, updateError);
          errorCount++;
        } else {
          updatedCount++;
          console.log(`✅ Produit ${product.id} converti`);
        }
      }
    }

    console.log(`\n📊 Résumé produits:`);
    console.log(`   - ${updatedCount} produits mis à jour`);
    console.log(`   - ${errorCount} erreurs`);
    console.log(`   - ${products.length - updatedCount - errorCount} produits inchangés`);

  } catch (error) {
    console.error('❌ Erreur globale:', error);
  }
}

/**
 * Met à jour les images des catégories
 */
async function updateCategoryImages() {
  console.log('\n📂 Conversion des images catégories...');

  try {
    // Récupérer toutes les catégories
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, image_url');

    if (error) {
      console.error('❌ Erreur lors de la récupération des catégories:', error);
      return;
    }

    console.log(`✅ ${categories.length} catégories récupérées`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const category of categories) {
      if (!category.image_url) continue;

      const convertedUrl = convertWordPressUrlToStorage(category.image_url, CATEGORY_IMAGES_BUCKET);

      if (convertedUrl !== category.image_url) {
        const { error: updateError } = await supabase
          .from('categories')
          .update({
            image_url: convertedUrl
          })
          .eq('id', category.id);

        if (updateError) {
          console.error(`❌ Erreur mise à jour catégorie ${category.id}:`, updateError);
          errorCount++;
        } else {
          updatedCount++;
          console.log(`✅ Catégorie ${category.id} convertie`);
        }
      }
    }

    console.log(`\n📊 Résumé catégories:`);
    console.log(`   - ${updatedCount} catégories mises à jour`);
    console.log(`   - ${errorCount} erreurs`);
    console.log(`   - ${categories.length - updatedCount - errorCount} catégories inchangées`);

  } catch (error) {
    console.error('❌ Erreur globale:', error);
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Démarrage de la conversion des images WordPress vers Supabase Storage');
  console.log(`📍 Projet: ${SUPABASE_URL}`);
  console.log(`📁 Buckets: ${PRODUCT_IMAGES_BUCKET}, ${CATEGORY_IMAGES_BUCKET}`);
  console.log('');
  console.log('⚠️  AUCUNE DONNÉE NE SERA SUPPRIMÉE - Conversion des URLs uniquement');
  console.log('');

  await updateProductImages();
  await updateCategoryImages();

  console.log('\n✅ Conversion terminée !');
}

// Exécution
main().catch(console.error);
