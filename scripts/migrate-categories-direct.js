const https = require('https');
const http = require('http');
const sharp = require('sharp');

// ⚠️ VERROUILLAGE qcqbtmv - IDs en TEXT
const SUPABASE_URL = 'https://qcqbtmvbvipsxwjlgjvk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzIzNjAsImV4cCI6MjA4MjUwODM2MH0.q-4uGaHsuojj3ejo5IG4V-z2fx-ER9grHsRzYNkYn0c';

async function fetchFromSupabase(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}${path}`);
    const reqOptions = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ data: parsed, status: res.statusCode });
        } catch (e) {
          resolve({ data, status: res.statusCode });
        }
      });
    });

    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed: ${response.statusCode}`));
        return;
      }
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

async function uploadToStorage(filePath, buffer, contentType) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/storage/v1/object/category-images/${filePath}`);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': contentType,
        'Content-Length': buffer.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });

    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

async function migrateCategories() {
  console.log('🚀 Migration des images catégories via API REST\n');
  console.log('🔗 URL:', SUPABASE_URL, '\n');

  const { data: categories, status } = await fetchFromSupabase('/rest/v1/categories?select=id,name,image_url');

  if (status !== 200) {
    console.error('❌ Erreur HTTP:', status);
    return;
  }

  console.log(`📊 Total catégories: ${categories.length}\n`);

  // Debug premiers résultats
  console.log('🔍 Échantillon:');
  categories.slice(0, 3).forEach(cat => {
    console.log(`  [${cat.id}] ${cat.name}`);
    console.log(`    image_url: ${cat.image_url || 'NULL'}\n`);
  });

  const wpImages = categories.filter(cat =>
    cat.image_url && cat.image_url.includes('wp.laboutiquedemorgane.com')
  );

  console.log(`📦 Images WordPress à migrer: ${wpImages.length}\n`);

  let success = 0, failed = 0;

  for (const category of wpImages) {
    try {
      console.log(`📥 [${category.id}] ${category.name}`);
      const imageBuffer = await downloadImage(category.image_url);

      console.log(`🔄 Conversion en WebP...`);
      const webpBuffer = await sharp(imageBuffer).webp({ quality: 85 }).toBuffer();

      const fileName = `category-${category.id}-${Date.now()}.webp`;
      const filePath = `categories/${fileName}`;

      console.log(`⬆️  Upload...`);
      const uploadResult = await uploadToStorage(filePath, webpBuffer, 'image/webp');

      if (uploadResult.status !== 200 && uploadResult.status !== 201) {
        console.error(`❌ Erreur upload:`, uploadResult.data);
        failed++;
        continue;
      }

      const newUrl = `${SUPABASE_URL}/storage/v1/object/public/category-images/${filePath}`;

      console.log(`💾 Mise à jour DB...`);
      const updateResult = await fetchFromSupabase(`/rest/v1/categories?id=eq.${category.id}`, {
        method: 'PATCH',
        body: { image_url: newUrl },
        headers: { 'Prefer': 'return=minimal' }
      });

      if (updateResult.status === 204) {
        console.log(`✅ [${category.id}] OK!\n`);
        success++;
      } else {
        console.error(`❌ Erreur MAJ:`, updateResult.status);
        failed++;
      }

    } catch (err) {
      console.error(`❌ [${category.id}] Erreur:`, err.message, '\n');
      failed++;
    }
  }

  console.log('\n📊 RÉSUMÉ:');
  console.log(`✅ Réussis: ${success}`);
  console.log(`❌ Échecs: ${failed}`);
  console.log(`📦 Total: ${wpImages.length}`);
}

migrateCategories().catch(console.error);
