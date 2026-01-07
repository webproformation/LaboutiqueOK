require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createWebProAdmin() {
  try {
    console.log('\n🔧 CRÉATION COMPTE ADMIN WEBPRO (qcqbtmvbvipsxwjlgjvk)\n');
    console.log('URL:', supabaseUrl);
    console.log('Email: contact@webproformation.fr');
    console.log('Mot de passe: WebPro2026!\n');

    const { data: existingUser, error: checkError } = await supabase.auth.admin.listUsers();

    const userExists = existingUser?.users?.find(u => u.email === 'contact@webproformation.fr');

    if (userExists) {
      console.log('⚠️  Utilisateur existant trouvé, suppression...');
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userExists.id);
      if (deleteError) {
        console.error('Erreur suppression:', deleteError);
      } else {
        console.log('✅ Utilisateur supprimé');
      }
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'contact@webproformation.fr',
      password: 'WebPro2026!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Admin WebPro',
        first_name: 'Admin',
        last_name: 'WebPro'
      }
    });

    if (authError) {
      console.error('❌ Erreur création auth.users:', authError);
      return;
    }

    console.log('✅ Utilisateur créé dans auth.users');
    console.log('   ID:', authData.user.id);

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: 'contact@webproformation.fr',
        full_name: 'Admin WebPro',
        first_name: 'Admin',
        last_name: 'WebPro',
        is_admin: true,
        blocked: false,
        wallet_balance: 0,
        cancelled_orders_count: 0
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error('❌ Erreur création profil:', profileError);
      return;
    }

    console.log('✅ Profil créé avec is_admin = true');

    const { data: verifyProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (verifyError) {
      console.error('❌ Erreur vérification:', verifyError);
      return;
    }

    console.log('\n✅ COMPTE ADMIN CRÉÉ AVEC SUCCÈS\n');
    console.log('Détails du profil:');
    console.log('  - Email:', verifyProfile.email);
    console.log('  - Nom:', verifyProfile.full_name);
    console.log('  - Admin:', verifyProfile.is_admin);
    console.log('  - Bloqué:', verifyProfile.blocked);
    console.log('\n🔐 Connexion: contact@webproformation.fr / WebPro2026!\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

createWebProAdmin();
