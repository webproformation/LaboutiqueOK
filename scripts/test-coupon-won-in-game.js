require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCouponWonInGame() {
  console.log('🎮 Test: Gagner un coupon aux jeux et vérifier qu\'il apparaît dans /account/coupons\n');

  // 1. Créer un utilisateur de test (ou utiliser un existant)
  const testEmail = 'test-game-' + Date.now() + '@example.com';
  console.log('1. Création utilisateur de test:', testEmail);

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: 'TestPassword123!',
    email_confirm: true,
  });

  if (authError) {
    console.error('❌ Erreur création utilisateur:', authError);
    return;
  }

  const userId = authUser.user.id;
  console.log('✅ Utilisateur créé:', userId);

  // 2. Vérifier qu'un coupon_type existe
  console.log('\n2. Vérification des coupon_types disponibles...');
  const { data: couponTypes, error: ctError } = await supabase
    .from('coupon_types')
    .select('*')
    .limit(3);

  if (ctError || !couponTypes || couponTypes.length === 0) {
    console.error('❌ Aucun coupon_type disponible');
    return;
  }

  console.log('✅ Coupon types disponibles:', couponTypes.map(ct => ct.code).join(', '));
  const testCouponType = couponTypes[0];
  console.log('   Utilisation de:', testCouponType.code);

  // 3. Simuler qu'un utilisateur gagne un coupon (comme dans les jeux)
  console.log('\n3. Attribution du coupon gagné au jeu...');

  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 30);

  const { data: userCoupon, error: ucError } = await supabase
    .from('user_coupons')
    .insert({
      user_id: userId,
      coupon_type_id: testCouponType.id,
      code: testCouponType.code,
      source: 'wheel_game',
      is_used: false,
      valid_until: validUntil.toISOString(),
    })
    .select()
    .single();

  if (ucError) {
    console.error('❌ Erreur attribution coupon:', ucError);
    return;
  }

  console.log('✅ Coupon attribué:', userCoupon.id);

  // 4. Vérifier que le coupon apparaît bien quand on charge /account/coupons
  console.log('\n4. Vérification que le coupon apparaît dans la liste...');

  const { data: myCoupons, error: loadError } = await supabase
    .from('user_coupons')
    .select(`
      *,
      coupon_type:coupon_types!coupon_type_id(
        code,
        type,
        value,
        description
      )
    `)
    .eq('user_id', userId)
    .order('obtained_at', { ascending: false });

  if (loadError) {
    console.error('❌ Erreur chargement coupons:', loadError);
    return;
  }

  console.log('✅ Coupons chargés:', myCoupons.length);

  if (myCoupons.length === 0) {
    console.error('❌ ÉCHEC: Aucun coupon trouvé pour l\'utilisateur');
    return;
  }

  const coupon = myCoupons[0];
  console.log('\n📋 Détails du coupon:');
  console.log('   - Code:', coupon.code);
  console.log('   - Source:', coupon.source);
  console.log('   - Type:', coupon.coupon_type?.type);
  console.log('   - Valeur:', coupon.coupon_type?.value);
  console.log('   - Description:', coupon.coupon_type?.description);
  console.log('   - Utilisé:', coupon.is_used);
  console.log('   - Expire le:', new Date(coupon.valid_until).toLocaleDateString('fr-FR'));

  // 5. Nettoyage
  console.log('\n5. Nettoyage...');
  await supabase.from('user_coupons').delete().eq('user_id', userId);
  await supabase.auth.admin.deleteUser(userId);
  console.log('✅ Nettoyage terminé');

  console.log('\n✅ TEST RÉUSSI: Les coupons gagnés aux jeux apparaissent correctement!');
}

testCouponWonInGame().catch(console.error);
