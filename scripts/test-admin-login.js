require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAdminLogin() {
  try {
    console.log('\n========================================');
    console.log('TEST CONNEXION ADMIN WEBPRO');
    console.log('========================================\n');

    console.log('URL Supabase:', supabaseUrl);
    console.log('Email: contact@webproformation.fr');
    console.log('Mot de passe: WebPro2026!\n');

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'contact@webproformation.fr',
      password: 'WebPro2026!'
    });

    if (authError) {
      console.error('❌ ÉCHEC CONNEXION');
      console.error('Message:', authError.message);
      console.error('Status:', authError.status);
      console.error('Code:', authError.code);
      console.error('\nDétails complets:');
      console.error(JSON.stringify(authError, null, 2));
      return;
    }

    if (!authData.user) {
      console.error('❌ Pas de user retourné');
      return;
    }

    console.log('✅ CONNEXION RÉUSSIE\n');
    console.log('User ID:', authData.user.id);
    console.log('Email:', authData.user.email);
    console.log('Email vérifié:', authData.user.email_confirmed_at ? 'Oui' : 'Non');

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Erreur chargement profil:', profileError.message);
      return;
    }

    console.log('\n--- PROFIL ---');
    console.log('Nom complet:', profileData.full_name);
    console.log('Admin:', profileData.is_admin ? 'OUI ✅' : 'NON ❌');
    console.log('Bloqué:', profileData.blocked ? 'OUI ⚠️' : 'NON ✅');
    console.log('Wallet:', profileData.wallet_balance, '€');

    await supabase.auth.signOut();

    console.log('\n========================================');
    console.log('TEST TERMINÉ AVEC SUCCÈS');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ ERREUR INATTENDUE:', error);
  }
}

testAdminLogin();
