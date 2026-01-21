import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16',
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // --- DEBUG : Affiche ce que le frontend envoie ---
    console.log("📦 Body reçu par l'API Stripe:", body);

    // On récupère les champs, qu'ils s'appellent 'total' ou 'amount'
    let { orderId, userId, total, amount, metadata } = body;

    // Normalisation : si total est vide mais que amount existe, on l'utilise
    if (total === undefined && amount !== undefined) {
      total = amount;
    }

    // Validation stricte
    if (!total || !userId) {
      console.error("❌ Données manquantes:", { orderId, userId, total });
      return NextResponse.json(
        { error: `Données manquantes. Reçu: total=${total}, userId=${userId}` },
        { status: 400 }
      );
    }

    // Conversion en centimes
    const amountInCents = Math.round(parseFloat(total) * 100);

    // Création de l'intention Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderId: orderId ? orderId.toString() : 'n/a',
        userId: userId.toString(),
        ...(metadata || {}),
      },
    });

    // Mise à jour optionnelle de la commande (si orderId est présent)
    if (orderId) {
      await supabase
        .from('orders')
        .update({ stripe_payment_intent: paymentIntent.id })
        .eq('id', orderId);
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id
    });

  } catch (error: any) {
    console.error('🚨 Erreur API Stripe:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}