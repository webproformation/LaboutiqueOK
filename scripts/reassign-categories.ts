/**
 * 🔧 RÉASSIGNATION AUTOMATIQUE DES CATÉGORIES
 *
 * Ce script corrige les category_id des produits en les mappant vers les vraies catégories
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Mapping WooCommerce ID → Slug de catégorie
const WC_TO_SLUG_MAPPING: Record<number, string> = {
  15: 'beaute-et-senteurs',  // 62 produits - Déodorants, parfums, etc.
  84: 'maquillage',           // 25 produits - Gloss, mascara, etc.
  81: 'maison',               // 15 produits - Mikados, bougies, etc.
  26: 'mode',                 // 11 produits - Vêtements
  // Les WC IDs suivants ont 1 produit chacun et seront traités manuellement:
  // 161, 94, 79, 69
};

async function reassignCategories() {
  console.log('\n🔧 RÉASSIGNATION DES CATÉGORIES\n');
  console.log('═══════════════════════════════════════════════════════\n');

  // 1. Récupérer toutes les catégories
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, name, slug');

  if (catError || !categories) {
    console.error('❌ Erreur lors de la récupération des catégories:', catError);
    return;
  }

  console.log(`✅ ${categories.length} catégories chargées\n`);

  // 2. Créer le mapping WC ID → Category UUID
  const wcToUuidMapping: Record<number, string> = {};

  for (const [wcId, slug] of Object.entries(WC_TO_SLUG_MAPPING)) {
    const category = categories.find(c => c.slug === slug);
    if (category) {
      wcToUuidMapping[Number(wcId)] = category.id;
      console.log(`✅ WC ID ${wcId} → ${category.name} (${category.id})`);
    } else {
      console.error(`❌ Catégorie non trouvée pour slug: ${slug}`);
    }
  }

  console.log('\n');

  // 3. Mettre à jour les produits
  let totalUpdated = 0;
  let totalErrors = 0;

  for (const [wcId, categoryUuid] of Object.entries(wcToUuidMapping)) {
    console.log(`🔄 Traitement WC ID ${wcId}...`);

    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name')
      .eq('woocommerce_category_id', Number(wcId));

    if (fetchError || !products) {
      console.error(`   ❌ Erreur lors de la récupération:`, fetchError);
      totalErrors++;
      continue;
    }

    console.log(`   📦 ${products.length} produits à mettre à jour`);

    for (const product of products) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ category_id: categoryUuid })
        .eq('id', product.id);

      if (updateError) {
        console.error(`   ❌ Erreur sur "${product.name}":`, updateError);
        totalErrors++;
      } else {
        totalUpdated++;
      }
    }

    console.log(`   ✅ WC ID ${wcId} terminé\n`);
  }

  // 4. Résumé
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 RÉSUMÉ DE LA RÉASSIGNATION');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log(`✅ Produits mis à jour : ${totalUpdated}`);
  console.log(`❌ Erreurs : ${totalErrors}\n`);

  // 5. Vérifier les produits restants sans catégorie valide
  const { data: orphanProducts, error: orphanError } = await supabase
    .from('products')
    .select('id, name, woocommerce_category_id, category_id');

  if (!orphanError && orphanProducts) {
    const orphans = orphanProducts.filter(p => {
      const catExists = categories.find(c => c.id === p.category_id);
      return !catExists;
    });

    if (orphans.length > 0) {
      console.log(`⚠️  ${orphans.length} produits restent orphelins :\n`);
      orphans.forEach(p => {
        console.log(`   - ${p.name} (WC ID: ${p.woocommerce_category_id || 'N/A'})`);
      });
      console.log('\n');
    } else {
      console.log('✅ Tous les produits ont maintenant une catégorie valide !\n');
    }
  }
}

reassignCategories();
