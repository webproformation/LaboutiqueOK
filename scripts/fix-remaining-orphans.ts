/**
 * 🔧 TRAITEMENT DES PRODUITS ORPHELINS RESTANTS
 *
 * Assigner manuellement les 5 derniers produits orphelins
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

// Mapping manuel des produits orphelins
const MANUAL_ASSIGNMENTS: Record<string, string> = {
  // Format: "nom du produit" → "slug de catégorie"
  'TEST': 'nouveautes',  // Produit test
  'Produit Test à ne pas supprimer': 'nouveautes',  // Produit test
  'Savon Solide Mains IDC Institute Coco 100g | Nettoyant Adoucissant': 'soins-corps-bain',  // WC 94
  'Spray Désinfectant Nettoyant Multi-Surface Tulipán Negro 400ml | Hygiène Totale': 'maison',  // WC 79
  'BASKET LÉO ÉTOILES': 'chaussures',  // WC 69
};

async function fixOrphans() {
  console.log('\n🔧 TRAITEMENT DES PRODUITS ORPHELINS\n');
  console.log('═══════════════════════════════════════════════════════\n');

  // 1. Charger les catégories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug');

  if (!categories) {
    console.error('❌ Impossible de charger les catégories');
    return;
  }

  // 2. Charger les produits orphelins
  const { data: allProducts } = await supabase
    .from('products')
    .select('id, name, category_id');

  if (!allProducts) {
    console.error('❌ Impossible de charger les produits');
    return;
  }

  const orphans = allProducts.filter(p => {
    const catExists = categories.find(c => c.id === p.category_id);
    return !catExists;
  });

  console.log(`📦 ${orphans.length} produits orphelins détectés\n`);

  // 3. Traiter chaque orphelin
  let updated = 0;
  let skipped = 0;

  for (const orphan of orphans) {
    const targetSlug = MANUAL_ASSIGNMENTS[orphan.name];

    if (!targetSlug) {
      console.log(`⚠️  Pas de mapping pour: ${orphan.name}`);
      skipped++;
      continue;
    }

    const targetCategory = categories.find(c => c.slug === targetSlug);

    if (!targetCategory) {
      console.error(`❌ Catégorie "${targetSlug}" introuvable pour: ${orphan.name}`);
      skipped++;
      continue;
    }

    console.log(`🔄 ${orphan.name}`);
    console.log(`   → ${targetCategory.name}`);

    const { error } = await supabase
      .from('products')
      .update({ category_id: targetCategory.id })
      .eq('id', orphan.id);

    if (error) {
      console.error(`   ❌ Erreur:`, error);
      skipped++;
    } else {
      console.log(`   ✅ Mis à jour\n`);
      updated++;
    }
  }

  // 4. Vérification finale
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 RÉSUMÉ FINAL');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log(`✅ Produits mis à jour : ${updated}`);
  console.log(`⚠️  Produits ignorés : ${skipped}\n`);

  // Vérifier s'il reste des orphelins
  const { data: finalCheck } = await supabase
    .from('products')
    .select('id, name, category_id');

  if (finalCheck) {
    const remainingOrphans = finalCheck.filter(p => {
      const catExists = categories.find(c => c.id === p.category_id);
      return !catExists;
    });

    if (remainingOrphans.length === 0) {
      console.log('🎉 SUCCÈS ! Tous les produits ont maintenant une catégorie valide !\n');
    } else {
      console.log(`⚠️  ${remainingOrphans.length} produits orphelins restants :\n`);
      remainingOrphans.forEach(p => {
        console.log(`   - ${p.name}`);
      });
      console.log('\n');
    }
  }
}

fixOrphans();
