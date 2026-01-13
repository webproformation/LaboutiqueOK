/**
 * 🔒 VÉRIFICATION DIRECTE BASE DE DONNÉES - home_categories
 *
 * Ce script contourne les outils MCP potentiellement corrompus
 * et interroge DIRECTEMENT Supabase via @supabase/supabase-js
 *
 * OBJECTIF : Vérifier les vraies données de home_categories sur qcqbtmv
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const EXPECTED_PROJECT_ID = 'qcqbtmvbvipsxwjlgjvk';

function verifyEnvironment() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  🔒 VÉRIFICATION DIRECTE - home_categories RÉEL         ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('❌ ERREUR : Variables d\'environnement manquantes');
    process.exit(1);
  }

  const projectId = url.replace('https://', '').split('.')[0];

  console.log('📋 Configuration détectée:');
  console.log(`   URL: ${url}`);
  console.log(`   Projet ID: ${projectId}`);

  if (projectId !== EXPECTED_PROJECT_ID) {
    console.error(`\n❌ ALERTE SÉCURITÉ : Projet incorrect !`);
    console.error(`   Attendu: ${EXPECTED_PROJECT_ID}`);
    console.error(`   Trouvé: ${projectId}`);
    console.error(`\n⚠️  RISQUE DE CORRUPTION DE DONNÉES\n`);
    process.exit(1);
  }

  console.log(`   ✅ Verrouillage confirmé: ${EXPECTED_PROJECT_ID}\n`);
  console.log('─────────────────────────────────────────────────────────\n');

  return { url, key };
}

async function verifyHomeCategoriesSchema(supabase: any) {
  console.log('🔍 ÉTAPE 1 : Vérification du schéma home_categories\n');

  const { data, error, count } = await supabase
    .from('home_categories')
    .select('*', { count: 'exact' })
    .order('display_order', { ascending: true });

  if (error) {
    console.error('❌ ERREUR lors de la lecture:', error.code);
    console.error('   Message:', error.message);
    console.error('   Details:', error.details);
    return null;
  }

  console.log(`✅ Lecture réussie`);
  console.log(`📊 Nombre total de catégories: ${count}\n`);

  return data;
}

async function verifyActiveCategoriesOnly(supabase: any) {
  console.log('🔍 ÉTAPE 2 : Vérification des catégories actives (is_active=true)\n');

  const { data, error, count } = await supabase
    .from('home_categories')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('❌ ERREUR:', error.code, error.message);
    return null;
  }

  console.log(`✅ Lecture réussie (accès public)`);
  console.log(`📊 Nombre de catégories actives: ${count}\n`);

  return data;
}

function displayCategories(categories: any[], title: string) {
  console.log(`📋 ${title}:\n`);

  if (!categories || categories.length === 0) {
    console.log('   ⚠️  Aucune catégorie trouvée\n');
    return;
  }

  categories.forEach((cat, idx) => {
    console.log(`   ${idx + 1}. ${cat.category_name || cat.name || 'Sans nom'}`);
    console.log(`      ├─ Slug: ${cat.category_slug || cat.slug || 'N/A'}`);
    console.log(`      ├─ Ordre d'affichage: ${cat.display_order}`);
    console.log(`      ├─ Active: ${cat.is_active ? '✓' : '✗'}`);
    console.log(`      ├─ Image: ${cat.image_url ? '✓ ' + cat.image_url.substring(0, 50) + '...' : '✗'}`);
    console.log(`      └─ ID: ${cat.id}`);
    console.log('');
  });
}

async function main() {
  try {
    const { url, key } = verifyEnvironment();

    const supabase = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });

    const allCategories = await verifyHomeCategoriesSchema(supabase);
    if (!allCategories) {
      console.error('\n❌ Impossible de lire la table home_categories\n');
      process.exit(1);
    }

    displayCategories(allCategories, 'TOUTES LES CATÉGORIES (avec inactives)');

    console.log('─────────────────────────────────────────────────────────\n');

    const activeCategories = await verifyActiveCategoriesOnly(supabase);
    if (!activeCategories) {
      console.error('\n❌ Impossible de lire les catégories actives\n');
      process.exit(1);
    }

    displayCategories(activeCategories, 'CATÉGORIES ACTIVES (visibles publiquement)');

    console.log('═════════════════════════════════════════════════════════');
    console.log('✅ VÉRIFICATION TERMINÉE');
    console.log('═════════════════════════════════════════════════════════');

    if (activeCategories.length === 3) {
      console.log('\n✅ CONFIRMATION : 3 catégories actives détectées');
      console.log('   - Ces données sont attendues');
      console.log('   - La configuration est correcte');
    } else {
      console.log(`\n⚠️  ATTENTION : ${activeCategories.length} catégories actives`);
      console.log('   Vérifier si c\'est la configuration attendue');
    }

    console.log('\n🎯 Base de données réelle confirmée: qcqbtmv');
    console.log('💾 Ces données proviennent DIRECTEMENT de Supabase');
    console.log('🚫 Outils MCP contournés pour cette vérification\n');

  } catch (error: any) {
    console.error('\n❌ ERREUR CRITIQUE:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
