import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-service';

export async function POST() {
  try {
    const results = [];
    const webhookUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/webhook-revalidator`;

    // Liste des tables à trigger
    const tables = [
      'profiles', 'loyalty_points', 'delivery_batches', 'user_sessions',
      'page_visits', 'orders', 'cart_items', 'home_slides', 'featured_products'
    ];

    // Appeler le webhook pour chaque table
    for (const table of tables) {
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            type: 'UPDATE',
            table,
            schema: 'public',
            record: {},
            old_record: null
          })
        });

        results.push({
          table,
          status: response.ok ? 'success' : 'error',
          statusCode: response.status
        });
      } catch (error) {
        results.push({
          table,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Exécuter aussi la migration aggressive
    try {
      await supabaseService.rpc('pg_notify', {
        channel: 'pgrst',
        payload: 'reload schema'
      });
    } catch (error) {
      // Ignore si la fonction n'existe pas
    }

    // Attendre un peu
    await new Promise(resolve => setTimeout(resolve, 2000));

    return NextResponse.json({
      success: true,
      message: `Cache PostgREST rechargé pour ${tables.length} tables`,
      details: results
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message,
      error: error.toString()
    }, { status: 500 });
  }
}
