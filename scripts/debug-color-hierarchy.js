const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugColorHierarchy() {
  console.log('\n=== DEBUG COLOR HIERARCHY ===\n');

  const { data: colorAttr, error: attrError } = await supabase
    .from('product_attributes')
    .select('id, name, slug')
    .or('slug.eq.couleur,slug.ilike.%couleur%,name.ilike.%couleur%')
    .maybeSingle();

  if (attrError) {
    console.error('Error fetching color attribute:', attrError);
    return;
  }

  if (!colorAttr) {
    console.error('No color attribute found!');
    return;
  }

  console.log('✓ Color attribute found:', colorAttr);
  console.log('');

  const { data: allTerms, error: termsError } = await supabase
    .from('product_attribute_terms')
    .select('id, name, slug, color_code, parent_id, order_by')
    .eq('attribute_id', colorAttr.id)
    .order('order_by');

  if (termsError) {
    console.error('Error fetching terms:', termsError);
    return;
  }

  console.log(`✓ Total terms loaded: ${allTerms.length}`);
  console.log('');

  const parentTerms = allTerms.filter(t => !t.parent_id);
  console.log(`✓ Parent terms (main colors): ${parentTerms.length}`);
  console.log('');

  parentTerms.forEach(parent => {
    const children = allTerms.filter(child => child.parent_id === parent.id);
    console.log(`📦 ${parent.name} (${parent.id})`);
    console.log(`   Color code: ${parent.color_code || 'N/A'}`);
    console.log(`   Children: ${children.length}`);

    if (children.length > 0) {
      children.forEach(child => {
        console.log(`      └─ ${child.name} (parent_id: ${child.parent_id}, color: ${child.color_code || 'N/A'})`);
      });
    } else {
      console.log('      └─ (no children)');
    }
    console.log('');
  });

  const orphanTerms = allTerms.filter(t => t.parent_id && !parentTerms.find(p => p.id === t.parent_id));
  if (orphanTerms.length > 0) {
    console.log(`⚠️  Orphan terms (parent_id points to non-existent parent): ${orphanTerms.length}`);
    orphanTerms.forEach(orphan => {
      console.log(`   - ${orphan.name} (parent_id: ${orphan.parent_id})`);
    });
    console.log('');
  }

  console.log('=== END DEBUG ===\n');
}

debugColorHierarchy().catch(console.error);
