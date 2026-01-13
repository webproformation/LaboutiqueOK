const { createClient } = require('@supabase/supabase-js');

// Credentials hardcodés (projet qcqbtmv)
const supabaseUrl = 'https://qcqbtmvbvipsxwjlgjvk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkzMjM2MCwiZXhwIjoyMDgyNTA4MzYwfQ.bNLZkPwV5-wZCGMEkSBMDYI59JK1Z9bSxN8WF5LMPno';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  console.log('🔧 Création d\'un utilisateur admin test...\n');

  const email = 'admin@test-lbdm.fr';
  const password = 'Admin123!LBDM';
  const firstName = 'Admin';
  const lastName = 'Test';

  try {
    // 1. Créer l'utilisateur dans auth.users
    console.log('📝 Création du compte utilisateur...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName
      }
    });

    if (authError) {
      console.error('❌ Erreur lors de la création de l\'utilisateur:', authError.message);
      return;
    }

    console.log('✅ Utilisateur créé avec succès:', authData.user.id);

    // 2. Créer le profil dans la table profiles
    console.log('\n📝 Création du profil...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        is_admin: true,
        wallet_balance: 100.00,
        phone: '+33612345678',
        avatar_url: '',
        birth_date: null,
        blocked: false,
        cancelled_orders_count: 0
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Erreur lors de la création du profil:', profileError.message);
      return;
    }

    console.log('✅ Profil créé avec succès\n');

    // 3. Afficher les informations de connexion
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 COMPTE ADMIN CRÉÉ AVEC SUCCÈS !');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📧 Email     : ' + email);
    console.log('🔑 Password  : ' + password);
    console.log('👤 Nom       : ' + firstName + ' ' + lastName);
    console.log('🛡️  Admin     : Oui');
    console.log('💰 Cagnotte  : 100.00 €');
    console.log('🆔 User ID   : ' + authData.user.id);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✨ Vous pouvez maintenant vous connecter avec ces identifiants !');
    console.log('🔗 URL de connexion : http://localhost:3000/auth/login\n');

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

createAdminUser();
