require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createAdminSignup() {
  try {
    console.log('\n🔧 CRÉATION ADMIN via SIGNUP (qcqbtmvbvipsxwjlgjvk)\n');

    const email = 'contact@webproformation.fr';
    const password = 'WebPro2026!';

    console.log('1. Vérification utilisateur existant...');
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error('❌ Erreur listUsers:', listError);
      return;
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      console.log('   ⚠️  Utilisateur trouvé, suppression...');
      await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
      console.log('   ✅ Supprimé');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n2. Création du compte via signUp...');
    const { data: signUpData, error: signUpError } = await supabaseAnon.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: 'Admin WebPro',
          first_name: 'Admin',
          last_name: 'WebPro'
        },
        emailRedirectTo: undefined
      }
    });

    if (signUpError) {
      console.error('   ❌ Erreur signUp:', signUpError.message);
      return;
    }

    if (!signUpData.user) {
      console.error('   ❌ Pas de user retourné');
      return;
    }

    console.log('   ✅ Compte créé, ID:', signUpData.user.id);

    console.log('\n3. Confirmation email...');
    const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
      signUpData.user.id,
      { email_confirm: true }
    );

    if (confirmError) {
      console.error('   ❌ Erreur confirmation:', confirmError);
    } else {
      console.log('   ✅ Email confirmé');
    }

    console.log('\n4. Attente création profil...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n5. Mise à jour profil admin...');
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        is_admin: true,
        full_name: 'Admin WebPro',
        first_name: 'Admin',
        last_name: 'WebPro'
      })
      .eq('id', signUpData.user.id);

    if (updateError) {
      console.error('   ❌ Erreur mise à jour:', updateError);
      return;
    }

    console.log('   ✅ Profil mis à jour');

    console.log('\n6. Vérification profil...');
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', signUpData.user.id)
      .single();

    if (profileError) {
      console.error('   ❌ Erreur vérification:', profileError);
      return;
    }

    console.log('   ✅ Profil vérifié');
    console.log('      - Email:', profileData.email);
    console.log('      - Nom:', profileData.full_name);
    console.log('      - Admin:', profileData.is_admin);

    console.log('\n7. Test de connexion...');
    const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (signInError) {
      console.error('   ❌ Test connexion échoué:', signInError.message);
      return;
    }

    console.log('   ✅ CONNEXION RÉUSSIE !');

    await supabaseAnon.auth.signOut();

    console.log('\n========================================');
    console.log('✅ COMPTE ADMIN CRÉÉ ET TESTÉ');
    console.log('========================================');
    console.log('\n🔐 Identifiants:');
    console.log('   Email: contact@webproformation.fr');
    console.log('   Mot de passe: WebPro2026!\n');

  } catch (error) {
    console.error('\n❌ Erreur:', error);
  }
}

createAdminSignup();
