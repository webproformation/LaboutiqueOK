import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RelayPoint {
  Id: string;
  Name: string;
  Address1: string;
  Address2?: string;
  PostCode: string;
  City: string;
  Country: string;
  Latitude: number;
  Longitude: number;
  Distance: number;
  OpeningHours: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { postalCode, country = 'FR', deliveryMode = '24R' } = await req.json();

    console.log('Mondial Relay search:', { postalCode, country, deliveryMode });

    if (!postalCode) {
      return new Response(
        JSON.stringify({ error: 'Code postal requis', points: [], relayPoints: [] }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const mondialRelayId = Deno.env.get('MONDIAL_RELAY_ID');
    const mondialRelayKey = Deno.env.get('MONDIAL_RELAY_KEY');

    if (!mondialRelayId || !mondialRelayKey) {
      console.warn('Mondial Relay credentials not configured');
      return new Response(
        JSON.stringify({
          points: [],
          relayPoints: [],
          message: 'Configuration Mondial Relay manquante'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <WSI4_PointRelais_Recherche xmlns="http://www.mondialrelay.fr/webservice/">
      <Enseigne>${mondialRelayId}</Enseigne>
      <Pays>${country}</Pays>
      <CP>${postalCode}</CP>
      <Ville></Ville>
      <NombreResultats>10</NombreResultats>
      <Security>${mondialRelayKey}</Security>
    </WSI4_PointRelais_Recherche>
  </soap:Body>
</soap:Envelope>`;

    console.log('Calling Mondial Relay API...');

    const response = await fetch('https://api.mondialrelay.com/Web_Services.asmx', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://www.mondialrelay.fr/webservice/WSI4_PointRelais_Recherche'
      },
      body: soapBody
    });

    if (!response.ok) {
      throw new Error('Erreur API Mondial Relay');
    }

    const xmlData = await response.text();
    console.log('Received XML response');

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

      return new Response(
        JSON.stringify({
          points: [],
          relayPoints: [],
          error: errorMessage,
          errorCode: statCode
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const relayPoints = parseWorldRelayResponse(xmlData);
    console.log(`Found ${relayPoints.length} relay points`);

    return new Response(
      JSON.stringify({
        points: relayPoints,
        relayPoints: relayPoints
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Mondial Relay search error:', error);
    return new Response(
      JSON.stringify({
        error: 'Erreur lors de la recherche Mondial Relay',
        points: [],
        relayPoints: [],
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function parseWorldRelayResponse(xml: string): RelayPoint[] {
  const points: RelayPoint[] = [];

  try {
    const relayRegex = /<PointRelais_Details>([\s\S]*?)<\/PointRelais_Details>/g;
    let match;

    while ((match = relayRegex.exec(xml)) !== null) {
      const relayXml = match[1];

      const getId = (tag: string): string => {
        const regex = new RegExp(`<${tag}>(.*?)<\/${tag}>`);
        const match = relayXml.match(regex);
        return match ? match[1] : '';
      };

      const relay: RelayPoint = {
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
