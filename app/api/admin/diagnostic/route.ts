import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-service';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: any;
}

async function testDatabase(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test des tables principales
  const tables = [
    'profiles', 'loyalty_points', 'delivery_batches', 'user_sessions',
    'page_visits', 'orders', 'cart_items', 'home_slides', 'featured_products'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabaseService
        .from(table)
        .select('*')
        .limit(1);

      results.push({
        name: `Table: ${table}`,
        status: error ? 'error' : 'success',
        message: error ? error.message : 'Accessible',
        details: { rowCount: data?.length || 0 }
      });
    } catch (error: any) {
      results.push({
        name: `Table: ${table}`,
        status: 'error',
        message: error.message
      });
    }
  }

  // Test des fonctions RPC
  const rpcFunctions = [
    { name: 'get_user_role', params: { p_user_id: '00000000-0000-0000-0000-000000000001' } },
    { name: 'get_loyalty_tier', params: { p_user_id: '00000000-0000-0000-0000-000000000001' } },
    { name: 'analytics_upsert_session', params: { p_session_id: '00000000-0000-0000-0000-000000000001' } }
  ];

  for (const func of rpcFunctions) {
    try {
      const { data, error } = await supabaseService.rpc(func.name, func.params);

      results.push({
        name: `RPC: ${func.name}`,
        status: error ? 'error' : 'success',
        message: error ? error.message : 'Fonctionne',
        details: data
      });
    } catch (error: any) {
      results.push({
        name: `RPC: ${func.name}`,
        status: 'error',
        message: error.message
      });
    }
  }

  return results;
}

async function testWordPress(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const auth = Buffer.from(
    `${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`
  ).toString('base64');

  // Test WordPress GraphQL
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{
          generalSettings {
            title
            url
          }
        }`
      })
    });

    const data = await response.json();

    results.push({
      name: 'WordPress GraphQL',
      status: response.ok ? 'success' : 'error',
      message: response.ok ? `Connecté - ${data?.data?.generalSettings?.title || 'OK'}` : 'Erreur de connexion',
      details: data
    });
  } catch (error: any) {
    results.push({
      name: 'WordPress GraphQL',
      status: 'error',
      message: error.message
    });
  }

  // Test WordPress Users via REST API
  try {
    const response = await fetch(
      `${process.env.WORDPRESS_URL}/wp-json/wp/v2/users?per_page=1`,
      {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      }
    );

    const data = await response.json();

    results.push({
      name: 'WordPress - Utilisateurs',
      status: response.ok ? 'success' : 'error',
      message: response.ok ? `${response.headers.get('X-WP-Total') || data.length || 0} utilisateurs` : 'Erreur',
      details: response.ok ? { total: response.headers.get('X-WP-Total'), sample: data[0]?.name } : data
    });
  } catch (error: any) {
    results.push({
      name: 'WordPress - Utilisateurs',
      status: 'error',
      message: error.message
    });
  }

  // Test WordPress Posts (actualités)
  try {
    const response = await fetch(
      `${process.env.WORDPRESS_URL}/wp-json/wp/v2/posts?per_page=1`,
      {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      }
    );

    const data = await response.json();

    results.push({
      name: 'WordPress - Actualités/Posts',
      status: response.ok ? 'success' : 'error',
      message: response.ok ? `${response.headers.get('X-WP-Total') || data.length || 0} articles` : 'Erreur',
      details: response.ok ? { total: response.headers.get('X-WP-Total'), sample: data[0]?.title?.rendered } : data
    });
  } catch (error: any) {
    results.push({
      name: 'WordPress - Actualités/Posts',
      status: 'error',
      message: error.message
    });
  }

  return results;
}

async function testWooCommerce(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const auth = Buffer.from(
    `${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`
  ).toString('base64');

  // Test produits
  try {
    const response = await fetch(
      `${process.env.WORDPRESS_URL}/wp-json/wc/v3/products?per_page=1`,
      {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      }
    );

    const data = await response.json();

    results.push({
      name: 'WooCommerce - Produits',
      status: response.ok ? 'success' : 'error',
      message: response.ok ? `${response.headers.get('X-WP-Total') || data.length || 0} produits` : 'Erreur',
      details: response.ok ? { total: response.headers.get('X-WP-Total'), sample: data[0]?.name } : data
    });
  } catch (error: any) {
    results.push({
      name: 'WooCommerce - Produits',
      status: 'error',
      message: error.message
    });
  }

  // Test clients
  try {
    const response = await fetch(
      `${process.env.WORDPRESS_URL}/wp-json/wc/v3/customers?per_page=1`,
      {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      }
    );

    const data = await response.json();

    results.push({
      name: 'WooCommerce - Clients',
      status: response.ok ? 'success' : 'error',
      message: response.ok ? `${response.headers.get('X-WP-Total') || data.length || 0} clients` : 'Erreur',
      details: response.ok ? { total: response.headers.get('X-WP-Total'), sample: data[0]?.email } : data
    });
  } catch (error: any) {
    results.push({
      name: 'WooCommerce - Clients',
      status: 'error',
      message: error.message
    });
  }

  // Test commandes
  try {
    const response = await fetch(
      `${process.env.WORDPRESS_URL}/wp-json/wc/v3/orders?per_page=1`,
      {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      }
    );

    const data = await response.json();

    results.push({
      name: 'WooCommerce - Commandes',
      status: response.ok ? 'success' : 'error',
      message: response.ok ? `${response.headers.get('X-WP-Total') || data.length || 0} commandes` : 'Erreur',
      details: response.ok ? { total: response.headers.get('X-WP-Total'), sample: data[0]?.number } : data
    });
  } catch (error: any) {
    results.push({
      name: 'WooCommerce - Commandes',
      status: 'error',
      message: error.message
    });
  }

  // Test méthodes de livraison
  try {
    const response = await fetch(
      `${process.env.WORDPRESS_URL}/wp-json/wc/v3/shipping/zones`,
      {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      }
    );

    const data = await response.json();

    results.push({
      name: 'WooCommerce - Zones de livraison',
      status: response.ok ? 'success' : 'error',
      message: response.ok ? `${data.length || 0} zones configurées` : 'Erreur',
      details: response.ok ? { zones: data.map((z: any) => z.name) } : data
    });
  } catch (error: any) {
    results.push({
      name: 'WooCommerce - Zones de livraison',
      status: 'error',
      message: error.message
    });
  }

  // Test catégories
  try {
    const response = await fetch(
      `${process.env.WORDPRESS_URL}/wp-json/wc/v3/products/categories?per_page=1`,
      {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      }
    );

    const data = await response.json();

    results.push({
      name: 'WooCommerce - Catégories',
      status: response.ok ? 'success' : 'error',
      message: response.ok ? `${response.headers.get('X-WP-Total') || data.length || 0} catégories` : 'Erreur',
      details: response.ok ? { total: response.headers.get('X-WP-Total'), sample: data[0]?.name } : data
    });
  } catch (error: any) {
    results.push({
      name: 'WooCommerce - Catégories',
      status: 'error',
      message: error.message
    });
  }

  return results;
}

async function testSupabase(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test connexion directe REST API
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
      {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        }
      }
    );

    results.push({
      name: 'Supabase REST API',
      status: response.ok ? 'success' : 'error',
      message: response.ok ? 'API REST accessible' : 'Erreur API REST',
      details: { statusCode: response.status }
    });
  } catch (error: any) {
    results.push({
      name: 'Supabase REST API',
      status: 'error',
      message: error.message
    });
  }

  // Test Auth API
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`,
      {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        }
      }
    );

    results.push({
      name: 'Supabase Auth API',
      status: response.ok ? 'success' : 'error',
      message: response.ok ? 'Auth API accessible' : 'Erreur Auth API',
      details: { statusCode: response.status }
    });
  } catch (error: any) {
    results.push({
      name: 'Supabase Auth API',
      status: 'error',
      message: error.message
    });
  }

  return results;
}

async function testConnectionKeys(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Supabase Keys
  results.push({
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    status: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'success' : 'error',
    message: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Définie' : 'Manquante',
    details: { value: process.env.NEXT_PUBLIC_SUPABASE_URL }
  });

  results.push({
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    status: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'success' : 'error',
    message: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? `Définie (${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...)` : 'Manquante'
  });

  results.push({
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    status: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'success' : 'error',
    message: process.env.SUPABASE_SERVICE_ROLE_KEY ? `Définie (${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...)` : 'Manquante'
  });

  // WordPress Keys
  results.push({
    name: 'WORDPRESS_URL',
    status: process.env.WORDPRESS_URL ? 'success' : 'error',
    message: process.env.WORDPRESS_URL || 'Manquante',
    details: { value: process.env.WORDPRESS_URL }
  });

  results.push({
    name: 'NEXT_PUBLIC_WORDPRESS_API_URL',
    status: process.env.NEXT_PUBLIC_WORDPRESS_API_URL ? 'success' : 'error',
    message: process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'Manquante',
    details: { value: process.env.NEXT_PUBLIC_WORDPRESS_API_URL }
  });

  // WooCommerce Keys
  results.push({
    name: 'WC_CONSUMER_KEY',
    status: process.env.WC_CONSUMER_KEY ? 'success' : 'error',
    message: process.env.WC_CONSUMER_KEY ? `Définie (${process.env.WC_CONSUMER_KEY.substring(0, 15)}...)` : 'Manquante'
  });

  results.push({
    name: 'WC_CONSUMER_SECRET',
    status: process.env.WC_CONSUMER_SECRET ? 'success' : 'error',
    message: process.env.WC_CONSUMER_SECRET ? `Définie (${process.env.WC_CONSUMER_SECRET.substring(0, 15)}...)` : 'Manquante'
  });

  // Payment Keys
  results.push({
    name: 'STRIPE_SECRET_KEY',
    status: process.env.STRIPE_SECRET_KEY ? 'success' : 'warning',
    message: process.env.STRIPE_SECRET_KEY ? 'Définie' : 'Non configurée'
  });

  results.push({
    name: 'PAYPAL_CLIENT_ID',
    status: process.env.PAYPAL_CLIENT_ID ? 'success' : 'warning',
    message: process.env.PAYPAL_CLIENT_ID ? 'Définie' : 'Non configurée'
  });

  results.push({
    name: 'PAYPAL_CLIENT_SECRET',
    status: process.env.PAYPAL_CLIENT_SECRET ? 'success' : 'warning',
    message: process.env.PAYPAL_CLIENT_SECRET ? 'Définie' : 'Non configurée'
  });

  // Email Keys (Brevo)
  results.push({
    name: 'BREVO_API_KEY',
    status: process.env.BREVO_API_KEY ? 'success' : 'warning',
    message: process.env.BREVO_API_KEY ? 'Définie' : 'Non configurée'
  });

  return results;
}

async function testAll(): Promise<TestResult[]> {
  const [dbResults, wpResults, wooResults, sbResults, keysResults] = await Promise.all([
    testDatabase(),
    testWordPress(),
    testWooCommerce(),
    testSupabase(),
    testConnectionKeys()
  ]);

  return [...keysResults, ...sbResults, ...dbResults, ...wpResults, ...wooResults];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    let results: TestResult[] = [];

    switch (type) {
      case 'database':
        results = await testDatabase();
        break;
      case 'wordpress':
        results = await testWordPress();
        break;
      case 'woocommerce':
        results = await testWooCommerce();
        break;
      case 'supabase':
        results = await testSupabase();
        break;
      case 'keys':
        results = await testConnectionKeys();
        break;
      case 'all':
        results = await testAll();
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
