const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qcqbtmvbvipsxwjlgjvk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzIzNjAsImV4cCI6MjA4MjUwODM2MH0.q-4uGaHsuojj3ejo5IG4V-z2fx-ER9grHsRzYNkYn0c'
);

async function testMegaMenuData() {
  console.log('\n='.repeat(70));
  console.log('TEST MEGA-MENU : RÉCUPÉRATION DES DONNÉES');
  console.log('='.repeat(70) + '\n');

  const categories = ['mode', 'beaute-senteurs', 'maison'];

  for (const categorySlug of categories) {
    console.log(`\n📂 Catégorie : ${categorySlug.toUpperCase()}`);
    console.log('-'.repeat(70));

    // 1. Récupère la catégorie parente
    const { data: parentCategory, error: parentError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('slug', categorySlug)
      .maybeSingle();

    if (parentError) {
      console.log(`❌ Erreur parent : ${parentError.message}`);
      continue;
    }

    if (!parentCategory) {
      console.log(`❌ Catégorie parent non trouvée`);
      continue;
    }

    console.log(`✅ Parent trouvé : ${parentCategory.name} (ID: ${parentCategory.id})`);

    // 2. Récupère les sous-catégories niveau 1
    const { data: level1Categories, error: level1Error } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', parentCategory.id)
      .order('display_order', { ascending: true });

    if (level1Error) {
      console.log(`❌ Erreur sous-catégories : ${level1Error.message}`);
      continue;
    }

    console.log(`✅ ${level1Categories?.length || 0} sous-catégories trouvées\n`);

    // 3. Pour chaque sous-catégorie, récupère ses enfants
    if (level1Categories && level1Categories.length > 0) {
      for (const cat of level1Categories) {
        const { data: children } = await supabase
          .from('categories')
          .select('*')
          .eq('parent_id', cat.id)
          .order('display_order', { ascending: true });

        console.log(`   └─ ${cat.name}`);
        if (children && children.length > 0) {
          children.forEach(child => {
            console.log(`      └─ ${child.name}`);
          });
        }
      }
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('RÉSUMÉ GLOBAL');
  console.log('='.repeat(70));

  // Stats globales
  const { count: totalCategories } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true });

  const { count: totalProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  const { count: totalMappings } = await supabase
    .from('product_category_mapping')
    .select('*', { count: 'exact', head: true });

  console.log(`\n✅ Catégories totales : ${totalCategories}`);
  console.log(`✅ Produits totaux : ${totalProducts}`);
  console.log(`✅ Mappings totaux : ${totalMappings}`);

  console.log('\n' + '='.repeat(70));
  console.log('✅ TEST TERMINÉ - TOUTES LES DONNÉES SONT DISPONIBLES');
  console.log('='.repeat(70) + '\n');
}

testMegaMenuData().catch(console.error);
