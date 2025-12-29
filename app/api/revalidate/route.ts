import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Vérifier le secret du webhook pour la sécurité (depuis header ou query param)
    const authHeader = request.headers.get('x-webhook-secret');
    const { searchParams } = new URL(request.url);
    const secretFromQuery = searchParams.get('secret');
    const pathFromQuery = searchParams.get('path');

    const expectedSecret = process.env.WEBHOOK_SECRET || process.env.VERCEL_REVALIDATE_TOKEN;

    if (!expectedSecret) {
      console.error('[revalidate] WEBHOOK_SECRET ou VERCEL_REVALIDATE_TOKEN non configuré dans les variables d\'environnement');
      return NextResponse.json(
        { message: 'Configuration serveur manquante' },
        { status: 500 }
      );
    }

    // Accepter le secret soit depuis le header soit depuis le query param
    const providedSecret = authHeader || secretFromQuery;

    if (providedSecret !== expectedSecret) {
      console.warn('[revalidate] Tentative d\'accès non autorisée');
      return NextResponse.json(
        { message: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Si un path spécifique est fourni via query param (pour les webhooks simples)
    if (pathFromQuery) {
      console.log(`[revalidate] Revalidation du path spécifique: ${pathFromQuery}`);
      revalidatePath(pathFromQuery);
      return NextResponse.json({
        revalidated: true,
        timestamp: Date.now(),
        path: pathFromQuery,
        message: 'Cache Vercel vidé avec succès'
      });
    }

    // Lire le corps de la requête pour voir quelle table a été modifiée
    const body = await request.json();
    console.log('[revalidate] Webhook reçu:', {
      table: body.table,
      type: body.type,
      record: body.record ? 'présent' : 'absent'
    });

    // Revalider toute l'application pour s'assurer que tout est à jour
    revalidatePath('/', 'layout');

    // Revalider des chemins spécifiques en fonction de la table modifiée
    if (body.table) {
      switch (body.table) {
        case 'user_profiles':
        case 'user_roles':
          console.log('[revalidate] Revalidation des pages admin et profils');
          revalidatePath('/admin');
          revalidatePath('/account');
          break;

        case 'home_slides':
          console.log('[revalidate] Revalidation de la page d\'accueil');
          revalidatePath('/');
          break;

        case 'home_categories':
          console.log('[revalidate] Revalidation des catégories');
          revalidatePath('/');
          break;

        case 'featured_products':
        case 'hidden_diamond_finds':
          console.log('[revalidate] Revalidation des produits');
          revalidatePath('/');
          break;

        case 'live_streams':
          console.log('[revalidate] Revalidation du live');
          revalidatePath('/live');
          break;

        case 'orders':
        case 'order_items':
        case 'order_invoices':
          console.log('[revalidate] Revalidation des commandes');
          revalidatePath('/account/orders');
          revalidatePath('/admin/orders');
          break;

        case 'customer_reviews':
        case 'guestbook_entries':
          console.log('[revalidate] Revalidation des avis et livre d\'or');
          revalidatePath('/livre-dor');
          break;

        case 'scratch_game_settings':
        case 'wheel_game_settings':
          console.log('[revalidate] Revalidation des jeux');
          revalidatePath('/');
          break;

        case 'loyalty_tiers':
        case 'loyalty_rewards':
        case 'loyalty_points_history':
          console.log('[revalidate] Revalidation du système de fidélité');
          revalidatePath('/account/loyalty');
          break;

        case 'shipping_methods':
        case 'delivery_batches':
          console.log('[revalidate] Revalidation des méthodes de livraison');
          revalidatePath('/checkout');
          revalidatePath('/account/pending-deliveries');
          break;

        case 'coupons':
          console.log('[revalidate] Revalidation des coupons');
          revalidatePath('/account/coupons');
          break;

        case 'news_posts':
        case 'news_categories':
          console.log('[revalidate] Revalidation des actualités');
          revalidatePath('/actualites');
          break;

        case 'weekly_ambassadors':
          console.log('[revalidate] Revalidation ambassadrice');
          revalidatePath('/');
          break;

        default:
          console.log('[revalidate] Table non reconnue, revalidation globale uniquement');
      }
    }

    const timestamp = Date.now();
    console.log('[revalidate] Cache Vercel vidé avec succès à', new Date(timestamp).toISOString());

    return NextResponse.json({
      revalidated: true,
      timestamp,
      table: body.table,
      message: 'Cache Vercel vidé avec succès'
    });

  } catch (error: any) {
    console.error('[revalidate] Erreur:', error);
    return NextResponse.json(
      {
        message: 'Erreur lors de la revalidation',
        error: error.message
      },
      { status: 500 }
    );
  }
}

// Méthode GET pour tester que la route fonctionne
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Route de revalidation active',
    usage: 'Envoyez une requête POST avec le header x-webhook-secret'
  });
}
