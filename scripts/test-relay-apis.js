require('dotenv').config();

async function testMondialRelay() {
  console.log('=== TEST MONDIAL RELAY API ===\n');

  const mondialRelayId = process.env.MONDIAL_RELAY_ID;
  const mondialRelayKey = process.env.MONDIAL_RELAY_KEY;

  console.log('Credentials:');
  console.log(`MONDIAL_RELAY_ID: ${mondialRelayId}`);
  console.log(`MONDIAL_RELAY_KEY: ${mondialRelayKey ? '****' : 'MANQUANT'}\n`);

  if (!mondialRelayId || !mondialRelayKey) {
    console.log('❌ Credentials manquants!\n');
    return false;
  }

  try {
    console.log('Recherche de points relais à Paris (75001)...');

    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <WSI4_PointRelais_Recherche xmlns="http://www.mondialrelay.fr/webservice/">
      <Enseigne>${mondialRelayId}</Enseigne>
      <Pays>FR</Pays>
      <CP>75001</CP>
      <Ville>Paris</Ville>
      <NombreResultats>5</NombreResultats>
      <Security>${mondialRelayKey}</Security>
    </WSI4_PointRelais_Recherche>
  </soap:Body>
</soap:Envelope>`;

    const response = await fetch('https://api.mondialrelay.com/Web_Services.asmx', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://www.mondialrelay.fr/webservice/WSI4_PointRelais_Recherche'
      },
      body: soapRequest
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Erreur API: ${errorText.substring(0, 200)}...\n`);
      return false;
    }

    const xmlData = await response.text();

    const statRegex = /<STAT>(\d+)<\/STAT>/;
    const statMatch = xmlData.match(statRegex);
    const statCode = statMatch ? statMatch[1] : null;

    console.log(`Code retour API: ${statCode}`);

    if (statCode === '0') {
      const relayCount = (xmlData.match(/<PointRelais_Details>/g) || []).length;
      console.log(`✅ Succès! ${relayCount} points relais trouvés\n`);

      if (relayCount > 0) {
        const numMatch = xmlData.match(/<Num>(.*?)<\/Num>/);
        const nameMatch = xmlData.match(/<LgAdr1>(.*?)<\/LgAdr1>/);
        if (numMatch && nameMatch) {
          console.log(`Premier point relais: ${nameMatch[1]} (${numMatch[1]})\n`);
        }
      }
      return true;
    } else {
      const errorCodes = {
        '1': 'Enseigne invalide',
        '2': 'Numéro d\'enseigne vide',
        '3': 'Numéro de compte vide',
        '10': 'Type de collecte invalide',
        '11': 'Numéro de dossier invalide',
        '20': 'Code pays invalide',
        '21': 'Code pays manquant',
        '74': 'Sécurité invalide',
        '80': 'Service non activé',
        '85': 'Marque non trouvée'
      };

      console.log(`❌ Erreur Mondial Relay: ${errorCodes[statCode] || 'Erreur inconnue'}\n`);
      return false;
    }

  } catch (error) {
    console.log(`❌ Exception: ${error.message}\n`);
    return false;
  }
}

async function testGLS() {
  console.log('=== TEST GLS API ===\n');

  const glsUsername = process.env.GLS_USERNAME;
  const glsPassword = process.env.GLS_PASSWORD;

  console.log('Credentials:');
  console.log(`GLS_USERNAME: ${glsUsername}`);
  console.log(`GLS_PASSWORD: ${glsPassword ? '****' : 'MANQUANT'}\n`);

  if (!glsUsername || !glsPassword) {
    console.log('❌ Credentials manquants!\n');
    return false;
  }

  console.log('⚠️  Note: L\'API GLS publique nécessite souvent:');
  console.log('   - Un compte activé pour l\'API REST');
  console.log('   - Des credentials différents de l\'interface web');
  console.log('   - Une souscription au service de points relais\n');

  try {
    console.log('Test 1: API publique GLS (https://api.gls-group.eu)...');

    const params = new URLSearchParams({
      country: 'FR',
      zipcode: '75001',
      city: 'Paris',
      limit: '5'
    });

    const authString = Buffer.from(`${glsUsername}:${glsPassword}`).toString('base64');

    const response = await fetch(`https://api.gls-group.eu/public/v1/parcelshops?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      }
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();

      if (data && data.parcelshops) {
        console.log(`✅ Succès! ${data.parcelshops.length} points relais trouvés\n`);

        if (data.parcelshops.length > 0) {
          const firstShop = data.parcelshops[0];
          console.log(`Premier point relais: ${firstShop.name} (${firstShop.id})`);
          console.log(`Adresse: ${firstShop.address}, ${firstShop.zipcode} ${firstShop.city}\n`);
        }
        return true;
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ Erreur API publique: ${errorText.substring(0, 200)}...\n`);
    }

    console.log('Test 2: API France GLS (gls-france.com)...');

    const response2 = await fetch(`https://www.gls-france.com/api/parcelshops/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        zipCode: '75001',
        city: 'Paris',
        country: 'FR'
      })
    });

    console.log(`Status: ${response2.status} ${response2.statusText}`);

    if (response2.ok) {
      const data = await response2.json();
      console.log(`✅ Succès via API France!\n`);
      return true;
    } else {
      const errorText = await response2.text();
      console.log(`❌ Erreur API France: ${errorText.substring(0, 200)}...\n`);
    }

    console.log('⚠️  Les credentials GLS fournis ne semblent pas fonctionner avec l\'API publique.');
    console.log('   Recommandation: Utiliser des données de démonstration ou contacter GLS pour activation.\n');
    return false;

  } catch (error) {
    console.log(`❌ Exception: ${error.message}\n`);
    return false;
  }
}

async function main() {
  console.log('\n========================================');
  console.log('TEST DES APIS POINTS RELAIS');
  console.log('========================================\n');

  const mondialRelayOk = await testMondialRelay();
  const glsOk = await testGLS();

  console.log('========================================');
  console.log('RÉSUMÉ');
  console.log('========================================');
  console.log(`Mondial Relay: ${mondialRelayOk ? '✅ FONCTIONNEL' : '❌ NON FONCTIONNEL'}`);
  console.log(`GLS:           ${glsOk ? '✅ FONCTIONNEL' : '❌ NON FONCTIONNEL'}`);
  console.log('========================================\n');

  if (!mondialRelayOk || !glsOk) {
    console.log('⚠️  Certaines APIs ne fonctionnent pas correctement.');
    console.log('Vérifiez les credentials dans le fichier .env\n');
    process.exit(1);
  } else {
    console.log('✅ Toutes les APIs fonctionnent correctement!\n');
    process.exit(0);
  }
}

main();
