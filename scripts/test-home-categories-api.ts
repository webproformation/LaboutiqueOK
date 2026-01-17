/**
 * 🧪 TEST API home_categories
 * Vérifier si l'erreur 400 persiste après le NOTIFY pgrst
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testHomeCategories() {
  console.log('\n🧪 TEST API home_categories\n');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log(`🔗 URL: ${SUPABASE_URL}`);
  console.log(`🔑 Using ANON KEY\n`);

  // Test 1 : Fetch simple
  console.log('📝 TEST 1 : Fetch simple (.select("*"))\n');

  const { data: test1, error: error1 } = await supabase
    .from('home_categories')
    .select('*');

  if (error1) {
    console.error('❌ ERREUR TEST 1:', error1);
    console.log('   Code:', error1.code);
    console.log('   Message:', error1.message);
    console.log('   Details:', error1.details);
    console.log('   Hint:', error1.hint);
  } else {
    console.log('✅ TEST 1 RÉUSSI !');
    console.log(`   ${test1?.length || 0} enregistrements trouvés\n`);
    if (test1 && test1.length > 0) {
      console.log('   Premier enregistrement:');
      console.log('   ', JSON.stringify(test1[0], null, 2));
    }
  }

  console.log('\n───────────────────────────────────────────────────────\n');

  // Test 2 : Fetch avec colonnes explicites
  console.log('📝 TEST 2 : Fetch avec colonnes explicites\n');

  const { data: test2, error: error2 } = await supabase
    .from('home_categories')
    .select('id, category_id, display_order, created_at');

  if (error2) {
    console.error('❌ ERREUR TEST 2:', error2);
    console.log('   Code:', error2.code);
    console.log('   Message:', error2.message);
  } else {
    console.log('✅ TEST 2 RÉUSSI !');
    console.log(`   ${test2?.length || 0} enregistrements trouvés`);
  }

  console.log('\n───────────────────────────────────────────────────────\n');

  // Test 3 : Fetch avec JOIN vers categories
  console.log('📝 TEST 3 : Fetch avec JOIN vers categories\n');

  const { data: test3, error: error3 } = await supabase
    .from('home_categories')
    .select(`
      id,
      category_id,
      display_order,
      categories (
        id,
        name,
        slug
      )
    `);

  if (error3) {
    console.error('❌ ERREUR TEST 3:', error3);
    console.log('   Code:', error3.code);
    console.log('   Message:', error3.message);
  } else {
    console.log('✅ TEST 3 RÉUSSI !');
    console.log(`   ${test3?.length || 0} enregistrements trouvés`);
    if (test3 && test3.length > 0) {
      console.log('\n   Exemple avec JOIN:');
      console.log('   ', JSON.stringify(test3[0], null, 2));
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 RÉSUMÉ DES TESTS');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log(`TEST 1 (SELECT *):           ${error1 ? '❌ ÉCHEC' : '✅ RÉUSSI'}`);
  console.log(`TEST 2 (Colonnes explicites): ${error2 ? '❌ ÉCHEC' : '✅ RÉUSSI'}`);
  console.log(`TEST 3 (Avec JOIN):           ${error3 ? '❌ ÉCHEC' : '✅ RÉUSSI'}`);
  console.log('');

  if (!error1 && !error2 && !error3) {
    console.log('🎉 Tous les tests ont réussi ! L\'API est opérationnelle.\n');
  } else {
    console.log('⚠️  Des erreurs persistent. Cache API peut-être non rafraîchi.\n');
  }
}

testHomeCategories();
