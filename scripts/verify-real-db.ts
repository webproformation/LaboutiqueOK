import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const EXPECTED_PROJECT_ID = 'qcqbtmvbvipsxwjlgjvk';

async function verify() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!url.includes(EXPECTED_PROJECT_ID)) {
    console.error('❌ ERREUR: Mauvais projet!');
    console.error('Attendu:', EXPECTED_PROJECT_ID);
    console.error('Trouvé:', url);
    process.exit(1);
  }

  console.log('✅ Projet vérifié:', EXPECTED_PROJECT_ID);
  
  const supabase = createClient(url, key);

  const { data: categories } = await supabase
    .from('categories')
    .select('name, slug')
    .is('parent_id', null)
    .eq('is_visible', true);

  console.log('\nCatégories trouvées:', categories?.length);
  categories?.forEach((c, i) => console.log(`  ${i+1}. ${c.name}`));

  const { data: products } = await supabase
    .from('products')
    .select('name, main_color, size_range_start, size_range_end')
    .limit(3);

  console.log('\nProduits (3 premiers):');
  products?.forEach((p, i) => {
    console.log(`  ${i+1}. ${p.name}`);
    console.log(`     Couleur: ${p.main_color || 'N/A'}`);
    console.log(`     Tailles: ${p.size_range_start || '?'}-${p.size_range_end || '?'}`);
  });
}

verify().catch(console.error);
