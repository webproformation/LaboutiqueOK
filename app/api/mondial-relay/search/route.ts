import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  console.log('Requête reçue sur Mondial Relay Search');

  try {
    const body = await request.json();
    const { postalCode, city } = body;

    if (!postalCode) {
      return NextResponse.json({ error: 'Code postal requis' }, { status: 400 });
    }

    const searchCity = city || '';
    const mondialRelayId = process.env.MONDIAL_RELAY_ID;
    const mondialRelayKey = process.env.MONDIAL_RELAY_KEY;
    const countryCode = 'FR';
    const nbResults = '10';

    if (!mondialRelayId || !mondialRelayKey) {
      return NextResponse.json({
        points: [],
        relayPoints: [],
        message: 'Configuration Mondial Relay manquante'
      });
    }

    // Calcul du Hash de sécurité
    const rawString = `${mondialRelayId}${countryCode}${postalCode}${searchCity}${nbResults}${mondialRelayKey}`;
    const securityKey = crypto.createHash('md5').update(rawString).digest('hex').toUpperCase();

    const response = await fetch('https://api.mondialrelay.com/Web_Services.asmx', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://www.mondialrelay.fr/webservice/WSI4_PointRelais_Recherche'
      },
      body: `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <WSI4_PointRelais_Recherche xmlns="http://www.mondialrelay.fr/webservice/">
      <Enseigne>${mondialRelayId}</Enseigne>
      <Pays>${countryCode}</Pays>
      <CP>${postalCode}</CP>
      <Ville>${searchCity}</Ville>
      <NombreResultats>${nbResults}</NombreResultats>
      <Security>${securityKey}</Security>
    </WSI4_PointRelais_Recherche>
  </soap:Body>
</soap:Envelope>`
    });

    if (!response.ok) throw new Error('Erreur réseau API Mondial Relay');

    const xmlData = await response.text();
    const statMatch = xmlData.match(/<STAT>(\d+)<\/STAT>/);
    const statCode = statMatch ? statMatch[1] : null;

    if (statCode !== '0') {
      const errorCodes: Record<string, string> = {
        '80': 'Service non activé',
        '93': 'Aucun résultat trouvé',
      };
      return NextResponse.json({
        points: [],
        relayPoints: [],
        error: errorCodes[statCode || ''] || `Erreur Mondial Relay (${statCode})`
      });
    }

    // Parsing et conversion en format compatible Frontend (camelCase)
    const relayPoints = parseWorldRelayResponse(xmlData);

    return NextResponse.json({
      points: relayPoints,
      relayPoints: relayPoints
    });

  } catch (error: any) {
    console.error('Mondial Relay search error:', error);
    return NextResponse.json({ error: 'Erreur recherche', points: [] }, { status: 500 });
  }
}

function parseWorldRelayResponse(xml: string): any[] {
  const points: any[] = [];
  try {
    const relayRegex = /<PointRelais_Details>([\s\S]*?)<\/PointRelais_Details>/g;
    let match;

    while ((match = relayRegex.exec(xml)) !== null) {
      const relayXml = match[1];
      const getId = (tag: string) => {
        const regex = new RegExp(`<${tag}>(.*?)<\/${tag}>`);
        const m = relayXml.match(regex);
        return m ? m[1] : '';
      };

      const parseCoord = (val: string) => parseFloat(val.replace(',', '.')) || 0;

      // CORRECTION ICI : On mappe les noms XML (Majuscule) vers les noms React (minuscule)
      const relay = {
        id: getId('Num'),              // 'Num' devient 'id'
        name: getId('LgAdr1'),         // 'LgAdr1' devient 'name'
        address: getId('LgAdr3'),      // 'LgAdr3' devient 'address'
        city: getId('Ville'),          // 'Ville' devient 'city'
        postalCode: getId('CP'),       // 'CP' devient 'postalCode'
        country: getId('Pays'),
        latitude: parseCoord(getId('Latitude')),
        longitude: parseCoord(getId('Longitude')),
        distance: parseInt(getId('Distance')) || 0,
        provider: 'mondial-relay',     // Ajout pour compatibilité
        openingHours: [
          getId('Horaires_Lundi_string'),
          getId('Horaires_Mardi_string'),
          getId('Horaires_Mercredi_string'),
          getId('Horaires_Jeudi_string'),
          getId('Horaires_Vendredi_string'),
          getId('Horaires_Samedi_string'),
          getId('Horaires_Dimanche_string'),
        ].filter(Boolean).join(' # '),
      };

      if (relay.id) {
        points.push(relay);
      }
    }
  } catch (error) {
    console.error('Error parsing Mondial Relay XML:', error);
  }
  return points;
}