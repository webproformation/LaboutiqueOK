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

    const chronopostAccount = process.env.CHRONOPOST_ACCOUNT_NUMBER;
    const chronopostPassword = process.env.CHRONOPOST_PASSWORD;

    if (!chronopostAccount || !chronopostPassword) {
      console.warn('Chronopost credentials not configured');
      return NextResponse.json({
        points: [],
        message: 'Configuration Chronopost manquante'
      });
    }

    const response = await fetch('https://ws.chronopost.fr/recherchebt-ws-cxf/PointRelaisServiceWS?wsdl', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://cxf.recherchepointrelais.webservice.chronopost.fr/recherchePointRelais'
      },
      body: `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:cxf="http://cxf.recherchepointrelais.webservice.chronopost.fr/">
  <soapenv:Header/>
  <soapenv:Body>
    <cxf:recherchePointRelais>
      <accountNumber>${chronopostAccount}</accountNumber>
      <password>${chronopostPassword}</password>
      <zipCode>${postalCode}</zipCode>
      <city>${city}</city>
      <countryCode>FR</countryCode>
      <type>P</type>
      <maxPointChronopost>10</maxPointChronopost>
      <maxDistanceSearch>50</maxDistanceSearch>
    </cxf:recherchePointRelais>
  </soapenv:Body>
</soapenv:Envelope>`
    });

    if (!response.ok) {
      throw new Error('Erreur API Chronopost');
    }

    const xmlData = await response.text();
    const points = parseChronopostResponse(xmlData);

    return NextResponse.json({ points });

  } catch (error: any) {
    console.error('Chronopost search error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recherche Chronopost', points: [] },
      { status: 500 }
    );
  }
}

function parseChronopostResponse(xml: string): any[] {
  const points: any[] = [];

  return points;
}
