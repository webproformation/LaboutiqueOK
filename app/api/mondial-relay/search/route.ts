import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { postalCode, country = 'FR', deliveryMode = '24R' } = await request.json();

    if (!postalCode) {
      return NextResponse.json(
        { error: 'Code postal requis' },
        { status: 400 }
      );
    }

    const mockRelayPoints = [
      {
        Id: 'FR001',
        Name: 'Tabac Presse',
        Address1: '12 Rue de la République',
        PostCode: postalCode,
        City: 'Centre Ville',
        Country: country,
        Latitude: 48.8566 + (Math.random() - 0.5) * 0.02,
        Longitude: 2.3522 + (Math.random() - 0.5) * 0.02,
        Distance: Math.floor(Math.random() * 5000),
        OpeningHours: deliveryMode === '24R' ? '0900-1230#0900-1230#0900-1230#0900-1230#0900-1230#0900-1230#0000' : '',
      },
      {
        Id: 'FR002',
        Name: 'Relay Shop',
        Address1: '45 Avenue des Champs',
        PostCode: postalCode,
        City: 'Centre Ville',
        Country: country,
        Latitude: 48.8566 + (Math.random() - 0.5) * 0.02,
        Longitude: 2.3522 + (Math.random() - 0.5) * 0.02,
        Distance: Math.floor(Math.random() * 5000),
        OpeningHours: deliveryMode === '24R' ? '0800-1900#0800-1900#0800-1900#0800-1900#0800-1900#0900-1700#0000' : '',
      },
      {
        Id: 'FR003',
        Name: deliveryMode === '24L' ? 'Locker Automatique Centre' : 'Point Relais Express',
        Address1: '78 Boulevard Principal',
        PostCode: postalCode,
        City: 'Centre Ville',
        Country: country,
        Latitude: 48.8566 + (Math.random() - 0.5) * 0.02,
        Longitude: 2.3522 + (Math.random() - 0.5) * 0.02,
        Distance: Math.floor(Math.random() * 5000),
        OpeningHours: deliveryMode === '24R' ? '0700-2000#0700-2000#0700-2000#0700-2000#0700-2000#0800-1800#0000' : '',
      },
    ];

    mockRelayPoints.sort((a, b) => (a.Distance || 0) - (b.Distance || 0));

    return NextResponse.json({
      success: true,
      relayPoints: mockRelayPoints,
    });
  } catch (error: any) {
    console.error('Error searching relay points:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la recherche' },
      { status: 500 }
    );
  }
}
