# Rapport : Réécriture Complète de l'Authentification Serveur

**Date :** 15 janvier 2026
**Objectif :** Résoudre l'erreur 401 en réécrivant la chaîne d'authentification serveur

---

## Architecture Complète Réécrite

### 1. Nouvelle Structure des Fichiers ✅

```
utils/supabase/
├── middleware.ts     → Gestion des sessions dans le middleware
└── server.ts         → Client Supabase pour les API Routes
```

### 2. Fichiers Créés/Modifiés

#### `utils/supabase/middleware.ts` ✅
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()
  return response
}
```

**Fonctionnement :**
- Lit tous les cookies de la requête avec `getAll()`
- Met à jour les cookies de la réponse avec `setAll()`
- Appelle `getUser()` pour rafraîchir le token automatiquement

---

#### `utils/supabase/server.ts` ✅
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Les cookies en lecture seule dans les Server Components
          }
        },
      },
    }
  )
}
```

**Fonctionnement :**
- Fonction simple qui crée un client Supabase pour les API Routes
- Utilise `cookies()` de Next.js 13+
- Gère les cookies en lecture seule avec un try/catch

---

#### `middleware.ts` (racine) ✅
```typescript
import { type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

**Changement :**
- Import depuis `@/utils/supabase/middleware` au lieu de `@/lib/supabase-middleware`

---

#### `app/api/games/claim-reward/route.ts` ✅
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Utilise getUser() au lieu de getSession()
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    console.log('[claim-reward] Auth check:', {
      hasUser: !!user,
      hasError: !!userError,
      userId: user?.id,
      errorMessage: userError?.message,
    });

    if (userError) {
      console.error('[claim-reward] User error:', userError);
      return NextResponse.json(
        { error: 'Erreur d\'authentification', details: userError.message },
        { status: 401 }
      );
    }

    if (!user) {
      console.error('[claim-reward] No user found');
      return NextResponse.json(
        { error: 'Non authentifié - Veuillez vous reconnecter' },
        { status: 401 }
      );
    }

    const userId = user.id;
    // ... reste de la logique
```

**Changements Majeurs :**
1. Utilise `createClient()` depuis `@/utils/supabase/server`
2. **Utilise `getUser()` au lieu de `getSession()`**
   - `getUser()` vérifie le JWT côté serveur
   - Plus fiable que `getSession()` qui lit seulement les cookies
3. Variable `user` au lieu de `session`
4. Accès direct à `user.id` au lieu de `session.user.id`

---

## Différences Clés : getUser() vs getSession()

### `getSession()` (ancien)
```typescript
const { data: { session } } = await supabase.auth.getSession()
// Lit seulement les cookies, pas de validation serveur
```

**Problèmes :**
- Ne vérifie PAS le JWT côté serveur
- Peut retourner une session expirée
- Moins sécurisé

### `getUser()` (nouveau)
```typescript
const { data: { user } } = await supabase.auth.getUser()
// Valide le JWT côté serveur via l'API Supabase
```

**Avantages :**
- ✅ Vérifie le JWT côté serveur
- ✅ Garantit que le token est valide
- ✅ Plus sécurisé
- ✅ Recommandé par Supabase pour les API Routes

---

## Flux d'Authentification Complet

```
┌─────────────────────────────────────────────────────────────┐
│ 1. REQUÊTE INITIALE                                         │
│    Browser → POST /api/games/claim-reward                   │
│    Cookies: sb-qcqbtmvbvipsxwjlgjvk-auth-token              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. MIDDLEWARE (middleware.ts)                               │
│    → Appelle updateSession()                                │
│    → Crée createServerClient avec cookies.getAll()          │
│    → Appelle supabase.auth.getUser()                        │
│    → Rafraîchit le token si nécessaire                      │
│    → Met à jour les cookies via response.cookies.set()      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. API ROUTE (claim-reward/route.ts)                        │
│    → Appelle createClient()                                 │
│    → Crée createServerClient avec cookieStore.getAll()      │
│    → Appelle supabase.auth.getUser()                        │
│    → Valide le JWT côté serveur                             │
│    → user.id disponible si authentifié                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. TRAITEMENT                                                │
│    → Attribution du coupon                                   │
│    → Insertion dans user_coupons                            │
│    → Retour JSON avec succès                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Avantages de cette Architecture

### 1. Simplicité ✅
- Moins de code
- Logique centralisée dans `utils/supabase/`
- Facile à maintenir

### 2. Sécurité ✅
- Utilise `getUser()` pour valider les tokens
- Double vérification : middleware + API route
- Pas de cookies en dur

### 3. Performance ✅
- Le middleware rafraîchit automatiquement les tokens
- Pas de re-fetch inutile

### 4. Compatibilité ✅
- Suit les bonnes pratiques Supabase SSR
- Compatible Next.js 13+ App Router
- Utilise `@supabase/ssr` officiel

---

## Actions à Effectuer

### 1. Redémarrer le Serveur (OBLIGATOIRE)
```bash
# Ctrl+C pour arrêter
npm run dev
```

### 2. Supprimer l'Ancien Fichier (Optionnel)
```bash
rm lib/supabase-middleware.ts
```

### 3. Tester l'API
```javascript
// Dans la console du navigateur (F12)
const response = await fetch('/api/games/claim-reward', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    game_type: 'card_flip',
    game_id: crypto.randomUUID(),
    coupon_code: 'WIN10',
    has_won: true
  })
});
console.log(response.status, await response.json());
```

**Résultat attendu :**
```javascript
200 {
  success: true,
  message: "Coupon attribué avec succès",
  coupon: { ... }
}
```

---

## Logs de Débogage

### Logs Middleware (dans la console serveur)
```
[Middleware] Refreshing token for path: /api/games/claim-reward
```

### Logs API Route (dans la console serveur)
```
[claim-reward] Auth check: {
  hasUser: true,
  hasError: false,
  userId: "uuid-de-l-utilisateur",
  errorMessage: undefined
}
```

**Si erreur 401 :**
```
[claim-reward] No user found
```

---

## Débogage

### Problème : Erreur 401 Persiste

#### Vérification 1 : Middleware Actif
```bash
# Vérifier que le fichier existe
ls -lh utils/supabase/middleware.ts

# Vérifier l'import dans middleware.ts
grep "utils/supabase/middleware" middleware.ts
```

#### Vérification 2 : Cookies Présents
**DevTools → Application → Cookies**
- `sb-qcqbtmvbvipsxwjlgjvk-auth-token`
- `sb-qcqbtmvbvipsxwjlgjvk-auth-token-code-verifier`

#### Vérification 3 : Logs Serveur
**Terminal serveur - Chercher :**
```
[claim-reward] Auth check
```

**Si `hasUser: false` :**
- Se déconnecter
- Vider les cookies
- Se reconnecter

---

## Comparaison Avant/Après

### AVANT (Problématique)
```typescript
// middleware.ts
import { updateSession } from '@/lib/supabase-middleware'

// claim-reward/route.ts
const supabase = createServerClient(...)
const { data: { session } } = await supabase.auth.getSession()
// ❌ getSession() ne valide pas le JWT
```

### APRÈS (Solution)
```typescript
// middleware.ts
import { updateSession } from '@/utils/supabase/middleware'

// claim-reward/route.ts
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
// ✅ getUser() valide le JWT côté serveur
```

---

## Fichiers Supprimés/Obsolètes

Ces fichiers peuvent être supprimés :
- `lib/supabase-middleware.ts` (remplacé par `utils/supabase/middleware.ts`)

---

## Prochaines Étapes

Si tout fonctionne :
1. ✅ Appliquer la même logique aux autres API routes
2. ✅ Supprimer les anciens fichiers
3. ✅ Tester en conditions réelles
4. ✅ Déployer en production

---

## Commandes de Vérification

### Vérifier la structure
```bash
tree utils/supabase/
# Doit montrer :
# utils/supabase/
# ├── middleware.ts
# └── server.ts
```

### Vérifier les imports
```bash
grep -r "utils/supabase" middleware.ts app/api/games/claim-reward/route.ts
```

### Vérifier le build
```bash
npm run build
```

---

## Documentation de Référence

**Fichiers Créés :**
- `utils/supabase/middleware.ts` - Middleware Supabase
- `utils/supabase/server.ts` - Client serveur
- `RAPPORT-REWRITE-AUTH-COMPLETE.md` - Ce rapport

**Fichiers Modifiés :**
- `middleware.ts` - Import mis à jour
- `app/api/games/claim-reward/route.ts` - Utilise `getUser()`

**Documentation Officielle :**
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [getUser() vs getSession()](https://supabase.com/docs/reference/javascript/auth-getuser)

---

**Auteur :** Assistant IA
**Date :** 15 janvier 2026
**Version :** 2.0 (Réécriture Complète)
