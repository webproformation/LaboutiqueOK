require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminSimple() {
  try {
    console.log('\n========================================');
    console.log('CRÉATION ADMIN SIMPLE');
    console.log('========================================\n');

    const email = 'contact@webproformation.fr';
    const password = 'WebPro2026!';

    console.log('1. Inscription normale...');
    const { data: signUpData, error: signUpError } = await supabaseAnon.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: 'Admin WebPro',
          first_name: 'Admin',
          last_name: 'WebPro'
        }
      }
    });

    if (signUpError) {
      console.error('   ❌ Erreur:', signUpError.message);

      if (signUpError.message.includes('already registered')) {
        console.log('\n   Utilisateur existe, recherche...');

        const { data: { users } } = await supabaseService.auth.admin.listUsers();
        const user = users.find(u => u.email === email);

        if (user) {
          console.log('   Trouvé:', user.id);

          console.log('\n2. Mise à jour profil admin...');
          const { error: updateError } = await supabaseService
            .from('profiles')
            .update({ is_admin: true })
            .eq('id', user.id);

          if (updateError) {
            console.error('   ❌ Erreur update:', updateError);
            return;
          }

          console.log('   ✅ Profil mis à jour');

          console.log('\n3. Test connexion...');
          const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
            email: email,
            password: password
          });

          if (signInError) {
            console.error('   ❌ Connexion échouée:', signInError.message);
            console.log('\n   Réinitialisation du mot de passe...');

            const { error: pwdError } = await supabaseService.auth.admin.updateUserById(
              user.id,
              { password: password }
            );

            if (pwdError) {
              console.error('   ❌ Erreur mot de passe:', pwdError);
              return;
            }

            console.log('   ✅ Mot de passe réinitialisé');

            const { error: signInError2 } = await supabaseAnon.auth.signInWithPassword({
              email: email,
              password: password
            });

            if (signInError2) {
              console.error('   ❌ Connexion toujours échouée:', signInError2.message);
              return;
            }

            console.log('   ✅ CONNEXION RÉUSSIE');
            await supabaseAnon.auth.signOut();
          } else {
            console.log('   ✅ CONNEXION RÉUSSIE');
            await supabaseAnon.auth.signOut();
          }

          console.log('\n========================================');
          console.log('✅ COMPTE ADMIN PRÊT');
          console.log('========================================\n');
          return;
        }
      }
      return;
    }

    if (!signUpData.user) {
      console.error('   ❌ Pas de user retourné');
      return;
    }

    console.log('   ✅ Compte créé:', signUpData.user.id);

    console.log('\n2. Attente création profil...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n3. Mise à jour profil admin...');
    const { error: updateError } = await supabaseService
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', signUpData.user.id);

    if (updateError) {
      console.error('   ❌ Erreur:', updateError);
      return;
    }

    console.log('   ✅ Profil admin configuré');

    console.log('\n4. Test connexion...');
    const { error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (signInError) {
      console.error('   ❌ Erreur connexion:', signInError.message);
      return;
    }

    console.log('   ✅ CONNEXION RÉUSSIE');
    await supabaseAnon.auth.signOut();

    console.log('\n========================================');
    console.log('✅ COMPTE ADMIN CRÉÉ ET TESTÉ');
    console.log('========================================');
    console.log('\n🔐 Email: contact@webproformation.fr');
    console.log('🔐 Mot de passe: WebPro2026!\n');

  } catch (error) {
    console.error('\n❌ Erreur:', error);
  }
}

createAdminSimple();
