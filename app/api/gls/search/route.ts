import { NextRequest, NextResponse } from 'next/server';

// AJOUTEZ VOS VILLES DE TEST ICI
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'ARMENTIERES': { lat: 50.6887, lng: 2.8804 },
  'ARMENTIÈRES': { lat: 50.6887, lng: 2.8804 },
  'LILLE': { lat: 50.6292, lng: 3.0573 },
  'PARIS': { lat: 48.8566, lng: 2.3522 },
  'LYON': { lat: 45.7640, lng: 4.8357 },
  'MARSEILLE': { lat: 43.2965, lng: 5.3698 },
  'BORDEAUX': { lat: 44.8378, lng: -0.5792 },
  'NANTES': { lat: 47.2184, lng: -1.5536 },
  'STRASBOURG': { lat: 48.5734, lng: 7.7521 },
  // Nouveaux ajouts pour vos tests :
  'GRAVELINES': { lat: 50.9865, lng: 2.1264 },
  'DUNKERQUE': { lat: 51.0343, lng: 2.3768 },
  'CALAIS': { lat: 50.9513, lng: 1.8587 },
  'HAZEBROUCK': { lat: 50.7226, lng: 2.5356 },
};

export async function POST(request: NextRequest) {
  let postalCode = '';
  let city = '';

  try {
    const body = await request.json();
    postalCode = body.postalCode;
    city = body.city || '';

    if (!postalCode) {
      return NextResponse.json(
        { error: 'Code postal requis' },
        { status: 400 }
      );
    }

    const glsUsername = process.env.GLS_USERNAME;
    const glsPassword = process.env.GLS_PASSWORD;

    // Si pas d'identifiants, on passe en mode DÉMO
    if (!glsUsername || !glsPassword) {
      console.warn('GLS credentials not configured - Using Mock Data');
      await new Promise(resolve => setTimeout(resolve, 600)); // Petit délai réaliste
      
      return NextResponse.json({
        points: generateDemoGLSPoints(postalCode, city),
        demo: true,
        message: 'Configuration GLS manquante'
      });
    }

    // --- APPEL API RÉEL (Si configuré) ---
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

    // Fallback en cas d'erreur de l'API réelle
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
      latitude: parseFloat(shop.latitude),
      longitude: parseFloat(shop.longitude),
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

// --- FONCTION DE DÉMO INTELLIGENTE ---
function generateDemoGLSPoints(postalCode: string, cityInput: string): any[] {
  // On nettoie l'entrée (majuscules, espaces)
  const searchCity = cityInput ? cityInput.toUpperCase().trim() : 'ARMENTIERES';
  
  // On cherche les coordonnées de la ville dans notre liste
  // Si la ville n'est pas trouvée, on prend Armentières par défaut
  const baseCoords = CITY_COORDINATES[searchCity] || CITY_COORDINATES['ARMENTIERES'];

  return [
    {
      id: 'gls-demo-1',
      name: `GLS ParcelShop ${cityInput || 'Centre'} Principal`,
      address: '15 Rue du Commerce',
      city: cityInput || 'Ville',
      postalCode: postalCode,
      // On place le point légèrement à côté du centre ville
      latitude: baseCoords.lat + 0.002, 
      longitude: baseCoords.lng - 0.002,
      distance: 500,
      openingHours: 'Lun-Ven: 9h-19h, Sam: 9h-17h',
      provider: 'gls'
    },
    {
      id: 'gls-demo-2',
      name: `GLS Relais ${cityInput || 'Nord'} Express`,
      address: '42 Avenue de la République',
      city: cityInput || 'Ville',
      postalCode: postalCode,
      latitude: baseCoords.lat + 0.005,
      longitude: baseCoords.lng + 0.003,
      distance: 1200,
      openingHours: 'Lun-Sam: 8h30-18h30',
      provider: 'gls'
    },
    {
      id: 'gls-demo-3',
      name: `GLS Point Relais ${cityInput || 'Sud'}`,
      address: '88 Boulevard Saint-Michel',
      city: cityInput || 'Ville',
      postalCode: postalCode,
      latitude: baseCoords.lat - 0.004,
      longitude: baseCoords.lng + 0.001,
      distance: 2100,
      openingHours: 'Lun-Sam: 9h-19h',
      provider: 'gls'
    }
  ];
}