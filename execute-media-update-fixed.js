/**
 * MISE À JOUR DÉFINITIVE DES URLs D'IMAGES - VERSION CORRIGÉE
 *
 * Utilise woocommerce_id au lieu de id pour le JOIN
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qcqbtmvbvipsxwjlgjvk.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkzMjM2MCwiZXhwIjoyMDgyNTA4MzYwfQ.mFJHZV-VdueE_okBTqkVh18tRvee94a5Z-k5TM4FQxM';

console.log('═══════════════════════════════════════════════════════════════');
console.log('MISE À JOUR DÉFINITIVE - VERSION CORRIGÉE');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('Projet:', SUPABASE_URL);
console.log('Mode: SERVICE_ROLE');
console.log('');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function executeUpdate() {
  try {
    // ÉTAPE 1: Récupérer toutes les images produits
    console.log('🔍 ÉTAPE 1: Récupération des images produits');
    console.log('──────────────────────────────────────────────────────────────');

    const { data: productImages, error: imgError } = await supabase
      .from('media_library')
      .select('filename, url')
      .like('filename', 'product-%')
      .eq('bucket_name', 'product-images');

    if (imgError) {
      console.error('❌ Erreur:', imgError);
      return;
    }

    console.log(`✅ ${productImages.length} images trouvées`);
    console.log('');

    // ÉTAPE 2: Mettre à jour chaque produit
    console.log('🔄 ÉTAPE 2: Mise à jour des produits');
    console.log('──────────────────────────────────────────────────────────────');

    let successCount = 0;
    let failCount = 0;
    const updates = [];

    for (const img of productImages) {
      // Extraire l'ID WooCommerce du nom de fichier
      const match = img.filename.match(/product-(\d+)-/);
      if (!match) {
        failCount++;
        continue;
      }

      const woocommerceId = parseInt(match[1]);

      // Mettre à jour le produit correspondant
      const { data: updateData, error: updateError } = await supabase
        .from('products')
        .update({
          image_url: img.url,
          updated_at: new Date().toISOString()
        })
        .eq('woocommerce_id', woocommerceId)
        .select('woocommerce_id, name, image_url');

      if (updateError) {
        console.error(`❌ Erreur pour produit ${woocommerceId}:`, updateError.message);
        failCount++;
      } else if (updateData && updateData.length > 0) {
        successCount++;
        updates.push({
          woocommerce_id: woocommerceId,
          name: updateData[0].name,
          url: img.url
        });
      } else {
        // Produit non trouvé dans la table
        failCount++;
      }
    }

    console.log(`✅ ${successCount} produits mis à jour avec succès`);
    if (failCount > 0) {
      console.log(`⚠️  ${failCount} images n'ont pas pu être associées`);
    }
    console.log('');

    // Afficher quelques exemples
    if (updates.length > 0) {
      console.log('Exemples de produits mis à jour:');
      updates.slice(0, 5).forEach((u, idx) => {
        console.log(`  [${idx + 1}] WooCommerce ID ${u.woocommerce_id}: ${u.name}`);
        console.log(`      → ${u.url}`);
      });
      console.log('');
    }

    // ÉTAPE 3: Catégories
    console.log('🔍 ÉTAPE 3: Récupération des images catégories');
    console.log('──────────────────────────────────────────────────────────────');

    const { data: categoryImages, error: catImgError } = await supabase
      .from('media_library')
      .select('filename, url')
      .like('filename', 'category-%')
      .eq('bucket_name', 'category-images');

    if (catImgError) {
      console.error('❌ Erreur:', catImgError);
      return;
    }

    console.log(`✅ ${categoryImages.length} images de catégories trouvées`);
    console.log('');

    // ÉTAPE 4: Mettre à jour les catégories
    console.log('🔄 ÉTAPE 4: Mise à jour des catégories');
    console.log('──────────────────────────────────────────────────────────────');

    let catSuccessCount = 0;
    let catFailCount = 0;

    for (const img of categoryImages) {
      const match = img.filename.match(/category-(\d+)-/);
      if (!match) {
        catFailCount++;
        continue;
      }

      const woocommerceCatId = parseInt(match[1]);

      // Vérifier si on a une table categories avec woocommerce_id
      const { data: catUpdateData, error: catUpdateError } = await supabase
        .from('categories')
        .update({
          image_url: img.url,
          updated_at: new Date().toISOString()
        })
        .eq('woocommerce_id', woocommerceCatId)
        .select('woocommerce_id, name');

      if (!catUpdateError && catUpdateData && catUpdateData.length > 0) {
        catSuccessCount++;
      } else {
        catFailCount++;
      }
    }

    console.log(`✅ ${catSuccessCount} catégories mises à jour`);
    if (catFailCount > 0) {
      console.log(`⚠️  ${catFailCount} images de catégories non associées`);
    }
    console.log('');

    // RAPPORT FINAL
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('RAPPORT FINAL');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log(`✅ PRODUITS MIS À JOUR: ${successCount}`);
    console.log(`✅ CATÉGORIES MISES À JOUR: ${catSuccessCount}`);
    console.log(`📊 Total images produits disponibles: ${productImages.length}`);
    console.log(`📊 Total images catégories disponibles: ${categoryImages.length}`);
    console.log('');

    // Vérification finale
    const { count: finalCount } = await supabase
      .from('products')
      .select('woocommerce_id', { count: 'exact', head: true })
      .like('image_url', '%supabase.co/storage%');

    console.log(`🔍 Vérification: ${finalCount} produits ont maintenant une URL Supabase`);
    console.log('');
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
