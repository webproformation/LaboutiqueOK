const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCategoryWithId() {
  console.log('\n🧪 TEST CRÉATION CATÉGORIE AVEC ID\n');
  console.log('='.repeat(60));

  const testId = crypto.randomUUID();
  const testSlug = `test-${Date.now()}`;

  console.log('\n1️⃣ Génération ID...');
  console.log('   ID généré:', testId);
  console.log('   Type:', typeof testId);

  console.log('\n2️⃣ Test création catégorie avec ID...');
  const testCategory = {
    id: testId,
    name: 'Test Catégorie',
    slug: testSlug,
    description: 'Catégorie de test',
    color: '#FF0000',
    display_order: 999,
    is_active: true
  };

  const { data: created, error: createError } = await supabase
    .from('news_categories')
    .insert(testCategory)
    .select()
    .single();

  if (createError) {
    console.error('❌ Erreur création:', createError);
    console.log('\n💡 Détails:', JSON.stringify(createError, null, 2));
    return;
  }

  console.log('✅ Catégorie créée avec succès!');
  console.log('   ID:', created.id);
  console.log('   Name:', created.name);
  console.log('   Slug:', created.slug);
  console.log('   Color:', created.color);
  console.log('   Is Active:', created.is_active);

  console.log('\n3️⃣ Nettoyage...');
  const { error: deleteError } = await supabase
    .from('news_categories')
    .delete()
    .eq('id', created.id);

  if (deleteError) {
    console.error('❌ Erreur suppression:', deleteError);
  } else {
    console.log('✅ Catégorie de test supprimée');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ TEST RÉUSSI!\n');
}

testCategoryWithId().catch(err => {
  console.error('\n❌ ERREUR:', err);
  process.exit(1);
});
