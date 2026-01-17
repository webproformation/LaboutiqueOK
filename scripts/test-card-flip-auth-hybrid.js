const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testHybridAuth() {
  console.log('🧪 TEST AUTHENTIFICATION HYBRIDE CARD FLIP GAME\n');
  console.log('=' .repeat(60));

  // 1. Login
  console.log('\n1️⃣ Connexion utilisateur...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'webpro@test.com',
    password: 'WebPro2024!Secure'
  });

  if (authError) {
    console.error('❌ Erreur de connexion:', authError.message);
    return;
  }

  console.log('✅ Connecté:', authData.user.email);
  const token = authData.session.access_token;
  console.log('🔑 Token récupéré:', token.substring(0, 20) + '...');

  // 2. Vérifier qu'un coupon type existe
  console.log('\n2️⃣ Vérification des coupon types...');
  const { data: couponTypes, error: couponError } = await supabase
    .from('coupon_types')
    .select('*')
    .limit(1);

  if (couponError || !couponTypes || couponTypes.length === 0) {
    console.error('❌ Aucun coupon type trouvé. Créez-en un dans l\'admin.');
    return;
  }

  const testCoupon = couponTypes[0];
  console.log('✅ Coupon type trouvé:', testCoupon.code);

  // 3. Vérifier qu'un jeu existe
  console.log('\n3️⃣ Vérification des card flip games...');
  const { data: games, error: gameError } = await supabase
    .from('card_flip_games')
    .select('*')
    .eq('is_active', true)
    .limit(1);

  if (gameError || !games || games.length === 0) {
    console.error('❌ Aucun jeu actif trouvé. Créez-en un dans l\'admin.');
    return;
  }

  const testGame = games[0];
  console.log('✅ Jeu trouvé:', testGame.name);

  // 4. Test API - Méthode 1 : Avec Token Bearer (PROD)
  console.log('\n4️⃣ Test API avec Token Bearer (Production)...');

  const responseToken = await fetch(`${supabaseUrl.replace('.supabase.co', '')}.supabase.co/api/games/claim-reward`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      game_type: 'card_flip_game',
      game_id: testGame.id,
      coupon_code: testCoupon.code,
      has_won: true,
    }),
  });

  console.log('📡 Status:', responseToken.status);

  if (responseToken.ok) {
    const result = await responseToken.json();
    console.log('✅ Réponse API:', result);

    if (result.success) {
      console.log('✅ Coupon attribué avec succès !');

      // Vérifier dans la DB
      const { data: userCoupons } = await supabase
        .from('user_coupons')
        .select('*')
        .eq('user_id', authData.user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (userCoupons && userCoupons.length > 0) {
        console.log('✅ Coupon vérifié dans la DB:', userCoupons[0].code);
      }
    } else if (result.already_owned) {
      console.log('ℹ️ Utilisateur possède déjà ce coupon');
    }
  } else {
    const errorText = await responseToken.text();
    console.error('❌ Erreur API:', responseToken.status, errorText);
  }

  // 5. Test des logs
  console.log('\n5️⃣ Logs attendus côté serveur:');
  console.log('   - "[claim-reward] Auth via Token Bearer" (si Cookie échoue)');
  console.log('   - "[claim-reward] Auth via Cookie" (si Cookie fonctionne)');

  console.log('\n' + '='.repeat(60));
  console.log('✅ TEST TERMINÉ\n');

  // Déconnexion
  await supabase.auth.signOut();
}

testHybridAuth().catch(console.error);
