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

    const glsUsername = process.env.GLS_USERNAME;
    const glsPassword = process.env.GLS_PASSWORD;

    if (!glsUsername || !glsPassword) {
      console.warn('GLS credentials not configured');
      return NextResponse.json({
        points: [],
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
    return NextResponse.json(
      { error: 'Erreur lors de la recherche GLS', points: [] },
      { status: 500 }
    );
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
