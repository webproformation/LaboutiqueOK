import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Missing environment variables');
  process.exit(1);
}

console.log('\n🔍 VÉRIFICATION BASE DE DONNÉES RÉELLE\n');
console.log(`📡 URL: ${supabaseUrl}`);
console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...`);
console.log('');

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDatabase() {
  console.log('═════════════════════════════════════════\n');

  console.log('📦 CATÉGORIES PRODUITS\n');
  const { data: categories, error: catError } = await supabase
    .from('product_categories')
    .select('id, name, slug, parent_id')
    .order('name');

  if (catError) {
    console.error('❌ Erreur:', catError.message);
  } else {
    console.log(`✓ Total: ${categories?.length || 0} catégories`);
    categories?.forEach(cat => {
      const indent = cat.parent_id ? '  └─' : '📁';
      console.log(`${indent} ${cat.name} (${cat.slug})`);
    });
  }

  console.log('\n═════════════════════════════════════════\n');

  console.log('🎨 ATTRIBUT COULEUR\n');
  const { data: colorAttr, error: attrError } = await supabase
    .from('product_attributes')
    .select('id, name, slug')
    .or('slug.eq.couleur,slug.ilike.%couleur%,name.ilike.%couleur%')
    .maybeSingle();

  if (attrError || !colorAttr) {
    console.error('❌ Attribut Couleur introuvable!');
    return;
  }

  console.log(`✓ Attribut trouvé: ${colorAttr.name} (${colorAttr.id})`);
  console.log('\n═════════════════════════════════════════\n');
  console.log('🌈 TERMES DE COULEUR (HIÉRARCHIE)\n');

  const { data: allTerms, error: termsError } = await supabase
    .from('product_attribute_terms')
    .select('id, name, slug, color_code, parent_id, order_by')
    .eq('attribute_id', colorAttr.id)
    .order('order_by');

  if (termsError) {
    console.error('❌ Erreur:', termsError.message);
    return;
  }

  console.log(`✓ Total: ${allTerms?.length || 0} termes\n`);

  const parents = allTerms?.filter(t => !t.parent_id) || [];
  const children = allTerms?.filter(t => t.parent_id) || [];

  console.log(`📊 Statistiques:`);
  console.log(`   - Couleurs PRINCIPALES (parent_id = null): ${parents.length}`);
  console.log(`   - Couleurs SECONDAIRES (parent_id ≠ null): ${children.length}\n`);

  console.log('═════════════════════════════════════════\n');
  console.log('🎨 COULEURS PRINCIPALES (grille)\n');

  parents.forEach(parent => {
    const childrenOfParent = allTerms?.filter(c => c.parent_id === parent.id) || [];
    console.log(`📦 ${parent.name}`);
    console.log(`   color: ${parent.color_code || 'N/A'}`);
    console.log(`   enfants: ${childrenOfParent.length}`);
    if (childrenOfParent.length > 0) {
      childrenOfParent.forEach(child => {
        console.log(`      └─ ${child.name}`);
      });
    }
    console.log('');
  });

  console.log('\n✅ VÉRIFICATION TERMINÉE\n');
}

verifyDatabase().catch(error => {
  console.error('\n❌ ERREUR FATALE:', error);
  process.exit(1);
});