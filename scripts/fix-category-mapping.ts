/**
 * 🔧 RÉPARATION DU MAPPING CATÉGORIES
 *
 * Problème détecté : Les produits référencent des category_id fantômes
 * Solution : Mapper via woocommerce_category_id vers les vraies catégories
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

async function analyzeAndFix() {
  console.log('\n🔍 ANALYSE DU MAPPING WOOCOMMERCE → CATÉGORIES\n');
  console.log('═══════════════════════════════════════════════════════\n');

  // 1. Récupérer toutes les catégories
  const { data: categories } = await supabase
    .from('categories')
    .select('*');

  console.log(`📦 Catégories disponibles : ${categories?.length || 0}\n`);

  // 2. Récupérer tous les produits
  const { data: products } = await supabase
    .from('products')
    .select('id, name, category_id, woocommerce_category_id');

  console.log(`🛍️  Produits : ${products?.length || 0}\n`);

  // 3. Analyser les WooCommerce IDs utilisés
  const wcIdUsage = new Map<number, { count: number; currentCategoryId: string; examples: string[] }>();

  if (products) {
    for (const p of products) {
      if (p.woocommerce_category_id) {
        const existing = wcIdUsage.get(p.woocommerce_category_id) || {
          count: 0,
          currentCategoryId: p.category_id || '',
          examples: [] as string[]
        };
        existing.count++;
        if (existing.examples.length < 2 && p.name) {
          (existing.examples as string[]).push(p.name);
        }
        wcIdUsage.set(p.woocommerce_category_id, existing);
      }
    }
  }

  console.log('📊 WOOCOMMERCE IDS UTILISÉS PAR LES PRODUITS :\n');

  const sortedWcIds = Array.from(wcIdUsage.entries()).sort((a, b) => b[1].count - a[1].count);

  sortedWcIds.forEach(([wcId, info]) => {
    const category = categories?.find(c => c.id === info.currentCategoryId);
    console.log(`WC ID ${wcId} → ${info.count} produits`);
    console.log(`   Category UUID actuel : ${info.currentCategoryId}`);
    console.log(`   Existe dans categories : ${category ? `✅ ${category.name}` : '❌ ORPHELIN'}`);
    console.log(`   Exemples : ${info.examples.join(', ')}`);
    console.log('');
  });

  // 4. Vérifier si on peut trouver des correspondances
  console.log('\n🔎 RECHERCHE DE CORRESPONDANCES POSSIBLES\n');

  // Mapping manuel basé sur l'observation des données
  const knownMappings: Record<number, string> = {
    15: 'beaute-et-senteurs',  // Beauté (62 produits)
    26: 'mode',                 // Mode/Vêtements (11 produits)
    81: 'maison',               // Maison (15 produits)
    84: 'maquillage',           // Maquillage (25 produits)
    // Autres à déterminer
  };

  console.log('CORRESPONDANCES SUGGÉRÉES :\n');

  for (const [wcId, info] of sortedWcIds) {
    const suggestedSlug = knownMappings[wcId];
    const matchedCategory = suggestedSlug
      ? categories?.find(c => c.slug === suggestedSlug)
      : null;

    console.log(`WC ID ${wcId} (${info.count} produits):`);

    if (matchedCategory) {
      console.log(`   ✅ MATCH TROUVÉ : ${matchedCategory.name} (${matchedCategory.id})`);
      console.log(`   ACTION : Réassigner vers ${matchedCategory.slug}`);
    } else {
      console.log(`   ⚠️  Correspondance manuelle requise`);
      console.log(`   Exemples de produits :`);
      info.examples.forEach(ex => console.log(`      - ${ex}`));
    }
    console.log('');
  }

  // 5. Proposer l'action
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🛠️  ACTIONS DISPONIBLES :');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('1. Réassignation automatique (mappings connus uniquement)');
  console.log('2. Réassignation complète (avec mapping manuel des inconnus)');
  console.log('3. Rapport uniquement (aucune modification)\n');
  console.log('Pour exécuter, modifier le script et relancer.');
  console.log('\n');
}

analyzeAndFix();
