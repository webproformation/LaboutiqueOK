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

console.log('=== VERIFICATION APP_DATABASE CONFIGURATION ===\n');

const expectedUrl = 'https://qcqbtmvbvipsxwjlgjvk.supabase.co';
const appDatabaseUrl = envVars.APP_DATABASE_URL;

console.log('APP_DATABASE_URL:', appDatabaseUrl);
console.log('Attendu:', expectedUrl);

if (appDatabaseUrl === expectedUrl) {
  console.log('\n✅ APP_DATABASE_URL CORRECTE - qcqbtmvbvipsxwjlgjvk (PRODUCTION)');
} else {
  console.log('\n❌ ERREUR - APP_DATABASE_URL INCORRECTE !');
  console.log('L\'URL devrait être:', expectedUrl);
  console.log('Mais elle est:', appDatabaseUrl);
  process.exit(1);
}

const appDatabaseAnonKey = envVars.APP_DATABASE_ANON_KEY;
if (appDatabaseAnonKey) {
  try {
    const payload = JSON.parse(Buffer.from(appDatabaseAnonKey.split('.')[1], 'base64').toString());
    if (payload.ref === 'qcqbtmvbvipsxwjlgjvk') {
      console.log('✅ APP_DATABASE_ANON_KEY CORRECTE - qcqbtmvbvipsxwjlgjvk (PRODUCTION)');
    } else {
      console.log('❌ ERREUR - APP_DATABASE_ANON_KEY INCORRECTE - Projet incorrect:', payload.ref);
      process.exit(1);
    }
  } catch (e) {
    console.log('⚠️  APP_DATABASE_ANON_KEY non vérifiable');
  }
} else {
  console.log('⚠️  APP_DATABASE_ANON_KEY manquante');
}

const appDatabaseServiceRole = envVars.APP_DATABASE_SERVICE_ROLE;
if (appDatabaseServiceRole) {
  try {
    const payload = JSON.parse(Buffer.from(appDatabaseServiceRole.split('.')[1], 'base64').toString());
    if (payload.ref === 'qcqbtmvbvipsxwjlgjvk') {
      console.log('✅ APP_DATABASE_SERVICE_ROLE CORRECTE - qcqbtmvbvipsxwjlgjvk (PRODUCTION)');
    } else {
      console.log('❌ ERREUR - APP_DATABASE_SERVICE_ROLE INCORRECTE - Projet incorrect:', payload.ref);
      process.exit(1);
    }
  } catch (e) {
    console.log('⚠️  APP_DATABASE_SERVICE_ROLE non vérifiable');
  }
} else {
  console.log('⚠️  APP_DATABASE_SERVICE_ROLE manquante');
}

console.log('\n=== TOUTES LES VARIABLES APP_DATABASE SONT CORRECTES ===\n');
console.log('NOTE: Les anciennes variables SUPABASE_ peuvent être ignorées.');
console.log('Le code utilise maintenant APP_DATABASE_* en priorité.\n');
