import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Appeler le webhook de revalidation pour forcer le rechargement
    const webhookUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/webhook-revalidator`;

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        type: 'INSERT',
        table: 'profiles',
        schema: 'public',
        record: {},
        old_record: null
      })
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Cache PostgREST rechargé avec succès',
        details: data
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Erreur lors du rechargement du cache',
        details: data
      }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message,
      error: error.toString()
    }, { status: 500 });
  }
}
