/**
 * Script de validation de l'API claim-reward
 *
 * Vérifie que tous les prérequis sont en place pour que l'API fonctionne
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function validateAPI() {
  console.log('🔍 Validation de l\'API claim-reward\n');
  let errors = 0;

  // Test 1 : Vérifier la présence de coupon_types
  console.log('1️⃣ Vérification de coupon_types...');
  const { data: couponTypes, error: ctError } = await supabase
    .from('coupon_types')
    .select('id, code, type, value')
    .limit(5);

  if (ctError) {
    console.error('   ❌ Erreur:', ctError.message);
    errors++;
  } else if (!couponTypes || couponTypes.length === 0) {
    console.log('   ⚠️  ATTENTION: Aucun coupon_type trouvé');
    console.log('   → Créez au moins un coupon dans coupon_types :');
    console.log('');
    console.log('   INSERT INTO coupon_types (code, type, value, description, valid_until)');
    console.log('   VALUES (\'JEUX-5EUR\', \'discount_amount\', 5, \'Réduction de 5€\', \'2026-12-31 23:59:59\');');
    console.log('');
    errors++;
  } else {
    console.log(`   ✅ ${couponTypes.length} coupon_type(s) trouvé(s)`);
    couponTypes.forEach(ct => {
      console.log(`      - ${ct.code} (${ct.type}, ${ct.value})`);
    });
  }

  // Test 2 : Vérifier la contrainte source (test simplifié)
  console.log('\n2️⃣ Vérification de la contrainte source...');

  // Tenter d'insérer un test avec card_flip_game
  const testUserId = '00000000-0000-0000-0000-000000000000';
  const testCouponTypeId = couponTypes && couponTypes.length > 0 ? couponTypes[0].id : null;

  if (testCouponTypeId) {
    const { error: testError } = await supabase
      .from('user_coupons')
      .insert({
        user_id: testUserId,
        coupon_type_id: testCouponTypeId,
        code: 'TEST-VALIDATION-' + Date.now(),
        source: 'card_flip_game',
        valid_until: '2026-12-31 23:59:59',
      })
      .select()
      .then(async (result) => {
        // Nettoyer le test
        if (!result.error && result.data && result.data[0]) {
          await supabase
            .from('user_coupons')
            .delete()
            .eq('id', result.data[0].id);
        }
        return result;
      });

    if (testError) {
      if (testError.message.includes('violates check constraint')) {
        console.log('   ❌ card_flip_game non autorisé dans la contrainte');
        console.log('   → Appliquez la migration add_card_flip_game_source');
        errors++;
      } else {
        console.log('   ⚠️  Erreur lors du test:', testError.message);
      }
    } else {
      console.log('   ✅ Contrainte source correctement configurée');
    }
  } else {
    console.log('   ⚠️  Impossible de tester (aucun coupon_type disponible)');
  }

  // Test 3 : Vérifier les variables d'environnement
  console.log('\n3️⃣ Vérification des variables d\'environnement...');

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log('   ❌ NEXT_PUBLIC_SUPABASE_URL manquante');
    errors++;
  } else {
    console.log('   ✅ NEXT_PUBLIC_SUPABASE_URL définie');
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('   ❌ SUPABASE_SERVICE_ROLE_KEY manquante');
    errors++;
  } else {
    console.log('   ✅ SUPABASE_SERVICE_ROLE_KEY définie');
  }

  // Test 4 : Vérifier les jeux Card Flip
  console.log('\n4️⃣ Vérification des jeux Card Flip...');
  const { data: games, error: gamesError } = await supabase
    .from('card_flip_games')
    .select('id, name, coupon_id, is_active')
    .eq('is_active', true)
    .limit(5);

  if (gamesError) {
    console.error('   ❌ Erreur:', gamesError.message);
    errors++;
  } else if (!games || games.length === 0) {
    console.log('   ⚠️  Aucun jeu Card Flip actif');
    console.log('   → Créez un jeu dans /admin/card-flip');
  } else {
    console.log(`   ✅ ${games.length} jeu(x) actif(s) trouvé(s)`);

    // Vérifier que chaque jeu a un coupon configuré
    for (const game of games) {
      if (!game.coupon_id) {
        console.log(`   ⚠️  ${game.name} : Aucun coupon configuré`);
      } else {
        // Vérifier que le coupon existe
        const { data: coupon } = await supabase
          .from('coupons')
          .select('code')
          .eq('id', game.coupon_id)
          .maybeSingle();

        if (!coupon) {
          console.log(`   ❌ ${game.name} : Coupon introuvable (ID: ${game.coupon_id})`);
          errors++;
        } else {
          // Vérifier que le coupon_type existe
          const { data: couponType } = await supabase
            .from('coupon_types')
            .select('id')
            .eq('code', coupon.code)
            .maybeSingle();

          if (!couponType) {
            console.log(`   ❌ ${game.name} : Coupon "${coupon.code}" absent de coupon_types`);
            errors++;
          } else {
            console.log(`   ✅ ${game.name} : Configuration correcte (${coupon.code})`);
          }
        }
      }
    }
  }

  // Test 5 : Vérifier l'accès aux tables
  console.log('\n5️⃣ Vérification de l\'accès aux tables...');

  const { error: ucError } = await supabase
    .from('user_coupons')
    .select('id')
    .limit(1);

  if (ucError) {
    console.log('   ❌ Impossible d\'accéder à user_coupons:', ucError.message);
    errors++;
  } else {
    console.log('   ✅ Accès à user_coupons OK');
  }

  const { error: ctError2 } = await supabase
    .from('coupon_types')
    .select('id')
    .limit(1);

  if (ctError2) {
    console.log('   ❌ Impossible d\'accéder à coupon_types:', ctError2.message);
    errors++;
  } else {
    console.log('   ✅ Accès à coupon_types OK');
  }

  // Résumé
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSULTAT DE LA VALIDATION');
  console.log('='.repeat(60));

  if (errors === 0) {
    console.log('✅ Tous les prérequis sont en place');
    console.log('✅ L\'API claim-reward devrait fonctionner correctement');
    console.log('\n🎮 Pour tester :');
    console.log('   1. Connectez-vous avec un compte utilisateur');
    console.log('   2. Allez sur /admin/card-flip');
    console.log('   3. Cliquez sur "Prévisualiser" sur un jeu actif');
    console.log('   4. Jouez et gagnez');
    console.log('   5. Vérifiez dans /account/coupons');
    return 0;
  } else {
    console.log(`❌ ${errors} problème(s) détecté(s)`);
    console.log('\n⚠️  Corrigez les erreurs ci-dessus avant de tester l\'API');
    return 1;
  }
}

validateAPI()
  .then(code => {
    console.log('');
    process.exit(code);
  })
  .catch(error => {
    console.error('\n❌ Erreur lors de la validation:', error);
    process.exit(1);
  });
