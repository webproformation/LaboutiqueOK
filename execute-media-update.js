/**
 * EXÉCUTION DE LA MISE À JOUR DÉFINITIVE DES URLs D'IMAGES
 *
 * Ce script utilise le SERVICE_ROLE_KEY pour bypasser RLS
 * et mettre à jour directement les tables products et categories.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// CONFIGURATION AVEC SERVICE_ROLE (bypass RLS)
const SUPABASE_URL = 'https://qcqbtmvbvipsxwjlgjvk.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkzMjM2MCwiZXhwIjoyMDgyNTA4MzYwfQ.mFJHZV-VdueE_okBTqkVh18tRvee94a5Z-k5TM4FQxM';

console.log('═══════════════════════════════════════════════════════════════');
console.log('MISE À JOUR DÉFINITIVE DES URLs D\'IMAGES');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('Projet Supabase:', SUPABASE_URL);
console.log('Mode: SERVICE_ROLE (bypass RLS)');
console.log('');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function executeUpdate() {
  try {
    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, 'update-media-urls-definitive.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Fichier SQL chargé');
    console.log('──────────────────────────────────────────────────────────────');
    console.log('');

    // Extraire les requêtes SQL (on enlève les commentaires pour l'exécution)
    const queries = sqlContent
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('/*') && !q.startsWith('--'));

    console.log(`📊 ${queries.length} requêtes SQL à exécuter`);
    console.log('');

    // ÉTAPE 1: Compter les images produits dans media_library
    console.log('🔍 ÉTAPE 1: Analyse des images produits dans media_library');
    console.log('──────────────────────────────────────────────────────────────');

    const { data: productImages, error: productImagesError } = await supabase
      .from('media_library')
      .select('filename, url')
      .like('filename', 'product-%')
      .eq('bucket_name', 'product-images');

    if (productImagesError) {
      console.error('❌ Erreur:', productImagesError);
      return;
    }

    console.log(`✅ ${productImages.length} images de produits trouvées dans media_library`);

    if (productImages.length > 0) {
      console.log('Exemples:');
      productImages.slice(0, 3).forEach((img, idx) => {
        const productId = img.filename.split('product-')[1]?.split('-')[0];
        console.log(`  [${idx + 1}] ${img.filename} → Product ID: ${productId}`);
      });
    }
    console.log('');

    // ÉTAPE 2: UPDATE des produits
    console.log('🔄 ÉTAPE 2: Mise à jour des produits');
    console.log('──────────────────────────────────────────────────────────────');

    const { data: updateResult, error: updateError } = await supabase.rpc('execute_sql', {
      query: `
        WITH extracted_ids AS (
          SELECT
            id,
            filename,
            url,
            CAST(
              SPLIT_PART(SPLIT_PART(filename, 'product-', 2), '-', 1)
              AS INTEGER
            ) AS product_id
          FROM media_library
          WHERE filename LIKE 'product-%'
            AND bucket_name = 'product-images'
        )
        UPDATE products
        SET
          image_url = extracted_ids.url,
          updated_at = NOW()
        FROM extracted_ids
        WHERE products.id = extracted_ids.product_id
        RETURNING products.id, products.name, products.image_url;
      `
    });

    if (updateError) {
      console.error('❌ Erreur lors de l\'UPDATE:', updateError.message);

      // Essayer une approche alternative sans RPC
      console.log('');
      console.log('🔄 Tentative avec une approche alternative...');

      // Pour chaque image, on trouve le produit correspondant et on update
      let updatedCount = 0;
      for (const img of productImages) {
        const productId = parseInt(img.filename.split('product-')[1]?.split('-')[0]);
        if (!productId) continue;

        const { error: singleUpdateError } = await supabase
          .from('products')
          .update({
            image_url: img.url,
            updated_at: new Date().toISOString()
          })
          .eq('id', productId);

        if (!singleUpdateError) {
          updatedCount++;
        }
      }

      console.log(`✅ ${updatedCount} produits mis à jour avec l'approche alternative`);
    } else {
      console.log(`✅ Produits mis à jour avec succès`);
      if (updateResult && Array.isArray(updateResult)) {
        console.log(`   Nombre de produits affectés: ${updateResult.length}`);
      }
    }
    console.log('');

    // ÉTAPE 3: Compter les images catégories
    console.log('🔍 ÉTAPE 3: Analyse des images catégories dans media_library');
    console.log('──────────────────────────────────────────────────────────────');

    const { data: categoryImages, error: categoryImagesError } = await supabase
      .from('media_library')
      .select('filename, url')
      .like('filename', 'category-%')
      .eq('bucket_name', 'category-images');

    if (categoryImagesError) {
      console.error('❌ Erreur:', categoryImagesError);
      return;
    }

    console.log(`✅ ${categoryImages.length} images de catégories trouvées`);
    console.log('');

    // ÉTAPE 4: UPDATE des catégories (si table existe)
    console.log('🔄 ÉTAPE 4: Mise à jour des catégories');
    console.log('──────────────────────────────────────────────────────────────');

    // Vérifier si la table categories existe
    const { data: tableCheck } = await supabase
      .from('categories')
      .select('id')
      .limit(1);

    if (tableCheck !== null) {
      let categoryUpdatedCount = 0;
      for (const img of categoryImages) {
        const categoryId = parseInt(img.filename.split('category-')[1]?.split('-')[0]);
        if (!categoryId) continue;

        const { error: catUpdateError } = await supabase
          .from('categories')
          .update({
            image_url: img.url,
            updated_at: new Date().toISOString()
          })
          .eq('id', categoryId);

        if (!catUpdateError) {
          categoryUpdatedCount++;
        }
      }

      console.log(`✅ ${categoryUpdatedCount} catégories mises à jour`);
    } else {
      console.log('⚠️  Table categories non trouvée ou vide');
    }
    console.log('');

    // RAPPORT FINAL
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('RAPPORT FINAL');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

    // Compter les produits avec URL Supabase
    const { count: productsWithSupabaseUrl } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .like('image_url', '%supabase.co/storage%');

    console.log(`✅ Produits avec URL Supabase: ${productsWithSupabaseUrl || 0}`);
    console.log(`📊 Images produits disponibles: ${productImages.length}`);
    console.log(`📊 Images catégories disponibles: ${categoryImages.length}`);
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('MISE À JOUR TERMINÉE');
    console.log('═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ ERREUR FATALE:', error);
  }
}

executeUpdate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ ERREUR:', err);
    process.exit(1);
  });
