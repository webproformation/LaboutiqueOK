const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Charger .env manuellement
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorageWebP() {
  try {
    // Lister les buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) throw bucketsError;

    console.log('=== BUCKETS DISPONIBLES ===');
    buckets.forEach(b => console.log(`- ${b.name} (public: ${b.public})`));

    // Vérifier le bucket product-images
    if (buckets.find(b => b.name === 'product-images')) {
      console.log('\n=== CONTENU DE product-images/products ===');
      const { data: files, error: filesError } = await supabase.storage
        .from('product-images')
        .list('products', { limit: 200 });

      if (filesError) {
        console.log('Erreur:', filesError.message);
      } else {
        console.log(`Total fichiers: ${files.length}`);

        const webpFiles = files.filter(f => f.name.endsWith('.webp'));
        console.log(`Fichiers WebP: ${webpFiles.length}`);

        if (webpFiles.length > 0) {
          console.log('\nExemples de fichiers WebP:');
          webpFiles.slice(0, 10).forEach(f => {
            const url = `${supabaseUrl}/storage/v1/object/public/product-images/products/${f.name}`;
            console.log(`  - ${f.name}`);
            console.log(`    URL: ${url}`);
          });
        }
      }
    }
  } catch (error) {
    console.error('Erreur:', error.message);
  }
}

checkStorageWebP();
