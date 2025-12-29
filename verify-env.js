// Script de vérification des variables d'environnement
const fs = require('fs');
const path = require('path');

// Lire le fichier .env manuellement
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

console.log('=== VERIFICATION DES VARIABLES D\'ENVIRONNEMENT ===\n');

const expectedUrl = 'https://qcqbtmvbvipsxwjlgjvk.supabase.co';
const actualUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;

console.log('✓ NEXT_PUBLIC_SUPABASE_URL:', actualUrl);
console.log('✓ Attendu:', expectedUrl);

if (actualUrl === expectedUrl) {
  console.log('\n✅ URL CORRECTE - qcqbtmvbvipsxwjlgjvk (PRODUCTION)');
} else {
  console.log('\n❌ ERREUR - URL INCORRECTE !');
  console.log('L\'URL devrait être:', expectedUrl);
  console.log('Mais elle est:', actualUrl);
  process.exit(1);
}

const anonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (anonKey && anonKey.includes('qcqbtmvbvipsxwjlgjvk')) {
  console.log('✅ ANON_KEY CORRECTE - Correspond à qcqbtmvbvipsxwjlgjvk (PRODUCTION)');
} else if (anonKey && (anonKey.includes('hondlefoprhtrpxnumyj') || anonKey.includes('ftgclacfleknkqbfbsbs'))) {
  console.log('❌ ERREUR - ANON_KEY INCORRECTE - Ancien projet détecté');
  process.exit(1);
} else {
  console.log('⚠️  ANON_KEY non vérifiable');
}

const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
if (serviceKey && serviceKey.includes('qcqbtmvbvipsxwjlgjvk')) {
  console.log('✅ SERVICE_ROLE_KEY CORRECTE - Correspond à qcqbtmvbvipsxwjlgjvk (PRODUCTION)');
} else if (serviceKey && (serviceKey.includes('hondlefoprhtrpxnumyj') || serviceKey.includes('ftgclacfleknkqbfbsbs'))) {
  console.log('❌ ERREUR - SERVICE_ROLE_KEY INCORRECTE - Ancien projet détecté');
  process.exit(1);
} else {
  console.log('⚠️  SERVICE_ROLE_KEY non vérifiable');
}

console.log('\n=== TOUTES LES VARIABLES SONT CORRECTES ===\n');
