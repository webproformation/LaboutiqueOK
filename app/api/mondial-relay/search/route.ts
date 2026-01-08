import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { postalCode, city } = await request.json();

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
    const points = parseWorldRelayResponse(xmlData);

    return NextResponse.json({ points });

  } catch (error: any) {
    console.error('Mondial Relay search error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recherche Mondial Relay', points: [] },
      { status: 500 }
    );
  }
}

function parseWorldRelayResponse(xml: string): any[] {
  const points: any[] = [];

  return points;
}
