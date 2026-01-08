const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function validateUser(email) {
  console.log(`\n🔍 Recherche de l'utilisateur : ${email}\n`);

  const { data: users, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('❌ Erreur:', listError);
    return;
  }

  const user = users.users.find(u => u.email === email);

  if (!user) {
    console.log('⚠️ Utilisateur non trouvé');
    return;
  }

  console.log('✅ Utilisateur trouvé:');
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Confirmé: ${user.email_confirmed_at ? 'OUI' : 'NON'}`);
  console.log(`   Créé: ${user.created_at}`);

  if (user.email_confirmed_at) {
    console.log('\n✅ Compte déjà validé!');
    return;
  }

  console.log('\n🔄 Validation du compte en cours...');

  const { data, error } = await supabase.auth.admin.updateUserById(
    user.id,
    { email_confirm: true }
  );

  if (error) {
    console.error('❌ Erreur validation:', error);
  } else {
    console.log('✅ Compte validé avec succès!');
    console.log(`   Email confirmé: ${data.user.email_confirmed_at}`);
  }
}

const email = process.argv[2] || 'demeulgreg@gmail.com';
validateUser(email).catch(console.error);
