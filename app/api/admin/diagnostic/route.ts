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
      message: response.ok ? 'Connecté' : 'Erreur de connexion',
      details: data
    });
  } catch (error: any) {
    results.push({
      name: 'WordPress GraphQL',
      status: 'error',
      message: error.message
    });
  }

  // Test WooCommerce API directement
  try {
    const auth = Buffer.from(
      `${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`
    ).toString('base64');

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
      name: 'WooCommerce API',
      status: response.ok ? 'success' : 'error',
      message: response.ok ? `Connecté - ${data.length || 0} produits trouvés` : 'Erreur de connexion',
      details: response.ok ? { productCount: data.length } : data
    });
  } catch (error: any) {
    results.push({
      name: 'WooCommerce API',
      status: 'error',
      message: error.message
    });
  }

  return results;
}

async function testSupabase(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test environnement
  results.push({
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    status: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'success' : 'error',
    message: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Définie' : 'Manquante',
    details: process.env.NEXT_PUBLIC_SUPABASE_URL
  });

  results.push({
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    status: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'success' : 'error',
    message: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Définie' : 'Manquante'
  });

  results.push({
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    status: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'success' : 'error',
    message: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Définie' : 'Manquante'
  });

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

  return results;
}

async function testAll(): Promise<TestResult[]> {
  const [dbResults, wpResults, sbResults] = await Promise.all([
    testDatabase(),
    testWordPress(),
    testSupabase()
  ]);

  return [...dbResults, ...wpResults, ...sbResults];
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
      case 'supabase':
        results = await testSupabase();
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
