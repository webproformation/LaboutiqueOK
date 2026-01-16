const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: colorAttr } = await supabase
    .from('product_attributes')
    .select('id')
    .or('slug.eq.couleur,slug.ilike.%couleur%,name.ilike.%couleur%')
    .maybeSingle();

  const { data: allTerms } = await supabase
    .from('product_attribute_terms')
    .select('id, name, slug, color_code, parent_id')
    .eq('attribute_id', colorAttr.id)
    .order('order_by');

  const validTerms = allTerms.filter(t => t.name && t.name.trim());
  const parentTerms = validTerms.filter(t => !t.parent_id);

  console.log('Total terms:', allTerms.length);
  console.log('Parent terms (main grid):', parentTerms.length);
  console.log('Child terms (nuances):', validTerms.length - parentTerms.length);
  console.log('');

  console.log('GRIS COLORS:');
  const grisColors = allTerms.filter(t => t.name && t.name.toLowerCase().includes('gris'));
  grisColors.forEach(c => {
    console.log(`  - ${c.name}: parent_id=${c.parent_id || 'NULL'} => ${c.parent_id ? 'NUANCE' : 'MAIN GRID'}`);
  });
}

test().catch(console.error);