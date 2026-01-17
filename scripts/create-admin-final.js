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

async function createAdminFinal() {
  try {
    console.log('\n🔧 CRÉATION ADMIN FINAL (qcqbtmvbvipsxwjlgjvk)\n');

    const email = 'contact@webproformation.fr';
    const password = 'WebPro2026!';

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('❌ Erreur listUsers:', listError);
      return;
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      console.log('⚠️  Utilisateur existant, suppression...');
      const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id);
      if (deleteError) {
        console.error('❌ Erreur suppression:', deleteError);
        return;
      }
      console.log('✅ Utilisateur supprimé');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('Création du compte avec auth.admin.createUser...');

    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: 'Admin WebPro',
        first_name: 'Admin',
        last_name: 'WebPro'
      }
    });

    if (createError) {
      console.error('❌ Erreur création:', createError.message);
      return;
    }

    if (!userData.user) {
      console.error('❌ Pas de user retourné');
      return;
    }

    console.log('✅ Utilisateur créé dans auth.users');
    console.log('   ID:', userData.user.id);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        is_admin: true,
        full_name: 'Admin WebPro',
        first_name: 'Admin',
        last_name: 'WebPro'
      })
      .eq('id', userData.user.id);

    if (updateError) {
      console.error('❌ Erreur mise à jour profil:', updateError);
      return;
    }

    console.log('✅ Profil mis à jour avec is_admin = true');

    const { data: verifyData, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    if (verifyError) {
      console.error('❌ Erreur vérification:', verifyError);
      return;
    }

    console.log('\n✅ COMPTE ADMIN CRÉÉ ET VÉRIFIÉ\n');
    console.log('Email:', verifyData.email);
    console.log('Nom:', verifyData.full_name);
    console.log('Admin:', verifyData.is_admin);
    console.log('Bloqué:', verifyData.blocked);
    console.log('\n🔐 Connexion: contact@webproformation.fr / WebPro2026!\n');

    console.log('Test de connexion...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (signInError) {
      console.error('❌ Test connexion échoué:', signInError.message);
      return;
    }

    console.log('✅ TEST CONNEXION RÉUSSI !\n');

    await supabase.auth.signOut();

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

createAdminFinal();
