#!/usr/bin/env node

/**
 * Test Script - Auth Signup & Login
 * Projet: qcqbtmvbvipsxwjlgjvk
 *
 * Teste la création de compte et la connexion après correction du trigger
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

if (!SUPABASE_URL.includes('qcqbtmvbvipsxwjlgjvk')) {
  console.error('❌ ERREUR: Mauvais projet détecté!');
  console.error('URL:', SUPABASE_URL);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSignup() {
  console.log('\n🧪 TEST SIGNUP');
  console.log('===============');

  const testEmail = `test-${Date.now()}@laboutiquedemorgane.com`;
  const testPassword = 'TestPassword123!';

  console.log('📧 Email:', testEmail);
  console.log('🔑 Password:', testPassword);

  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
          first_name: 'Test',
          last_name: 'User',
          phone: '0601020304',
          birth_date: '1990-01-01',
        },
      },
    });

    if (error) {
      console.error('❌ ERREUR SIGNUP:', error.message);
      console.error('Status:', error.status);
      console.error('Code:', error.code);
      return null;
    }

    if (!data.user) {
      console.error('❌ Pas d\'utilisateur créé');
      return null;
    }

    console.log('✅ Utilisateur créé:', data.user.id);

    // Attendre que le trigger crée le profil
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Vérifier que le profil a été créé
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('❌ Erreur récupération profil:', profileError.message);
      return data.user;
    }

    if (!profile) {
      console.error('❌ Profil non créé par le trigger!');
      return data.user;
    }

    console.log('✅ Profil créé avec succès');
    console.log('   - Email:', profile.email);
    console.log('   - Nom complet:', profile.full_name);
    console.log('   - Wallet:', profile.wallet_balance, '€');
    console.log('   - Loyalty:', profile.loyalty_euros, '€');
    console.log('   - Tier:', profile.current_tier);
    console.log('   - Multiplier:', profile.tier_multiplier);

    return data.user;

  } catch (error) {
    console.error('❌ EXCEPTION:', error.message);
    return null;
  }
}

async function testLogin(email, password) {
  console.log('\n🧪 TEST LOGIN');
  console.log('===============');
  console.log('📧 Email:', email);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ ERREUR LOGIN:', error.message);
      console.error('Status:', error.status);
      console.error('Code:', error.code);
      return false;
    }

    if (!data.user) {
      console.error('❌ Pas d\'utilisateur connecté');
      return false;
    }

    console.log('✅ Connexion réussie:', data.user.id);

    // Vérifier le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('❌ Erreur récupération profil:', profileError.message);
      return false;
    }

    console.log('✅ Profil chargé');
    console.log('   - Nom:', profile.full_name);
    console.log('   - Admin:', profile.is_admin);

    return true;

  } catch (error) {
    console.error('❌ EXCEPTION:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔒 PROJET:', SUPABASE_URL.includes('qcqbtmvbvipsxwjlgjvk') ? 'qcqbtmv ✓' : 'ERREUR');

  // Test 1: Signup
  const user = await testSignup();
  if (!user) {
    console.log('\n❌ TEST ÉCHOUÉ: Signup');
    process.exit(1);
  }

  // Test 2: Login avec le compte créé
  const testEmail = user.email;
  const testPassword = 'TestPassword123!';

  // Se déconnecter d'abord
  await supabase.auth.signOut();
  await new Promise(resolve => setTimeout(resolve, 1000));

  const loginSuccess = await testLogin(testEmail, testPassword);
  if (!loginSuccess) {
    console.log('\n❌ TEST ÉCHOUÉ: Login');
    process.exit(1);
  }

  console.log('\n✅ TOUS LES TESTS RÉUSSIS');
  console.log('==================');
  console.log('✓ Signup fonctionne');
  console.log('✓ Trigger crée le profil avec toutes les colonnes');
  console.log('✓ Login fonctionne');
  console.log('✓ Profil chargé correctement');
}

main().catch(error => {
  console.error('💥 ERREUR FATALE:', error);
  process.exit(1);
});
