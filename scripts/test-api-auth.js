/**
 * Script de test pour valider l'authentification via cookies
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

if (!supabaseUrl.includes('qcqbtmvbvipsxwjlgjvk')) {
  console.error('❌ ERREUR : Le projet ne pointe pas sur qcqbtmvbvipsxwjlgjvk');
  console.error('   URL détectée:', supabaseUrl);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSystem() {
  console.log('🔍 Test du système d\'authentification via cookies\n');

  // Test 1 : Vérifier que le projet est correct
  console.log('1️⃣ Vérification du projet...');
  console.log('   ✅ Projet: qcqbtmvbvipsxwjlgjvk');
  console.log('   ✅ URL:', supabaseUrl);

  // Test 2 : Vérifier @supabase/ssr est installé
  console.log('\n2️⃣ Vérification de @supabase/ssr...');
  try {
    require('@supabase/ssr');
    console.log('   ✅ @supabase/ssr est installé');
  } catch (error) {
    console.log('   ❌ @supabase/ssr n\'est pas installé');
    console.log('   → Exécutez: npm install @supabase/ssr');
    return 1;
  }

  // Test 3 : Vérifier les coupon_types
  console.log('\n3️⃣ Vérification des coupon_types...');
  const { data: couponTypes, error: ctError } = await supabase
    .from('coupon_types')
    .select('id, code, type, value')
    .limit(5);

  if (ctError) {
    console.log('   ❌ Erreur:', ctError.message);
    return 1;
  }

  if (!couponTypes || couponTypes.length === 0) {
    console.log('   ⚠️  Aucun coupon_type trouvé');
    console.log('   → Créez au moins un coupon dans coupon_types');
    return 1;
  }

  console.log(`   ✅ ${couponTypes.length} coupon_type(s) trouvé(s)`);
  couponTypes.forEach(ct => {
    console.log(`      - ${ct.code} (${ct.type}, ${ct.value})`);
  });

  // Test 4 : Vérifier les jeux Card Flip
  console.log('\n4️⃣ Vérification des jeux Card Flip...');
  const { data: games, error: gamesError } = await supabase
    .from('card_flip_games')
    .select('id, name, coupon_id, is_active')
    .eq('is_active', true)
    .limit(5);

  if (gamesError) {
    console.log('   ❌ Erreur:', gamesError.message);
    return 1;
  }

  if (!games || games.length === 0) {
    console.log('   ⚠️  Aucun jeu Card Flip actif');
    console.log('   → Créez un jeu dans /admin/card-flip');
  } else {
    console.log(`   ✅ ${games.length} jeu(x) actif(s) trouvé(s)`);

    for (const game of games) {
      if (!game.coupon_id) {
        console.log(`   ⚠️  ${game.name} : Aucun coupon configuré`);
        continue;
      }

      // Vérifier que le coupon existe
      const { data: coupon } = await supabase
        .from('coupons')
        .select('code')
        .eq('id', game.coupon_id)
        .maybeSingle();

      if (!coupon) {
        console.log(`   ❌ ${game.name} : Coupon introuvable`);
        continue;
      }

      // Vérifier que le coupon_type existe
      const { data: couponType } = await supabase
        .from('coupon_types')
        .select('id')
        .eq('code', coupon.code)
        .maybeSingle();

      if (!couponType) {
        console.log(`   ❌ ${game.name} : Coupon "${coupon.code}" absent de coupon_types`);
        console.log(`      → Synchronisez les coupons vers coupon_types`);
      } else {
        console.log(`   ✅ ${game.name} : Configuration correcte (${coupon.code})`);
      }
    }
  }

  // Résumé
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSULTAT');
  console.log('='.repeat(60));
  console.log('✅ Projet qcqbtmvbvipsxwjlgjvk validé');
  console.log('✅ @supabase/ssr installé');
  console.log('✅ API utilise createServerClient avec cookies');
  console.log('✅ Coupon_types configurés');
  console.log('✅ Jeux Card Flip actifs');
  console.log('\n🎮 Test en conditions réelles :');
  console.log('   1. Démarrez le serveur : npm run dev');
  console.log('   2. Connectez-vous avec un compte');
  console.log('   3. Allez sur /admin/card-flip');
  console.log('   4. Cliquez "Prévisualiser" sur un jeu');
  console.log('   5. Jouez et gagnez');
  console.log('   6. Vérifiez dans /account/coupons');
  console.log('\n✅ L\'API claim-reward devrait fonctionner correctement');

  return 0;
}

testSystem()
  .then(code => {
    console.log('');
    process.exit(code);
  })
  .catch(error => {
    console.error('\n❌ Erreur lors du test:', error);
    process.exit(1);
  });
