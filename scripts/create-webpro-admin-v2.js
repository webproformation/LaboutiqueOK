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
    console.log('\n🔧 CRÉATION COMPTE ADMIN WEBPRO V2 (qcqbtmvbvipsxwjlgjvk)\n');

    const email = 'contact@webproformation.fr';
    const password = 'WebPro2026!';

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
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
      console.error('❌ Erreur signUp:', signUpError.message, signUpError.status);

      if (signUpError.message.includes('already registered')) {
        console.log('\n⚠️  Utilisateur déjà existant, tentative de mise à jour du profil...\n');

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (signInError) {
          console.error('❌ Erreur signIn:', signInError.message);
          console.log('Tentative avec le service role key...');

          const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
          if (listError) {
            console.error('❌ Erreur listUsers:', listError);
            return;
          }

          const existingUser = users.find(u => u.email === email);
          if (existingUser) {
            console.log('✅ Utilisateur trouvé:', existingUser.id);

            const { error: updateProfileError } = await supabase
              .from('profiles')
              .update({ is_admin: true })
              .eq('id', existingUser.id);

            if (updateProfileError) {
              console.error('❌ Erreur mise à jour profil:', updateProfileError);
            } else {
              console.log('✅ Profil mis à jour avec is_admin = true');
            }

            const { error: updatePasswordError } = await supabase.auth.admin.updateUserById(
              existingUser.id,
              { password: password }
            );

            if (updatePasswordError) {
              console.error('❌ Erreur mise à jour mot de passe:', updatePasswordError);
            } else {
              console.log('✅ Mot de passe mis à jour');
            }
          }
          return;
        }

        if (signInData?.user) {
          console.log('✅ Connexion réussie, mise à jour du profil...');

          const { error: updateError } = await supabase
            .from('profiles')
            .update({ is_admin: true })
            .eq('id', signInData.user.id);

          if (updateError) {
            console.error('❌ Erreur mise à jour:', updateError);
          } else {
            console.log('✅ Profil mis à jour avec is_admin = true');
          }
        }
        return;
      }
      return;
    }

    console.log('✅ Compte créé:', signUpData.user?.id);

    if (signUpData.user) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          is_admin: true,
          full_name: 'Admin WebPro',
          first_name: 'Admin',
          last_name: 'WebPro'
        })
        .eq('id', signUpData.user.id);

      if (updateError) {
        console.error('❌ Erreur mise à jour profil:', updateError);
      } else {
        console.log('✅ Profil mis à jour avec is_admin = true');
      }
    }

    console.log('\n✅ COMPTE ADMIN CRÉÉ\n');
    console.log('🔐 Connexion: contact@webproformation.fr / WebPro2026!\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

createWebProAdmin();
