# Correction : Authentification API via Cookies (SSR)

**Date :** 15 janvier 2026
**Problème :** L'API `/api/games/claim-reward` renvoyait 401 car elle n'utilisait pas les cookies Supabase
**Statut :** Résolu

---

## Problème initial

L'API route utilisait deux approches incorrectes :

### Approche 1 (incorrecte) : Client client-side
```typescript
import { createClient } from '@/lib/supabase';
const supabase = createClient();
const { data: { session } } = await supabase.auth.getSession();
// ❌ Ne fonctionne pas dans une API route
```

### Approche 2 (incorrecte) : Service Role Key + Token dans headers
```typescript
const supabase = createClient(url, serviceKey);
const token = request.headers.get('authorization').replace('Bearer ', '');
const { data: { user } } = await supabase.auth.getUser(token);
// ❌ Contournement non standard, nécessite code supplémentaire côté client
```

---

## Solution appliquée

### 1. Installation de @supabase/ssr

```bash
npm install @supabase/ssr
```

Ce package permet de créer un client Supabase côté serveur qui peut lire et écrire les cookies.

### 2. Réécriture de l'API avec createServerClient

**Fichier :** `app/api/games/claim-reward/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Gestion silencieuse des erreurs
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Gestion silencieuse des erreurs
          }
        },
      },
    }
  );

  // Récupération de la session depuis les cookies
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return NextResponse.json(
      { error: 'Non authentifié - Session invalide' },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  // ... reste de la logique
}
```

### 3. Simplification du frontend

**Fichier :** `components/CardFlipGame.tsx`

**Avant :**
```typescript
const { data: { session } } = await supabase.auth.getSession();

const response = await fetch('/api/games/claim-reward', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    // ...
  },
});
```

**Après :**
```typescript
const response = await fetch('/api/games/claim-reward', {
  headers: {
    'Content-Type': 'application/json',
    // Plus besoin d'Authorization header
  },
});
```

### 4. Correction du fichier .env

Le `.env` pointait sur l'ancien projet `mcstv`. Correction :

```env
# ⚠️ VERROUILLAGE PROJET qcqbtmvbvipsxwjlgjvk
NEXT_PUBLIC_SUPABASE_URL=https://qcqbtmvbvipsxwjlgjvk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...q-4uGaHsuojj3ejo5IG4V-z2fx-ER9grHsRzYNkYn0c
SUPABASE_SERVICE_ROLE_KEY=eyJ...mFJHZV-VdueE_okBTqkVh18tRvee94a5Z-k5TM4FQxM
```

---

## Avantages de cette approche

### 1. Standard Next.js 13+
- Utilise l'API officielle `cookies()` de Next.js
- Compatible avec App Router
- Pas de contournement nécessaire

### 2. Sécurité
- Les cookies httpOnly sont automatiquement gérés
- Pas de token exposé dans le code JavaScript client
- Protection CSRF native

### 3. Simplicité
- Pas besoin de récupérer et envoyer le token côté client
- Code plus court et plus lisible
- Moins de points de défaillance

### 4. Performance
- Pas de double requête (getSession puis fetch)
- Les cookies sont automatiquement envoyés avec chaque requête

---

## Flux d'authentification

```
┌─────────────────────┐
│  Navigateur         │
│  (cookies stockés)  │
└──────────┬──────────┘
           │
           │ POST /api/games/claim-reward
           │ (cookies envoyés automatiquement)
           │
           ▼
┌─────────────────────────────┐
│  API Route                  │
│  createServerClient         │
└──────────┬──────────────────┘
           │
           │ 1. Lit les cookies via cookies()
           │ 2. Vérifie la session
           │ 3. Récupère userId
           │
           ▼
┌─────────────────────────────┐
│  Base de données            │
│  - Vérifie coupon_type      │
│  - Insère user_coupon       │
└─────────────────────────────┘
```

---

## Différences avec l'ancienne approche

| Aspect | Ancienne approche | Nouvelle approche |
|--------|-------------------|-------------------|
| **Package** | `@supabase/supabase-js` | `@supabase/ssr` |
| **Client** | `createClient` (service role) | `createServerClient` |
| **Auth** | Token dans headers | Cookies automatiques |
| **Frontend** | Doit envoyer token | Requête simple |
| **Sécurité** | Token exposé | Cookies httpOnly |
| **Complexité** | Élevée | Faible |

---

## Test du système

### Scénario de test

1. **Se connecter** avec un compte utilisateur
2. **Aller sur** `/admin/card-flip`
3. **Cliquer** sur "Prévisualiser"
4. **Jouer** et gagner
5. **Vérifier** :
   - Pas d'erreur 401
   - Toast de succès
   - Coupon apparaît dans `/account/coupons`

### Commandes de test

```bash
# Vérifier que le build passe
npm run build

# Tester l'API localement
curl -X POST http://localhost:3000/api/games/claim-reward \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=<votre-token>" \
  -d '{
    "game_type": "card_flip_game",
    "game_id": "uuid",
    "coupon_code": "CARDFLIP20",
    "has_won": true
  }'
```

---

## Logs de débogage

Pour déboguer les problèmes d'authentification :

```typescript
// Dans l'API route
console.log('Session:', session ? 'présente' : 'absente');
console.log('User ID:', session?.user.id);
console.log('Cookies:', cookieStore.getAll());
```

---

## Erreurs courantes

### 1. Erreur 401 - Session invalide

**Cause :** L'utilisateur n'est pas connecté ou la session a expiré

**Solution :** Vérifier que l'utilisateur est bien connecté

### 2. Cookies non envoyés

**Cause :** Problème de domaine ou de configuration CORS

**Solution :** Vérifier que l'API est sur le même domaine que le frontend

### 3. TypeError: cookieStore.set is not a function

**Cause :** Version Next.js trop ancienne

**Solution :** Mettre à jour Next.js vers 13.4+

---

## Migration vers d'autres API routes

Pour appliquer ce pattern à d'autres API routes :

```typescript
// 1. Installer @supabase/ssr si pas déjà fait
npm install @supabase/ssr

// 2. Importer les bons packages
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// 3. Créer le client avec les cookies
const cookieStore = cookies();
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
      set: (name, value, options) => {
        try { cookieStore.set({ name, value, ...options }); } catch {}
      },
      remove: (name, options) => {
        try { cookieStore.set({ name, value: '', ...options }); } catch {}
      },
    },
  }
);

// 4. Vérifier la session
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

## Fichiers modifiés

```
package.json                             (ajout de @supabase/ssr)
.env                                     (correction URL qcqbtmv)
app/api/games/claim-reward/route.ts      (createServerClient)
components/CardFlipGame.tsx              (suppression du token dans headers)
```

---

## Validation

- ✅ Build réussi
- ✅ Pas d'erreur TypeScript
- ✅ API utilise createServerClient
- ✅ Frontend simplifié (pas de token)
- ✅ .env pointe sur qcqbtmv

---

## Conclusion

L'API `/api/games/claim-reward` utilise maintenant l'approche standard recommandée par Supabase pour les API routes Next.js. L'authentification se fait automatiquement via les cookies, sans besoin d'envoyer de token manuellement.

**Prêt pour déploiement** ✅

---

**Auteur :** Assistant IA
**Date :** 15 janvier 2026
**Version :** 2.0
