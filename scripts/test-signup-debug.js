require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignup() {
  try {
    console.log('\n========================================');
    console.log('TEST INSCRIPTION UTILISATEUR');
    console.log('========================================\n');

    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'Test123456!';

    console.log('Email test:', testEmail);
    console.log('Tentative inscription...\n');

    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
          first_name: 'Test',
          last_name: 'User'
        }
      }
    });

    if (error) {
      console.error('❌ ÉCHEC INSCRIPTION');
      console.error('Message:', error.message);
      console.error('Status:', error.status);
      console.error('Code:', error.code);
      console.error('\nDétails complets:');
      console.error(JSON.stringify(error, null, 2));
      return;
    }

    if (!data.user) {
      console.error('❌ Pas de user retourné');
      return;
    }

    console.log('✅ INSCRIPTION RÉUSSIE');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);

    console.log('\n========================================\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testSignup();
