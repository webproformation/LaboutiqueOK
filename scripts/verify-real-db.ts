import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes !');
  process.exit(1);
}

console.log('🔍 Vérification du projet Supabase...');
console.log('URL:', supabaseUrl);
console.log('Projet ID:', supabaseUrl.includes('qcqbtmv') ? '✅ qcqbtmv' : '❌ MAUVAIS PROJET');

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDatabase() {
  console.log('\n📊 Vérification des catégories...');

  const { data: categories, error } = await supabase
    .from('product_categories')
    .select('id, name, slug, parent_id, is_visible')
    .order('name');

  if (error) {
    console.error('❌ Erreur:', error);
    return;
  }

  console.log(`\n✅ Nombre de catégories: ${categories?.length || 0}`);
  console.log('\nListe des catégories:');
  categories?.forEach(cat => {
    console.log(`- ${cat.name} (slug: ${cat.slug}, parent: ${cat.parent_id || 'root'}, visible: ${cat.is_visible})`);
  });

  console.log('\n📦 Vérification des produits...');
  const { data: products, count } = await supabase
    .from('products')
    .select('id, name', { count: 'exact', head: false })
    .limit(5);

  console.log(`✅ Nombre total de produits: ${count}`);
  if (products && products.length > 0) {
    console.log('\nExemples de produits:');
    products.forEach(p => {
      console.log(`- ${p.name} (ID: ${p.id})`);
    });
  }
}

verifyDatabase().catch(console.error);
