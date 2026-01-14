import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('🔍 VÉRIFICATION BASE DE DONNÉES RÉELLE');
console.log('=====================================');
console.log(`📡 URL: ${supabaseUrl}`);
console.log(`🔑 Projet: ${supabaseUrl.split('//')[1]?.split('.')[0]}`);
console.log('');

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDatabase() {
  console.log('📊 VÉRIFICATION DES CATÉGORIES');
  console.log('------------------------------');

  const { data: categories, error: catError } = await supabase
    .from('product_categories')
    .select('id, name, slug, is_visible, created_at')
    .order('created_at', { ascending: true });

  if (catError) {
    console.error('❌ Erreur:', catError);
  } else {
    console.log(`✅ Nombre de catégories: ${categories?.length || 0}`);
    categories?.forEach((cat, idx) => {
      console.log(`   ${idx + 1}. ${cat.name} (${cat.slug}) - Visible: ${cat.is_visible}`);
    });
  }

  console.log('');
  console.log('🎮 VÉRIFICATION DE LA TABLE live_shared_products');
  console.log('------------------------------------------------');

  const { data: columns, error: colError } = await supabase
    .from('live_shared_products')
    .select('*')
    .limit(1);

  if (colError) {
    console.error('❌ Erreur:', colError);
  } else {
    if (columns && columns.length > 0) {
      console.log('✅ Colonnes disponibles:', Object.keys(columns[0]).join(', '));
    } else {
      console.log('⚠️  Table vide, impossible de lister les colonnes');
    }
  }

  console.log('');
  console.log('📦 VÉRIFICATION DES PRODUITS LIVE PARTAGÉS');
  console.log('------------------------------------------');

  const { data: liveProducts, error: liveError } = await supabase
    .from('live_shared_products')
    .select('id, special_offer, is_published, expires_at, shared_at')
    .order('shared_at', { ascending: false })
    .limit(5);

  if (liveError) {
    console.error('❌ Erreur:', liveError);
  } else {
    console.log(`✅ Nombre de produits live: ${liveProducts?.length || 0}`);
    liveProducts?.forEach((prod, idx) => {
      const expired = prod.expires_at ? new Date(prod.expires_at) < new Date() : false;
      console.log(`   ${idx + 1}. ${prod.special_offer || 'Sans nom'}`);
      console.log(`      - Publié: ${prod.is_published ? '✅' : '❌'}`);
      console.log(`      - Expire: ${prod.expires_at || 'Jamais'} ${expired ? '(EXPIRÉ)' : ''}`);
    });
  }

  console.log('');
  console.log('✅ VÉRIFICATION TERMINÉE');
}

verifyDatabase().catch(console.error);
