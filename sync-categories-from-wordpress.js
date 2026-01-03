/**
 * SCRIPT DE SYNCHRONISATION CATEGORIES WORDPRESS → SUPABASE
 *
 * Usage: node sync-categories-from-wordpress.js
 *
 * Ce script récupère toutes les catégories depuis WordPress/WooCommerce
 * et les insère dans la table `categories` de Supabase.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Charger les variables d'environnement depuis .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

const WORDPRESS_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://boutiquedecarla.fr';
const WOO_CONSUMER_KEY = process.env.WOO_CONSUMER_KEY;
const WOO_CONSUMER_SECRET = process.env.WOO_CONSUMER_SECRET;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  console.log('\n🔄 SYNCHRONISATION CATEGORIES WORDPRESS → SUPABASE\n');

  // Vérifier les variables d'environnement
  if (!WOO_CONSUMER_KEY || !WOO_CONSUMER_SECRET) {
    console.error('❌ Variables WooCommerce manquantes (WOO_CONSUMER_KEY, WOO_CONSUMER_SECRET)');
    process.exit(1);
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Variables Supabase manquantes (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
    process.exit(1);
  }

  // Créer le client Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('📡 Récupération des catégories depuis WordPress...');

  // Récupérer toutes les catégories WooCommerce
  const authString = Buffer.from(`${WOO_CONSUMER_KEY}:${WOO_CONSUMER_SECRET}`).toString('base64');

  let allCategories = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const url = `${WORDPRESS_URL}/wp-json/wc/v3/products/categories?per_page=${perPage}&page=${page}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${authString}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const categories = await response.json();

      if (!Array.isArray(categories) || categories.length === 0) {
        break;
      }

      allCategories = allCategories.concat(categories);
      console.log(`   Page ${page}: ${categories.length} catégories récupérées`);

      page++;

      // Vérifier s'il y a d'autres pages
      const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');
      if (page > totalPages) {
        break;
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération (page ${page}):`, error.message);
      break;
    }
  }

  console.log(`\n✅ Total: ${allCategories.length} catégories récupérées\n`);

  if (allCategories.length === 0) {
    console.log('⚠️ Aucune catégorie à synchroniser');
    return;
  }

  // Préparer les données pour Supabase
  console.log('💾 Insertion dans Supabase...');

  // D'abord, créer un mapping des IDs WordPress vers les UUIDs Supabase
  const categoryMapping = new Map();

  // Premier passage: insérer toutes les catégories sans parent
  for (const cat of allCategories) {
    const categoryData = {
      woocommerce_id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      woocommerce_parent_id: cat.parent || 0,
      image_url: cat.image?.src || null,
      count: cat.count || 0,
      is_active: true,
      updated_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('categories')
        .upsert(categoryData, {
          onConflict: 'woocommerce_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.error(`   ❌ Erreur pour "${cat.name}":`, error.message);
      } else if (data) {
        categoryMapping.set(cat.id, data.id);
        console.log(`   ✅ ${cat.name} (ID: ${cat.id} → ${data.id})`);
      }
    } catch (err) {
      console.error(`   ❌ Exception pour "${cat.name}":`, err.message);
    }
  }

  // Deuxième passage: mettre à jour les relations parent-enfant
  console.log('\n🔗 Mise à jour des relations parent-enfant...');

  for (const cat of allCategories) {
    if (cat.parent && cat.parent !== 0) {
      const childId = categoryMapping.get(cat.id);
      const parentId = categoryMapping.get(cat.parent);

      if (childId && parentId) {
        const { error } = await supabase
          .from('categories')
          .update({ parent_id: parentId })
          .eq('id', childId);

        if (error) {
          console.error(`   ❌ Relation "${cat.name}" → parent:`, error.message);
        } else {
          console.log(`   ✅ ${cat.name} → parent mis à jour`);
        }
      }
    }
  }

  // Statistiques finales
  const { count: totalCount } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true });

  console.log(`\n✅ SYNCHRONISATION TERMINÉE`);
  console.log(`   Total dans Supabase: ${totalCount} catégories`);
  console.log(`   Catégories synchronisées: ${categoryMapping.size}`);
  console.log('\n');
}

main().catch(error => {
  console.error('\n❌ ERREUR FATALE:', error);
  process.exit(1);
});
