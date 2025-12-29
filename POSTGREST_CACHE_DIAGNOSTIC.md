# Diagnostic du Cache PostgREST

## Problème Identifié
Erreurs 400/404 sur les requêtes PostgREST malgré l'existence des tables et fonctions RPC dans la base de données.

## Diagnostic Effectué

### 1. Vérification des Tables (✓ OK)
Toutes les tables sont de type `table` (pas de materialized views):
- `cart_items` ✓
- `delivery_batches` ✓
- `loyalty_points` ✓
- `page_visits` ✓
- `profiles` ✓
- `user_sessions` ✓
- `wishlist_items` ✓

### 2. Vérification des Fonctions RPC (✓ OK)
Toutes les fonctions existent avec les bonnes permissions:
- `get_user_role` ✓
- `upsert_user_session` ✓
- `get_loyalty_tier` ✓
- `award_daily_connection_bonus` ✓

Permissions accordées: `anon`, `authenticated`, `service_role`

### 3. Actions de Rechargement Effectuées
```sql
-- Notification pour forcer le rechargement du schéma
NOTIFY pgrst, 'reload schema';

-- Changement DDL pour forcer la détection
CREATE OR REPLACE FUNCTION public.force_postgrest_reload_trigger() ...
DROP FUNCTION IF EXISTS public.force_postgrest_reload_trigger();

-- Notification supplémentaire
NOTIFY pgrst, 'reload config';
```

## Solutions Mises en Place

### Solution Temporaire: API Routes Bypass
Création d'API routes Next.js qui bypassent PostgREST:

1. **`/api/cart`** - Gestion du panier
2. **`/api/loyalty`** - Points de fidélité
3. **`/api/profile`** - Profils utilisateurs
4. **`/api/wishlist`** - Liste de souhaits
5. **`/api/delivery-batches`** - Lots de livraison
6. **`/api/analytics`** - Tracking

Ces API utilisent `supabaseService` (service_role) pour accéder directement à la base sans passer par PostgREST.

### Contexts Migrés
- ✓ CartContext
- ✓ LoyaltyContext
- ✓ AuthContext (partie profil)
- ✓ WishlistContext
- ✓ AnalyticsTracker

## Causes Possibles du Cache (à Vérifier)

### 1. Cache CDN (Cloudflare)
**Action requise:** Vérifier si Cloudflare est activé sur `*.supabase.co`
- Aller dans le dashboard Cloudflare
- Vérifier les règles de cache pour `/rest/v1/*`
- Purger le cache si nécessaire

### 2. Cache Navigateur/Client
Les API routes contournent ce problème en utilisant `cache: 'no-store'`

### 3. Proxy/Load Balancer
**Action requise:** Vérifier les headers HTTP retournés
```bash
curl -i 'https://qcqbtmvbvipsxwjlgjvk.supabase.co/rest/v1/profiles?select=id&limit=1' \
  -H "apikey: YOUR_ANON_KEY"
```
Vérifier: `Cache-Control`, `ETag`, `Age`, `Via`

### 4. Cache PostgREST Interne
Le NOTIFY devrait avoir résolu ce problème. Si non:
- Attendre 30 secondes pour que PostgREST détecte le changement
- Ou contacter le support Supabase pour forcer un redémarrage

## Test de Validation

Page de test créée: `/test-postgrest-reload`

Cette page teste:
1. Accès à toutes les tables via Supabase client
2. Appels aux fonctions RPC
3. Requêtes HTTP directes avec headers anti-cache

## Recommandations

### Court Terme
Continuer à utiliser les API routes pour garantir la stabilité du site.

### Moyen Terme
1. Tester la page `/test-postgrest-reload` après 30 minutes
2. Si les tests passent, migrer progressivement vers PostgREST direct
3. Si les tests échouent, contacter le support Supabase avec ce document

### Long Terme
Si le problème persiste:
1. Demander au support Supabase de vérifier la configuration du cache
2. Vérifier si d'autres projets Supabase ont le même problème
3. Considérer une migration vers un autre projet Supabase (fresh start)

## Headers Recommandés pour Contourner le Cache

Pour toute requête PostgREST directe, utiliser:
```javascript
{
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
  cache: 'no-store'
}
```

## Contact Support Supabase

Si le problème persiste après 1 heure, fournir:
1. Ce document de diagnostic
2. Les résultats de `/test-postgrest-reload`
3. Les headers HTTP d'une requête curl
4. L'heure exacte des dernières migrations (pour logs)
