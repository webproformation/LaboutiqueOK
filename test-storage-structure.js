#!/usr/bin/env node

/**
 * Script pour vérifier la structure du bucket Supabase product-images
 * et identifier le chemin exact des fichiers WebP
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Lire le fichier .env
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
});

// ATTENTION: Utiliser le BON projet Supabase (qcqbtmv)
const supabaseUrl = envVars.NEXT_PUBLIC_BYPASS_SUPABASE_URL;
const supabaseKey = envVars.BYPASS_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBucketStructure() {
  console.log('🔍 Analysing bucket structure...\n');

  // 1. Lister la racine du bucket
  console.log('📁 Checking root level...');
  const { data: rootFiles, error: rootError } = await supabase.storage
    .from('product-images')
    .list('', { limit: 50, sortBy: { column: 'name', order: 'asc' } });

  if (rootError) {
    console.error('❌ Root error:', rootError);
    return;
  }

  console.log(`   Found ${rootFiles?.length || 0} items at root`);

  // Identifier les dossiers vs fichiers
  const folders = rootFiles?.filter(f => f.id === null) || [];
  const files = rootFiles?.filter(f => f.id !== null) || [];

  console.log(`   - Folders: ${folders.length}`);
  folders.forEach(f => console.log(`     📁 ${f.name}/`));

  console.log(`   - Files: ${files.length}`);
  files.slice(0, 5).forEach(f => console.log(`     📄 ${f.name}`));
  if (files.length > 5) console.log(`     ... and ${files.length - 5} more`);

  // 2. Vérifier le dossier "products" s'il existe
  if (folders.some(f => f.name === 'products')) {
    console.log('\n📁 Checking products/ folder...');
    const { data: productFiles, error: prodError } = await supabase.storage
      .from('product-images')
      .list('products', { limit: 2000, sortBy: { column: 'name', order: 'asc' } });

    if (prodError) {
      console.error('❌ products/ error:', prodError);
    } else {
      console.log(`   Found ${productFiles?.length || 0} items in products/`);

      // Analyser les types de fichiers
      const webpFiles = productFiles?.filter(f => f.name.endsWith('.webp')) || [];
      const jpgFiles = productFiles?.filter(f => f.name.endsWith('.jpg') || f.name.endsWith('.jpeg')) || [];
      const pngFiles = productFiles?.filter(f => f.name.endsWith('.png')) || [];
      const otherFiles = productFiles?.filter(f =>
        !f.name.endsWith('.webp') &&
        !f.name.endsWith('.jpg') &&
        !f.name.endsWith('.jpeg') &&
        !f.name.endsWith('.png')
      ) || [];

      console.log(`   - WebP files: ${webpFiles.length}`);
      console.log(`   - JPG/JPEG files: ${jpgFiles.length}`);
      console.log(`   - PNG files: ${pngFiles.length}`);
      console.log(`   - Other files: ${otherFiles.length}`);

      if (jpgFiles.length > 0) {
        console.log(`\n   📸 Sample JPG files:`);
        jpgFiles.slice(0, 10).forEach(f => console.log(`     - ${f.name}`));
      }

      if (pngFiles.length > 0) {
        console.log(`\n   📸 Sample PNG files:`);
        pngFiles.slice(0, 10).forEach(f => console.log(`     - ${f.name}`));
      }

      if (otherFiles.length > 0) {
        console.log(`\n   📁 Other items:`);
        otherFiles.slice(0, 10).forEach(f => console.log(`     - ${f.name}`));
      }

      console.log(`\n   🎯 WebP files analysis:`);

      // Afficher quelques exemples
      webpFiles.slice(0, 10).forEach(f => {
        const match = f.name.match(/^product-(\d+)-(\d+)\.webp$/);
        if (match) {
          console.log(`     ✅ ${f.name} → WooCommerce ID: ${match[1]}`);
        } else {
          console.log(`     ⚠️  ${f.name} (pattern doesn't match)`);
        }
      });

      if (webpFiles.length > 10) {
        console.log(`     ... and ${webpFiles.length - 10} more WebP files`);
      }

      // Statistiques des IDs
      const wooIds = webpFiles
        .map(f => f.name.match(/^product-(\d+)-/))
        .filter(Boolean)
        .map(m => m[1]);

      const uniqueIds = [...new Set(wooIds)];
      console.log(`\n   📊 Statistics:`);
      console.log(`      Total WebP files: ${webpFiles.length}`);
      console.log(`      Unique product IDs: ${uniqueIds.length}`);
      console.log(`      IDs range: ${Math.min(...uniqueIds.map(Number))} - ${Math.max(...uniqueIds.map(Number))}`);
      console.log(`      First 20 IDs: ${uniqueIds.slice(0, 20).join(', ')}`);
    }
  }

  // 3. Chercher des fichiers WebP à d'autres endroits
  console.log('\n🔍 Searching for WebP files in other locations...');
  const webpAtRoot = files.filter(f => f.name.endsWith('.webp'));
  if (webpAtRoot.length > 0) {
    console.log(`   ⚠️  Found ${webpAtRoot.length} WebP files at ROOT level:`);
    webpAtRoot.slice(0, 5).forEach(f => console.log(`     - ${f.name}`));
  } else {
    console.log('   ✅ No WebP files at root (expected)');
  }

  console.log('\n✅ Analysis complete!');
}

checkBucketStructure().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
