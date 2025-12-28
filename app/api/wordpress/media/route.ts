import { NextRequest, NextResponse } from 'next/server';

const WORDPRESS_USERNAME = process.env.WORDPRESS_USERNAME;
const WORDPRESS_APP_PASSWORD = process.env.WORDPRESS_APP_PASSWORD;

const getAuthHeader = () => {
  const credentials = Buffer.from(`${WORDPRESS_USERNAME}:${WORDPRESS_APP_PASSWORD}`).toString('base64');
  return `Basic ${credentials}`;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const search = searchParams.get('search') || '';
    const perPage = searchParams.get('per_page') || '20';

    const graphqlUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || '';
    const wpUrl = graphqlUrl.replace('/graphql', '');

    if (!wpUrl) {
      return NextResponse.json(
        { error: 'URL WordPress non configurée' },
        { status: 500 }
      );
    }

    if (!WORDPRESS_USERNAME || !WORDPRESS_APP_PASSWORD) {
      return NextResponse.json(
        { error: 'Configuration WordPress manquante' },
        { status: 500 }
      );
    }

    let url = `${wpUrl}/wp-json/wp/v2/media?per_page=${perPage}&page=${page}&orderby=date&order=desc&_=${Date.now()}`;

    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Authorization': getAuthHeader(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching WordPress media:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des médias' },
      { status: 500 }
    );
  }
}
