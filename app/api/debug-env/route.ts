import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'NON DÉFINI';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'NON DÉFINI';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'NON DÉFINI';

  // Extraire les identifiants des clés pour vérifier quelle instance est utilisée
  let urlInstance = 'INCONNU';
  if (supabaseUrl.includes('qcqbtmvbvipsxwjlgjvk')) {
    urlInstance = 'qcqbtmvbvipsxwjlgjvk (PRODUCTION ✅)';
  } else if (supabaseUrl.includes('hondlefoprhtrpxnumyj')) {
    urlInstance = 'hondlefoprhtrpxnumyj (ANCIEN ❌)';
  } else if (supabaseUrl.includes('ftgclacfleknkqbfbsbs')) {
    urlInstance = 'ftgclacfleknkqbfbsbs (ANCIEN ❌)';
  }

  let anonKeyInstance = 'INCONNU';
  if (anonKey !== 'NON DÉFINI') {
    try {
      const anonKeyPayload = JSON.parse(atob(anonKey.split('.')[1]));
      anonKeyInstance = anonKeyPayload.ref;
      if (anonKeyInstance === 'qcqbtmvbvipsxwjlgjvk') {
        anonKeyInstance += ' (PRODUCTION ✅)';
      } else if (anonKeyInstance === 'hondlefoprhtrpxnumyj') {
        anonKeyInstance += ' (ANCIEN ❌)';
      } else if (anonKeyInstance === 'ftgclacfleknkqbfbsbs') {
        anonKeyInstance += ' (ANCIEN ❌)';
      }
    } catch (e) {
      anonKeyInstance = 'ERREUR DE DÉCODAGE';
    }
  }

  let serviceKeyInstance = 'INCONNU';
  if (serviceKey !== 'NON DÉFINI') {
    try {
      const serviceKeyPayload = JSON.parse(atob(serviceKey.split('.')[1]));
      serviceKeyInstance = serviceKeyPayload.ref;
      if (serviceKeyInstance === 'qcqbtmvbvipsxwjlgjvk') {
        serviceKeyInstance += ' (PRODUCTION ✅)';
      } else if (serviceKeyInstance === 'hondlefoprhtrpxnumyj') {
        serviceKeyInstance += ' (ANCIEN ❌)';
      } else if (serviceKeyInstance === 'ftgclacfleknkqbfbsbs') {
        serviceKeyInstance += ' (ANCIEN ❌)';
      }
    } catch (e) {
      serviceKeyInstance = 'ERREUR DE DÉCODAGE';
    }
  }

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    supabase: {
      url: {
        value: supabaseUrl,
        instance: urlInstance,
        isCorrect: supabaseUrl.includes('qcqbtmvbvipsxwjlgjvk')
      },
      anonKey: {
        defined: anonKey !== 'NON DÉFINI',
        instance: anonKeyInstance,
        isCorrect: anonKeyInstance.includes('qcqbtmvbvipsxwjlgjvk')
      },
      serviceRoleKey: {
        defined: serviceKey !== 'NON DÉFINI',
        instance: serviceKeyInstance,
        isCorrect: serviceKeyInstance.includes('qcqbtmvbvipsxwjlgjvk')
      }
    },
    verdict: (
      supabaseUrl.includes('qcqbtmvbvipsxwjlgjvk') &&
      anonKeyInstance.includes('qcqbtmvbvipsxwjlgjvk') &&
      serviceKeyInstance.includes('qcqbtmvbvipsxwjlgjvk')
    ) ? '✅ TOUTES LES VARIABLES SONT CORRECTES' : '❌ CERTAINES VARIABLES SONT INCORRECTES'
  });
}
