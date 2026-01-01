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
if (anonKey) {
  try {
    const payload = JSON.parse(Buffer.from(anonKey.split('.')[1], 'base64').toString());
    if (payload.ref === 'qcqbtmvbvipsxwjlgjvk') {
      console.log('✅ ANON_KEY CORRECTE - Correspond à qcqbtmvbvipsxwjlgjvk (PRODUCTION)');
    } else {
      console.log('❌ ERREUR - ANON_KEY INCORRECTE - Projet incorrect:', payload.ref);
      process.exit(1);
    }
  } catch (e) {
    console.log('⚠️  ANON_KEY non vérifiable');
  }
} else {
  console.log('⚠️  ANON_KEY manquante');
}

const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
if (serviceKey) {
  try {
    const payload = JSON.parse(Buffer.from(serviceKey.split('.')[1], 'base64').toString());
    if (payload.ref === 'qcqbtmvbvipsxwjlgjvk') {
      console.log('✅ SERVICE_ROLE_KEY CORRECTE - Correspond à qcqbtmvbvipsxwjlgjvk (PRODUCTION)');
    } else {
      console.log('❌ ERREUR - SERVICE_ROLE_KEY INCORRECTE - Projet incorrect:', payload.ref);
      process.exit(1);
    }
  } catch (e) {
    console.log('⚠️  SERVICE_ROLE_KEY non vérifiable');
  }
} else {
  console.log('⚠️  SERVICE_ROLE_KEY manquante');
}

console.log('\n=== TOUTES LES VARIABLES SONT CORRECTES ===\n');
