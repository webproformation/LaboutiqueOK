require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function updateAllCategories() {
  console.log('🔄 Mise à jour is_visible pour toutes les catégories...\n');

  const { data, error } = await supabase
    .from('categories')
    .update({ is_visible: true })
    .is('is_visible', null);

  if (error) {
    console.error('❌ Erreur:', error.message);
  } else {
    console.log(`✅ ${data?.length || 0} catégories mises à jour`);
  }

  const { count } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })
    .eq('is_visible', true);

  console.log(`✅ Total catégories visibles: ${count}`);
}

updateAllCategories();
