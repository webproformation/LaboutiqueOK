const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCategoryIds() {
  console.log('\n🔍 VÉRIFICATION IDs news_categories\n');
  console.log('='.repeat(60));

  const { data, error } = await supabase
    .from('news_categories')
    .select('id, name, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Erreur:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️ Aucune catégorie trouvée');
    return;
  }

  console.log(`\n✅ ${data.length} catégorie(s) trouvée(s):\n`);

  data.forEach((cat, index) => {
    console.log(`${index + 1}. ID: "${cat.id}" | Name: "${cat.name}"`);
    console.log(`   Type: ${typeof cat.id} | Longueur: ${cat.id.length}`);
    console.log(`   Est UUID? ${/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cat.id)}`);
    console.log(`   Est numérique? ${/^\d+$/.test(cat.id)}`);
    console.log('');
  });

  console.log('='.repeat(60) + '\n');
}

checkCategoryIds().catch(console.error);
