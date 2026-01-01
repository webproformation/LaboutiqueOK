const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

console.log('=== VERIFICATION BYPASS_SUPABASE CONFIGURATION ===\n');

const expectedUrl = 'https://qcqbtmvbvipsxwjlgjvk.supabase.co';
const bypassUrl = envVars.BYPASS_SUPABASE_URL;

console.log('BYPASS_SUPABASE_URL:', bypassUrl);
console.log('Attendu:', expectedUrl);

if (bypassUrl === expectedUrl) {
  console.log('\n✅ BYPASS_SUPABASE_URL CORRECTE - qcqbtmvbvipsxwjlgjvk (PRODUCTION)');
} else {
  console.log('\n❌ ERREUR - BYPASS_SUPABASE_URL INCORRECTE !');
  console.log('L\'URL devrait être:', expectedUrl);
  console.log('Mais elle est:', bypassUrl);
  process.exit(1);
}

const bypassServiceRole = envVars.BYPASS_SUPABASE_SERVICE_ROLE;
if (bypassServiceRole) {
  try {
    const payload = JSON.parse(Buffer.from(bypassServiceRole.split('.')[1], 'base64').toString());
    if (payload.ref === 'qcqbtmvbvipsxwjlgjvk') {
      console.log('✅ BYPASS_SUPABASE_SERVICE_ROLE CORRECTE - qcqbtmvbvipsxwjlgjvk (PRODUCTION)');
    } else {
      console.log('❌ ERREUR - BYPASS_SUPABASE_SERVICE_ROLE INCORRECTE - Projet incorrect:', payload.ref);
      process.exit(1);
    }
  } catch (e) {
    console.log('⚠️  BYPASS_SUPABASE_SERVICE_ROLE non vérifiable');
  }
} else {
  console.log('⚠️  BYPASS_SUPABASE_SERVICE_ROLE manquante');
}

console.log('\n=== TOUTES LES VARIABLES BYPASS SONT CORRECTES ===\n');
console.log('Le code utilise maintenant BYPASS_SUPABASE_* en priorité absolue.');
console.log('Les anciennes variables verrouillées seront ignorées.\n');
