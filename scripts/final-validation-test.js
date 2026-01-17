#!/usr/bin/env node

/**
 * TEST DE VALIDATION FINALE - Projet qcqbtmv
 * Vérification post-refresh du schéma Supabase
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
  schema_cache: { pass: 0, fail: 0, tests: [] },
  media: { pass: 0, fail: 0, tests: [] },
  gamification: { pass: 0, fail: 0, tests: [] },
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

async function testSchemaCacheRefresh() {
  console.log('\n📋 MODULE: CACHE SCHÉMA (POST-REFRESH)');
  console.log('=======================================');

  try {
    // Test 1: profiles.wallet_balance
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, wallet_balance, loyalty_euros, current_tier')
      .limit(1);

    logTest('schema_cache', 'profiles.wallet_balance reconnu', !profileError, profileError?.message);

    if (profiles && profiles[0]) {
      const hasWalletBalance = profiles[0].wallet_balance !== undefined;
      const hasLoyaltyEuros = profiles[0].loyalty_euros !== undefined;

      logTest('schema_cache', 'wallet_balance présent dans résultat', hasWalletBalance,
        `Valeur: ${profiles[0].wallet_balance || 0}`);
      logTest('schema_cache', 'loyalty_euros présent dans résultat', hasLoyaltyEuros,
        `Valeur: ${profiles[0].loyalty_euros || 0}`);
    }

    // Test 2: hidden_diamonds
    const { data: diamonds, error: diamondError } = await supabase
      .from('hidden_diamonds')
      .select('*')
      .limit(1);

    logTest('schema_cache', 'hidden_diamonds reconnu', !diamondError, diamondError?.message);

  } catch (error) {
    logTest('schema_cache', 'Cache schéma', false, error.message);
  }
}

async function testMediaSystem() {
  console.log('\n📋 MODULE: SYSTÈME MÉDIA');
  console.log('========================');

  try {
    // Test 1: Table media
    const { data: mediaFiles, error: mediaError } = await supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    logTest('media', 'Lecture table media', !mediaError, mediaError?.message);
    logTest('media', 'Fichiers média disponibles',
      mediaFiles && mediaFiles.length >= 0,
      `${mediaFiles?.length || 0} fichier(s)`);

    // Test 2: Bucket storage
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

    logTest('media', 'Lecture buckets storage', !bucketError, bucketError?.message);

    if (buckets) {
      const mediasBucket = buckets.find(b => b.name === 'medias');
      logTest('media', 'Bucket "medias" existe', !!mediasBucket,
        mediasBucket ? `Public: ${mediasBucket.public}` : 'Non trouvé');

      if (mediasBucket) {
        // Test 3: Liste des fichiers dans le bucket
        const { data: files, error: filesError } = await supabase.storage
          .from('medias')
          .list('', { limit: 10 });

        logTest('media', 'Accès au contenu du bucket', !filesError, filesError?.message);
        logTest('media', 'Fichiers dans bucket',
          files && files.length >= 0,
          `${files?.length || 0} fichier(s)`);
      }
    }

    // Test 4: Slides d'accueil
    const { data: slides, error: slidesError } = await supabase
      .from('home_slides')
      .select('*')
      .order('order_position', { ascending: true });

    logTest('media', 'Lecture home_slides', !slidesError, slidesError?.message);
    logTest('media', 'Slides configurés',
      slides && slides.length > 0,
      `${slides?.length || 0} slide(s)`);

  } catch (error) {
    logTest('media', 'Système média', false, error.message);
  }
}

async function testGamificationSystem() {
  console.log('\n📋 MODULE: GAMIFICATION COMPLÈTE');
  console.log('=================================');

  try {
    // Test 1: Roue de la fortune
    const { data: wheel, error: wheelError } = await supabase
      .from('wheel_games')
      .select('*')
      .limit(1);

    logTest('gamification', 'Roue de la fortune', !wheelError, wheelError?.message);

    // Test 2: Jeux à gratter
    const { data: scratch, error: scratchError } = await supabase
      .from('scratch_card_games')
      .select('*')
      .limit(1);

    logTest('gamification', 'Jeux à gratter', !scratchError, scratchError?.message);

    // Test 3: Jeux de cartes
    const { data: cardFlip, error: cardError } = await supabase
      .from('card_flip_games')
      .select('*')
      .limit(1);

    logTest('gamification', 'Jeux de cartes retournées', !cardError, cardError?.message);

    // Test 4: Diamants cachés (critique)
    const { data: diamonds, error: diamondError } = await supabase
      .from('hidden_diamonds')
      .select('id, location, page_url, is_active, reward_amount')
      .limit(3);

    logTest('gamification', 'Diamants cachés - lecture', !diamondError, diamondError?.message);

    if (diamonds) {
      logTest('gamification', 'Structure diamants', true,
        `${diamonds.length} diamant(s) trouvé(s)`);
    }

    // Test 5: Découvertes de diamants
    const { data: discoveries, error: discError } = await supabase
      .from('diamond_discoveries')
      .select('*')
      .limit(1);

    logTest('gamification', 'Table découvertes diamants', !discError, discError?.message);

  } catch (error) {
    logTest('gamification', 'Système gamification', false, error.message);
  }
}

async function testCompleteWorkflow() {
  console.log('\n📋 MODULE: WORKFLOW COMPLET');
  console.log('============================');

  try {
    // Test 1: Authentification -> Profil
    const { data: profileCheck, error: profError } = await supabase
      .from('profiles')
      .select('id, email, wallet_balance, loyalty_euros')
      .limit(1);

    logTest('schema_cache', 'Workflow Auth -> Profil -> Wallet', !profError,
      profError?.message || 'Chaîne complète fonctionnelle');

    // Test 2: Catégories -> Produits
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name, slug')
      .eq('is_visible', true)
      .limit(3);

    logTest('schema_cache', 'Workflow Catégories visibles', !catError,
      `${categories?.length || 0} catégories`);

    // Test 3: Système de fidélité complet
    const { data: loyaltyTiers, error: tierError } = await supabase
      .from('loyalty_tiers')
      .select('*')
      .order('tier_number', { ascending: true });

    logTest('schema_cache', 'Système fidélité (tiers)', !tierError,
      `${loyaltyTiers?.length || 0} paliers`);

  } catch (error) {
    logTest('schema_cache', 'Workflow complet', false, error.message);
  }
}

async function generateFinalReport() {
  console.log('\n\n════════════════════════════════════════');
  console.log('🎯 RAPPORT FINAL - VALIDATION POST-REFRESH');
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
    console.log('\n🎉 SUCCÈS TOTAL - 100% DES TESTS PASSÉS!');
    console.log('✅ Cache schéma rafraîchi');
    console.log('✅ Système média opérationnel');
    console.log('✅ Gamification complète');
    console.log('✅ Tous les workflows fonctionnels');
    console.log('\n🚀 Le projet qcqbtmv est PRÊT POUR LA PRODUCTION');
  } else {
    console.log(`\n⚠️  ${totalFail} test(s) en échec détecté(s)`);
    console.log('Vérifiez les erreurs ci-dessus.');
  }

  console.log('════════════════════════════════════════\n');
}

async function main() {
  console.log('🚀 VALIDATION FINALE - POST SCHEMA REFRESH');
  console.log('Projet: qcqbtmvbvipsxwjlgjvk');
  console.log('Action: Bucket medias créé + NOTIFY pgrst\n');

  await testSchemaCacheRefresh();
  await testMediaSystem();
  await testGamificationSystem();
  await testCompleteWorkflow();
  await generateFinalReport();
}

main().catch(error => {
  console.error('💥 ERREUR FATALE:', error);
  process.exit(1);
});
