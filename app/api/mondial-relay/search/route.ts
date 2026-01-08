import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { postalCode, city, deliveryMode = '24R' } = await request.json();

    if (!postalCode || !city) {
      return NextResponse.json(
        { error: 'Code postal et ville requis' },
        { status: 400 }
      );
    }

    const mondialRelayId = process.env.MONDIAL_RELAY_ID;
    const mondialRelayKey = process.env.MONDIAL_RELAY_KEY;

    if (!mondialRelayId || !mondialRelayKey) {
      console.warn('Mondial Relay credentials not configured');
      return NextResponse.json({
        points: [],
        message: 'Configuration Mondial Relay manquante'
      });
    }

    const response = await fetch('https://api.mondialrelay.com/Web_Services.asmx', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://www.mondialrelay.fr/webservice/WSI4_PointRelais_Recherche'
      },
      body: `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <WSI4_PointRelais_Recherche xmlns="http://www.mondialrelay.fr/webservice/">
      <Enseigne>${mondialRelayId}</Enseigne>
      <Pays>FR</Pays>
      <CP>${postalCode}</CP>
      <Ville>${city}</Ville>
      <NombreResultats>10</NombreResultats>
      <Security>${mondialRelayKey}</Security>
    </WSI4_PointRelais_Recherche>
  </soap:Body>
</soap:Envelope>`
    });

    if (!response.ok) {
      throw new Error('Erreur API Mondial Relay');
    }

    const xmlData = await response.text();

    const statRegex = /<STAT>(\d+)<\/STAT>/;
    const statMatch = xmlData.match(statRegex);
    const statCode = statMatch ? statMatch[1] : null;

    if (statCode !== '0') {
      const errorCodes: Record<string, string> = {
        '1': 'Enseigne invalide',
        '2': 'Numéro d\'enseigne vide',
        '74': 'Sécurité invalide',
        '80': 'Service non activé',
      };

      const errorMessage = statCode ? errorCodes[statCode] || 'Erreur inconnue' : 'Code erreur manquant';
      console.error(`Mondial Relay error: ${statCode} - ${errorMessage}`);

      return NextResponse.json({
        points: [],
        relayPoints: [],
        error: errorMessage,
        errorCode: statCode
      });
    }

    const relayPoints = parseWorldRelayResponse(xmlData);

    return NextResponse.json({
      points: relayPoints,
      relayPoints: relayPoints
    });

  } catch (error: any) {
    console.error('Mondial Relay search error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recherche Mondial Relay', points: [], relayPoints: [] },
      { status: 500 }
    );
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
        const match = relayXml.match(regex);
        return match ? match[1] : '';
      };

      const relay = {
        Id: getId('Num'),
        Name: getId('LgAdr1'),
        Address1: getId('LgAdr3'),
        Address2: getId('LgAdr4'),
        PostCode: getId('CP'),
        City: getId('Ville'),
        Country: getId('Pays'),
        Latitude: parseFloat(getId('Latitude').replace(',', '.')) || 0,
        Longitude: parseFloat(getId('Longitude').replace(',', '.')) || 0,
        Distance: parseInt(getId('Distance')) || 0,
        OpeningHours: [
          getId('Horaires_Lundi'),
          getId('Horaires_Mardi'),
          getId('Horaires_Mercredi'),
          getId('Horaires_Jeudi'),
          getId('Horaires_Vendredi'),
          getId('Horaires_Samedi'),
          getId('Horaires_Dimanche'),
        ].join('#'),
      };

      if (relay.Id) {
        points.push(relay);
      }
    }
  } catch (error) {
    console.error('Error parsing Mondial Relay XML:', error);
  }

  return points;
}
