#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qcqbtmvbvipsxwjlgjvk.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzIzNjAsImV4cCI6MjA4MjUwODM2MH0.q-4uGaHsuojj3ejo5IG4V-z2fx-ER9grHsRzYNkYn0c';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 TEST SYSTÈME user_size - PROJET qcqbtmvbvipsxwjlgjvk\n');
console.log('=' .repeat(60));

async function runTests() {
  let testsPassed = 0;
  let testsFailed = 0;

  console.log('\n📋 Test 1: Vérification colonne user_size dans profiles');
  console.log('-'.repeat(60));

  try {
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_size, email')
      .limit(5);

    if (profileError) {
      console.error('❌ ÉCHEC: Colonne user_size introuvable');
      console.error('   Erreur:', profileError.message);
      testsFailed++;
    } else {
      console.log('✅ SUCCÈS: Colonne user_size existe dans profiles');
      console.log(`   Échantillon: ${profiles.length} profils trouvés`);

      const withSize = profiles.filter(p => p.user_size !== null);
      console.log(`   Profils avec taille définie: ${withSize.length}`);

      if (withSize.length > 0) {
        console.log(`   Exemple: user_size = ${withSize[0].user_size} (${withSize[0].email})`);
      }
      testsPassed++;
    }
  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    testsFailed++;
  }

  console.log('\n📋 Test 2: Vérification table customer_measurements');
  console.log('-'.repeat(60));

  try {
    const { data: measurements, error: measureError } = await supabase
      .from('customer_measurements')
      .select('user_id, height, weight, bust, waist, hips')
      .limit(5);

    if (measureError) {
      console.error('❌ ÉCHEC: Table customer_measurements inaccessible');
      console.error('   Erreur:', measureError.message);
      testsFailed++;
    } else {
      console.log('✅ SUCCÈS: Table customer_measurements accessible');
      console.log(`   ${measurements.length} mensurations enregistrées`);
      testsPassed++;
    }
  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    testsFailed++;
  }

  console.log('\n📋 Test 3: Vérification product_variations avec size_min/size_max');
  console.log('-'.repeat(60));

  try {
    const { data: variations, error: varError } = await supabase
      .from('product_variations')
      .select('id, product_id, size_min, size_max, attributes')
      .not('size_min', 'is', null)
      .not('size_max', 'is', null)
      .limit(10);

    if (varError) {
      console.error('❌ ÉCHEC: Colonnes size_min/size_max introuvables');
      console.error('   Erreur:', varError.message);
      testsFailed++;
    } else {
      console.log('✅ SUCCÈS: Colonnes size_min/size_max existent');
      console.log(`   ${variations.length} variations avec intervalles de taille`);

      if (variations.length > 0) {
        console.log('   Exemples:');
        variations.slice(0, 3).forEach((v, i) => {
          console.log(`     ${i + 1}. Tailles ${v.size_min}-${v.size_max} (Variation ${v.id})`);
        });
      } else {
        console.log('⚠️  AVERTISSEMENT: Aucune variation avec intervalles de taille');
        console.log('   Les badges "Match" ne pourront pas s\'afficher');
      }
      testsPassed++;
    }
  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    testsFailed++;
  }

  console.log('\n📋 Test 4: Simulation correspondance de taille');
  console.log('-'.repeat(60));

  try {
    const testUserSize = 42;

    const { data: matchingVariations, error: matchError } = await supabase
      .from('product_variations')
      .select('id, product_id, size_min, size_max')
      .lte('size_min', testUserSize)
      .gte('size_max', testUserSize)
      .limit(5);

    if (matchError) {
      console.error('❌ ÉCHEC: Requête de correspondance échouée');
      console.error('   Erreur:', matchError.message);
      testsFailed++;
    } else {
      console.log(`✅ SUCCÈS: Recherche de correspondance pour taille ${testUserSize}`);
      console.log(`   ${matchingVariations.length} produits compatibles trouvés`);

      if (matchingVariations.length > 0) {
        console.log('   Produits avec badge "Match" potentiel:');
        matchingVariations.forEach((v, i) => {
          console.log(`     ${i + 1}. Product ID: ${v.product_id} (Tailles ${v.size_min}-${v.size_max})`);
        });
      } else {
        console.log('   ℹ️  Aucun produit compatible pour cette taille de test');
      }
      testsPassed++;
    }
  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    testsFailed++;
  }

  console.log('\n📋 Test 5: Vérification type de données');
  console.log('-'.repeat(60));

  try {
    const { data: typeCheck, error: typeError } = await supabase
      .from('profiles')
      .select('id, user_size')
      .not('user_size', 'is', null)
      .limit(1);

    if (typeError) {
      console.log('⚠️  Aucune donnée pour vérifier le type');
      testsPassed++;
    } else if (typeCheck.length > 0) {
      const userSize = typeCheck[0].user_size;
      const isInteger = Number.isInteger(userSize);

      if (isInteger) {
        console.log('✅ SUCCÈS: user_size est bien un INTEGER');
        console.log(`   Valeur exemple: ${userSize} (type: ${typeof userSize})`);
        testsPassed++;
      } else {
        console.error('❌ ÉCHEC: user_size n\'est pas un INTEGER');
        console.error(`   Valeur: ${userSize} (type: ${typeof userSize})`);
        testsFailed++;
      }
    } else {
      console.log('⚠️  Aucune donnée user_size pour vérifier le type');
      testsPassed++;
    }
  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    testsFailed++;
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSULTATS FINAUX');
  console.log('='.repeat(60));
  console.log(`✅ Tests réussis: ${testsPassed}`);
  console.log(`❌ Tests échoués: ${testsFailed}`);
  console.log(`📈 Taux de réussite: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);

  if (testsFailed === 0) {
    console.log('\n🎉 TOUS LES TESTS SONT PASSÉS !');
    console.log('   Le système user_size est prêt à fonctionner.');
    console.log('   Les badges "Match" s\'afficheront automatiquement.');
  } else {
    console.log('\n⚠️  CERTAINS TESTS ONT ÉCHOUÉ');
    console.log('   Vérifiez les erreurs ci-dessus.');
  }

  console.log('\n💡 PROCHAINES ÉTAPES:');
  console.log('   1. Connectez-vous sur /auth/login');
  console.log('   2. Allez sur /account/measurements');
  console.log('   3. Choisissez votre taille (ex: 42)');
  console.log('   4. Enregistrez');
  console.log('   5. Les badges "Match" apparaîtront sur les produits compatibles');
  console.log('');
}

runTests().catch(console.error);
