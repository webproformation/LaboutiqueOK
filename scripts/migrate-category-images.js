const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');
const sharp = require('sharp');

// ⚠️ VERROUILLAGE qcqbtmv - IDs en TEXT (ex: "84", "102")
const SUPABASE_URL = 'https://qcqbtmvbvipsxwjlgjvk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzIzNjAsImV4cCI6MjA4MjUwODM2MH0.q-4uGaHsuojj3ejo5IG4V-z2fx-ER9grHsRzYNkYn0c';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

async function migrateCategories() {
  console.log('🚀 Démarrage de la migration des images catégories...\n');
  console.log('🔗 Connexion à:', SUPABASE_URL, '\n');

  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name, image_url');

  if (error) {
    console.error('❌ Erreur lors de la récupération des catégories:', error);
    return;
  }

  console.log(`📊 Total catégories en base: ${categories ? categories.length : 0}`);

  // Debug: afficher quelques catégories
  if (categories && categories.length > 0) {
    console.log('\n🔍 Échantillon de données:');
    categories.slice(0, 5).forEach(cat => {
      console.log(`  [${cat.id}] ${cat.name}`);
      console.log(`    image_url: ${cat.image_url || 'NULL'}`);
      console.log(`    Type: ${typeof cat.image_url}`);
    });
  }

  const withImages = (categories || []).filter(cat => cat.image_url);
  console.log(`\n📸 Catégories avec image_url: ${withImages.length}`);

  const wpImages = withImages.filter(cat => cat.image_url.includes('wp.laboutiquedemorgane.com'));
  console.log(`🌐 Images WordPress à migrer: ${wpImages.length}`);

  if (wpImages.length > 0) {
    console.log('\n🔍 Aperçu des URLs à migrer:');
    wpImages.slice(0, 3).forEach(cat => {
      console.log(`  - [${cat.id}] ${cat.name}: ${cat.image_url.substring(0, 80)}...`);
    });
  }

  const categoriesToMigrate = wpImages;

  console.log(`\n📦 ${categoriesToMigrate.length} catégories à traiter\n`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const category of categoriesToMigrate) {
    if (!category.image_url || category.image_url.includes('supabase.co')) {
      console.log(`⏭️  [${category.id}] ${category.name} - Déjà sur Supabase`);
      skipped++;
      continue;
    }

    try {
      console.log(`📥 [${category.id}] Téléchargement: ${category.name}`);
      const imageBuffer = await downloadImage(category.image_url);

      console.log(`🔄 [${category.id}] Conversion en WebP...`);
      const webpBuffer = await sharp(imageBuffer)
        .webp({ quality: 85 })
        .toBuffer();

      const fileName = `category-${category.id}-${Date.now()}.webp`;
      const filePath = `categories/${fileName}`;

      console.log(`⬆️  [${category.id}] Upload vers Supabase Storage...`);
      const { error: uploadError } = await supabase.storage
        .from('category-images')
        .upload(filePath, webpBuffer, {
          contentType: 'image/webp',
          upsert: false
        });

      if (uploadError) {
        console.error(`❌ [${category.id}] Erreur upload:`, uploadError.message);
        failed++;
        continue;
      }

      const newUrl = `${SUPABASE_URL}/storage/v1/object/public/category-images/${filePath}`;

      console.log(`💾 [${category.id}] Mise à jour de l'URL en base...`);
      const { error: updateError } = await supabase
        .from('categories')
        .update({ image_url: newUrl })
        .eq('id', category.id);

      if (updateError) {
        console.error(`❌ [${category.id}] Erreur mise à jour:`, updateError.message);
        failed++;
        continue;
      }

      console.log(`✅ [${category.id}] ${category.name} - Migré avec succès!\n`);
      success++;

    } catch (err) {
      console.error(`❌ [${category.id}] ${category.name} - Erreur:`, err.message, '\n');
      failed++;
    }
  }

  console.log('\n📊 RÉSUMÉ DE LA MIGRATION:');
  console.log(`✅ Réussis: ${success}`);
  console.log(`⏭️  Ignorés: ${skipped}`);
  console.log(`❌ Échecs: ${failed}`);
  console.log(`📦 Total: ${categoriesToMigrate.length}`);
}

migrateCategories().catch(console.error);
