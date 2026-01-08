import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  let postalCode = '';
  let city = '';

  try {
    const body = await request.json();
    postalCode = body.postalCode;
    city = body.city;

    if (!postalCode || !city) {
      return NextResponse.json(
        { error: 'Code postal et ville requis' },
        { status: 400 }
      );
    }

    const glsUsername = process.env.GLS_USERNAME;
    const glsPassword = process.env.GLS_PASSWORD;

    if (!glsUsername || !glsPassword) {
      console.warn('GLS credentials not configured');
      return NextResponse.json({
        points: generateDemoGLSPoints(postalCode, city),
        demo: true,
        message: 'Configuration GLS manquante'
      });
    }

    const params = new URLSearchParams({
      country: 'FR',
      zipcode: postalCode,
      city: city,
      limit: '10'
    });

    const response = await fetch(`https://api.gls-group.eu/public/v1/parcelshops?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${glsUsername}:${glsPassword}`).toString('base64')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur API GLS');
    }

    const data = await response.json();
    const points = parseGLSResponse(data);

    return NextResponse.json({ points });

  } catch (error: any) {
    console.error('GLS search error:', error);

    return NextResponse.json({
      points: generateDemoGLSPoints(postalCode || '75001', city || 'Paris'),
      demo: true,
      message: 'Données de démonstration - API GLS non accessible'
    });
  }
}

function parseGLSResponse(data: any): any[] {
  const points: any[] = [];

  if (data && data.parcelshops) {
    return data.parcelshops.map((shop: any) => ({
      id: shop.id,
      name: shop.name,
      address: shop.address,
      city: shop.city,
      postalCode: shop.zipcode,
      latitude: shop.latitude,
      longitude: shop.longitude,
      distance: shop.distance,
      openingHours: formatGLSOpeningHours(shop.openingHours),
      provider: 'gls'
    }));
  }

  return points;
}

function formatGLSOpeningHours(hours: any): string {
  if (!hours) return 'Horaires non disponibles';
  return 'Lun-Sam: 9h-19h';
}

function generateDemoGLSPoints(postalCode: string, city: string): any[] {
  return [
    {
      id: 'gls-demo-1',
      name: `GLS ParcelShop ${city} Centre`,
      address: '15 Rue du Commerce',
      city: city,
      postalCode: postalCode,
      latitude: 48.8566 + Math.random() * 0.01,
      longitude: 2.3522 + Math.random() * 0.01,
      distance: 0.5,
      openingHours: 'Lun-Ven: 9h-19h, Sam: 9h-17h',
      provider: 'gls'
    },
    {
      id: 'gls-demo-2',
      name: `GLS Relais ${city} Nord`,
      address: '42 Avenue de la République',
      city: city,
      postalCode: postalCode,
      latitude: 48.8566 + Math.random() * 0.02,
      longitude: 2.3522 + Math.random() * 0.02,
      distance: 1.2,
      openingHours: 'Lun-Sam: 8h30-18h30',
      provider: 'gls'
    },
    {
      id: 'gls-demo-3',
      name: `GLS Point Relais ${city} Sud`,
      address: '88 Boulevard Saint-Michel',
      city: city,
      postalCode: postalCode,
      latitude: 48.8566 + Math.random() * 0.03,
      longitude: 2.3522 + Math.random() * 0.03,
      distance: 2.1,
      openingHours: 'Lun-Sam: 9h-19h',
      provider: 'gls'
    }
  ];
}
