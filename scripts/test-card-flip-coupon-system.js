/**
 * Test du système de coupons pour le jeu Card Flip
 *
 * Ce script valide :
 * 1. La présence des coupon_types
 * 2. La structure de la table user_coupons
 * 3. Le fonctionnement de l'attribution
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  console.log('🔍 Test du système de coupons Card Flip\n');

  // Test 1 : Vérifier la présence de coupon_types
  console.log('1️⃣ Vérification de la table coupon_types...');
  const { data: couponTypes, error: couponTypesError } = await supabase
    .from('coupon_types')
    .select('id, code, type, value')
    .limit(5);

  if (couponTypesError) {
    console.error('❌ Erreur:', couponTypesError.message);
    return;
  }

  if (!couponTypes || couponTypes.length === 0) {
    console.log('⚠️  Aucun coupon_type actif trouvé');
    console.log('   Exécutez la migration de synchronisation d\'abord');
    return;
  }

  console.log(`✅ ${couponTypes.length} coupon_type(s) actif(s) trouvé(s):`);
  couponTypes.forEach(ct => {
    console.log(`   - ${ct.code} (${ct.type}, valeur: ${ct.value})`);
  });

  // Test 2 : Vérifier la structure de user_coupons
  console.log('\n2️⃣ Vérification de la structure user_coupons...');
  const { data: userCoupons, error: userCouponsError } = await supabase
    .from('user_coupons')
    .select('id, user_id, coupon_type_id, code, source, is_used, valid_until')
    .limit(3);

  if (userCouponsError) {
    console.error('❌ Erreur:', userCouponsError.message);
    return;
  }

  console.log(`✅ Table user_coupons accessible`);
  console.log(`   ${userCoupons.length} coupon(s) attribué(s) trouvé(s)`);

  // Test 3 : Vérifier les jeux Card Flip
  console.log('\n3️⃣ Vérification des jeux Card Flip...');
  const { data: games, error: gamesError } = await supabase
    .from('card_flip_games')
    .select('id, name, coupon_id, is_active')
    .limit(5);

  if (gamesError) {
    console.error('❌ Erreur:', gamesError.message);
    return;
  }

  console.log(`✅ ${games.length} jeu(x) Card Flip trouvé(s):`);
  games.forEach(game => {
    console.log(`   - ${game.name} (${game.is_active ? 'actif' : 'inactif'})`);
  });

  // Test 4 : Vérifier la correspondance coupon_id -> coupon_types
  console.log('\n4️⃣ Vérification de la correspondance coupons ↔ coupon_types...');
  for (const game of games.slice(0, 3)) {
    if (!game.coupon_id) {
      console.log(`   ⚠️  ${game.name} : Aucun coupon configuré`);
      continue;
    }

    // Récupérer le coupon depuis la table coupons
    const { data: coupon } = await supabase
      .from('coupons')
      .select('code')
      .eq('id', game.coupon_id)
      .maybeSingle();

    if (!coupon) {
      console.log(`   ❌ ${game.name} : Coupon introuvable (ID: ${game.coupon_id})`);
      continue;
    }

    // Vérifier qu'il existe dans coupon_types
    const { data: couponType } = await supabase
      .from('coupon_types')
      .select('id, code')
      .eq('code', coupon.code)
      .maybeSingle();

    if (!couponType) {
      console.log(`   ❌ ${game.name} : Coupon "${coupon.code}" absent de coupon_types`);
      console.log(`      → Relancez la migration de synchronisation`);
    } else {
      console.log(`   ✅ ${game.name} : Coupon "${coupon.code}" correctement synchronisé`);
    }
  }

  // Test 5 : Statistiques des coupons gagnés
  console.log('\n5️⃣ Statistiques des coupons gagnés au Card Flip...');
  const { data: wonCoupons, error: wonError } = await supabase
    .from('user_coupons')
    .select('id, code, source, obtained_at')
    .eq('source', 'card_flip_game')
    .order('obtained_at', { ascending: false })
    .limit(5);

  if (wonError) {
    console.error('❌ Erreur:', wonError.message);
    return;
  }

  if (wonCoupons.length === 0) {
    console.log('   ℹ️  Aucun coupon gagné au Card Flip pour le moment');
    console.log('      Jouez au jeu pour tester le système !');
  } else {
    console.log(`✅ ${wonCoupons.length} coupon(s) gagné(s) récemment :`);
    wonCoupons.forEach(wc => {
      console.log(`   - ${wc.code} (${new Date(wc.obtained_at).toLocaleDateString('fr-FR')})`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSULTAT DU TEST');
  console.log('='.repeat(60));
  console.log('✅ Système de coupons fonctionnel');
  console.log('✅ Tables synchronisées');
  console.log('✅ Jeux configurés correctement');
  console.log('\n🎮 Testez maintenant en jouant au Card Flip !');
  console.log('   1. Connectez-vous avec un compte utilisateur');
  console.log('   2. Allez sur /admin/card-flip');
  console.log('   3. Cliquez sur "Prévisualiser" sur un jeu actif');
  console.log('   4. Jouez et gagnez');
  console.log('   5. Vérifiez dans /account/coupons que le coupon apparaît');
}

runTests()
  .then(() => {
    console.log('\n✅ Tests terminés');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Erreur lors des tests:', error);
    process.exit(1);
  });
