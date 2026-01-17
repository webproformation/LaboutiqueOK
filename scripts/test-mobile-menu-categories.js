require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testMobileMenuCategories() {
  console.log('\n🔍 TEST STRUCTURE MENU MOBILE\n');
  console.log('='.repeat(60));

  const { data: allCategories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_visible', true)
    .order('display_order', { ascending: true });

  console.log(`\n✅ Total catégories visibles : ${allCategories.length}`);

  const level1Categories = allCategories.filter(cat =>
    cat.parent_id === null && cat.show_in_main_menu === true
  );

  console.log(`\n📋 Catégories de niveau 1 (show_in_main_menu=true) : ${level1Categories.length}`);

  level1Categories.forEach((cat1, index) => {
    const level2 = allCategories.filter(cat => cat.parent_id === cat1.id);

    console.log(`\n${index + 1}. 📁 ${cat1.name} (${cat1.id})`);
    console.log(`   └─ ${level2.length} enfant(s) de niveau 2`);

    if (level2.length > 0) {
      level2.forEach((cat2, i) => {
        const level3 = allCategories.filter(cat => cat.parent_id === cat2.id);
        console.log(`      ${i + 1}. 📂 ${cat2.name} (${cat2.id})`);

        if (level3.length > 0) {
          console.log(`         └─ ${level3.length} enfant(s) de niveau 3 :`);
          level3.forEach((cat3, j) => {
            console.log(`            ${j + 1}. 📄 ${cat3.name}`);
          });
        }
      });
    }
  });

  console.log('\n' + '='.repeat(60));

  const dressingCategory = allCategories.find(cat => cat.id === 'cat-dressing');
  if (dressingCategory) {
    const dressingChildren = allCategories.filter(cat => cat.parent_id === 'cat-dressing');
    console.log(`\n🔎 ZOOM SUR "Dressing (34-54)" :`);
    console.log(`   - ID: ${dressingCategory.id}`);
    console.log(`   - Slug: ${dressingCategory.slug}`);
    console.log(`   - show_in_main_menu: ${dressingCategory.show_in_main_menu}`);
    console.log(`   - Nombre d'enfants directs: ${dressingChildren.length}`);

    if (dressingChildren.length > 0) {
      console.log(`   - Enfants:`);
      dressingChildren.forEach((child, i) => {
        const grandChildren = allCategories.filter(cat => cat.parent_id === child.id);
        console.log(`      ${i + 1}. ${child.name} (${grandChildren.length} sous-catégories)`);
      });
    }
  }

  console.log('\n✅ Test terminé\n');
}

testMobileMenuCategories().catch(console.error);
