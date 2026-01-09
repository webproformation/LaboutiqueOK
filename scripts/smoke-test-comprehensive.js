#!/usr/bin/env node

/**
 * SMOKE TEST GLOBAL - Projet qcqbtmv
 * Audit complet de tous les modules critiques
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL?.includes('qcqbtmvbvipsxwjlgjvk')) {
  console.error('❌ ERREUR: Mauvais projet détecté!');
  console.error('URL:', SUPABASE_URL);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const results = {
  auth: { pass: 0, fail: 0, tests: [] },
  catalog: { pass: 0, fail: 0, tests: [] },
  orders: { pass: 0, fail: 0, tests: [] },
  admin: { pass: 0, fail: 0, tests: [] },
  marketing: { pass: 0, fail: 0, tests: [] },
  gamification: { pass: 0, fail: 0, tests: [] },
  media: { pass: 0, fail: 0, tests: [] },
};

function logTest(category, testName, success, details = '') {
  const icon = success ? '✅' : '❌';
  console.log(`${icon} ${testName}${details ? ': ' + details : ''}`);

  if (success) {
    results[category].pass++;
  } else {
    results[category].fail++;
  }
  results[category].tests.push({ name: testName, success, details });
}

async function testAuth() {
  console.log('\n📋 MODULE: CLIENT & AUTH');
  console.log('========================');

  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, wallet_balance, loyalty_euros, current_tier')
      .limit(1);

    logTest('auth', 'Lecture table profiles', !error, error?.message);

    if (profiles && profiles[0]) {
      const profile = profiles[0];
      const hasLoyalty = profile.loyalty_euros !== undefined;
      const hasWallet = profile.wallet_balance !== undefined;

      logTest('auth', 'Colonne loyalty_euros', hasLoyalty);
      logTest('auth', 'Colonne wallet_balance', hasWallet);
    }

    const { data: addresses, error: addrError } = await supabase
      .from('addresses')
      .select('*')
      .limit(1);

    logTest('auth', 'Lecture table addresses', !addrError, addrError?.message);

    const { data: measurements, error: measError } = await supabase
      .from('customer_measurements')
      .select('*')
      .limit(1);

    logTest('auth', 'Lecture table customer_measurements', !measError, measError?.message);

  } catch (error) {
    logTest('auth', 'Module AUTH', false, error.message);
  }
}

async function testCatalog() {
  console.log('\n📋 MODULE: CATALOGUE');
  console.log('====================');

  try {
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .limit(3);

    logTest('catalog', 'Lecture categories', !catError, catError?.message);
    logTest('catalog', 'Catégories présentes', categories?.length > 0, `${categories?.length || 0} trouvées`);

    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('id, name, slug, regular_price, sale_price')
      .limit(3);

    logTest('catalog', 'Lecture products', !prodError, prodError?.message);
    logTest('catalog', 'Produits présents', products?.length > 0, `${products?.length || 0} trouvés`);

    const { data: attributes, error: attrError } = await supabase
      .from('product_attributes')
      .select('*')
      .limit(3);

    logTest('catalog', 'Lecture product_attributes', !attrError, attrError?.message);

    const { data: reviews, error: revError } = await supabase
      .from('customer_reviews')
      .select('*')
      .limit(1);

    logTest('catalog', 'Lecture customer_reviews', !revError, revError?.message);

  } catch (error) {
    logTest('catalog', 'Module CATALOGUE', false, error.message);
  }
}

async function testOrders() {
  console.log('\n📋 MODULE: COMMANDES & CHECKOUT');
  console.log('================================');

  try {
    const { data: coupons, error: cpnError } = await supabase
      .from('coupons')
      .select('*')
      .limit(1);

    logTest('orders', 'Lecture coupons', !cpnError, cpnError?.message);

    const { data: loyaltyTiers, error: ltError } = await supabase
      .from('loyalty_tiers')
      .select('*');

    logTest('orders', 'Lecture loyalty_tiers', !ltError, ltError?.message);

    const { data: orders, error: ordError } = await supabase
      .from('orders')
      .select('id, status, total_amount, created_at')
      .limit(1);

    logTest('orders', 'Lecture orders', !ordError, ordError?.message);

    const { data: shipping, error: shipError } = await supabase
      .from('shipping_methods')
      .select('*')
      .limit(3);

    logTest('orders', 'Lecture shipping_methods', !shipError, shipError?.message);

    const { data: payment, error: payError } = await supabase
      .from('payment_methods')
      .select('*')
      .limit(3);

    logTest('orders', 'Lecture payment_methods', !payError, payError?.message);

  } catch (error) {
    logTest('orders', 'Module COMMANDES', false, error.message);
  }
}

async function testAdmin() {
  console.log('\n📋 MODULE: ADMIN LOGISTIQUE');
  console.log('============================');

  try {
    const { data: batches, error: batchError } = await supabase
      .from('delivery_batches')
      .select('*')
      .limit(1);

    logTest('admin', 'Lecture delivery_batches', !batchError, batchError?.message);

    const { data: returns, error: retError } = await supabase
      .from('returns')
      .select('*')
      .limit(1);

    logTest('admin', 'Lecture returns', !retError, retError?.message);

  } catch (error) {
    logTest('admin', 'Module ADMIN', false, error.message);
  }
}

async function testMarketing() {
  console.log('\n📋 MODULE: MARKETING');
  console.log('====================');

  try {
    const { data: slides, error: slideError } = await supabase
      .from('home_slides')
      .select('*')
      .limit(3);

    logTest('marketing', 'Lecture home_slides', !slideError, slideError?.message);

    const { data: looks, error: lookError } = await supabase
      .from('looks')
      .select('*')
      .limit(1);

    logTest('marketing', 'Lecture looks', !lookError, lookError?.message);

    const { data: homeCategories, error: hcError } = await supabase
      .from('home_categories')
      .select('*');

    logTest('marketing', 'Lecture home_categories', !hcError, hcError?.message);

  } catch (error) {
    logTest('marketing', 'Module MARKETING', false, error.message);
  }
}

async function testGamification() {
  console.log('\n📋 MODULE: GAMIFICATION');
  console.log('=======================');

  try {
    const { data: wheel, error: wheelError } = await supabase
      .from('wheel_games')
      .select('*')
      .limit(1);

    logTest('gamification', 'Lecture wheel_games', !wheelError, wheelError?.message);

    const { data: scratch, error: scratchError } = await supabase
      .from('scratch_card_games')
      .select('*')
      .limit(1);

    logTest('gamification', 'Lecture scratch_card_games', !scratchError, scratchError?.message);

    const { data: cardFlip, error: cardError } = await supabase
      .from('card_flip_games')
      .select('*')
      .limit(1);

    logTest('gamification', 'Lecture card_flip_games', !cardError, cardError?.message);

    const { data: diamonds, error: diamError } = await supabase
      .from('hidden_diamonds')
      .select('*')
      .limit(1);

    logTest('gamification', 'Lecture hidden_diamonds', !diamError, diamError?.message);

  } catch (error) {
    logTest('gamification', 'Module GAMIFICATION', false, error.message);
  }
}

async function testMedia() {
  console.log('\n📋 MODULE: MÉDIA');
  console.log('================');

  try {
    const { data: media, error: mediaError } = await supabase
      .from('media')
      .select('*')
      .limit(3);

    logTest('media', 'Lecture media', !mediaError, mediaError?.message);
    logTest('media', 'Fichiers média présents', media?.length > 0, `${media?.length || 0} trouvés`);

    const { data: buckets } = await supabase.storage.listBuckets();
    const mediasBucket = buckets?.find(b => b.name === 'medias');

    logTest('media', 'Bucket "medias" existe', !!mediasBucket);

  } catch (error) {
    logTest('media', 'Module MÉDIA', false, error.message);
  }
}

async function generateReport() {
  console.log('\n\n════════════════════════════════════════');
  console.log('📊 RAPPORT FINAL - SMOKE TEST GLOBAL');
  console.log('════════════════════════════════════════');

  console.log('\n🔒 PROJET VÉRIFIÉ: qcqbtmvbvipsxwjlgjvk ✓\n');

  let totalPass = 0;
  let totalFail = 0;

  Object.entries(results).forEach(([category, data]) => {
    totalPass += data.pass;
    totalFail += data.fail;

    const total = data.pass + data.fail;
    const percentage = total > 0 ? ((data.pass / total) * 100).toFixed(1) : 0;
    const status = data.fail === 0 ? '✅' : '⚠️';

    console.log(`${status} ${category.toUpperCase()}: ${data.pass}/${total} tests réussis (${percentage}%)`);
  });

  console.log('\n════════════════════════════════════════');
  const globalTotal = totalPass + totalFail;
  const globalPercentage = globalTotal > 0 ? ((totalPass / globalTotal) * 100).toFixed(1) : 0;
  console.log(`🎯 RÉSULTAT GLOBAL: ${totalPass}/${globalTotal} tests réussis (${globalPercentage}%)`);

  if (totalFail === 0) {
    console.log('\n✅ TOUS LES TESTS SONT PASSÉS!');
    console.log('Le projet qcqbtmv est opérationnel.');
  } else {
    console.log(`\n⚠️  ${totalFail} test(s) en échec détecté(s)`);
    console.log('Vérifiez les erreurs ci-dessus.');
  }

  console.log('════════════════════════════════════════\n');
}

async function main() {
  console.log('🚀 DÉMARRAGE SMOKE TEST GLOBAL');
  console.log('Projet: qcqbtmvbvipsxwjlgjvk\n');

  await testAuth();
  await testCatalog();
  await testOrders();
  await testAdmin();
  await testMarketing();
  await testGamification();
  await testMedia();
  await generateReport();
}

main().catch(error => {
  console.error('💥 ERREUR FATALE:', error);
  process.exit(1);
});
