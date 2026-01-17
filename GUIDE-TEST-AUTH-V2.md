# Guide de Test : Nouvelle Architecture d'Authentification

**Date :** 15 janvier 2026
**Version :** 2.0 (Architecture Réécrite)
**Statut :** ✅ BUILD RÉUSSI

---

## Changements Majeurs

### Architecture Avant
```
lib/supabase-middleware.ts → middleware.ts → API (getSession)
❌ getSession() ne valide pas le JWT côté serveur
```

### Architecture Après
```
utils/supabase/middleware.ts → middleware.ts → API (getUser)
✅ getUser() valide le JWT côté serveur
```

---

## Nouveaux Fichiers

```
utils/supabase/
├── middleware.ts     ✅ Rafraîchit les tokens automatiquement
└── server.ts         ✅ Client Supabase pour API Routes

middleware.ts         ✅ Import mis à jour
app/api/games/claim-reward/route.ts  ✅ Utilise getUser()
```

---

## Actions OBLIGATOIRES Avant Test

### 1. Redémarrer le Serveur (CRITIQUE)
```bash
# Arrêter le serveur actuel (Ctrl+C)
# Puis relancer :
npm run dev
```

**POURQUOI ?** Le middleware ne sera actif qu'après redémarrage.

### 2. Se Reconnecter (Recommandé)
1. Se déconnecter du site
2. Vider les cookies (F12 → Application → Clear site data)
3. Se reconnecter

**POURQUOI ?** Pour obtenir des tokens frais.

---

## Tests à Effectuer

### Test 1 : Vérifier le Middleware

**Logs serveur attendus (après redémarrage) :**
```
ƒ Middleware                             148 kB
```

**Si vous ne voyez pas "ƒ Middleware" :**
- Le middleware n'est pas actif
- Vérifier que `middleware.ts` existe à la racine
- Redémarrer le serveur

---

### Test 2 : API Direct (Console Browser)

**Ouvrir DevTools (F12) → Console :**

```javascript
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

const result = await response.json();
console.log('Statut:', response.status);
console.log('Réponse:', result);
```

**Résultats attendus :**

#### ✅ Si Connecté (Succès)
```javascript
Statut: 200
Réponse: {
  success: true,
  message: "Coupon attribué avec succès",
  coupon: {
    code: "WIN10-...",
    type: "percentage",
    value: 10,
    description: "10% de réduction",
    valid_until: "2026-02-14T..."
  }
}
```

#### ❌ Si Non Connecté (Normal)
```javascript
Statut: 401
Réponse: {
  error: "Non authentifié - Veuillez vous reconnecter"
}
```

#### ⚠️ Si Coupon Manquant
```javascript
Statut: 404
Réponse: {
  error: "Type de coupon introuvable",
  coupon_code: "WIN10",
  message: "Le type de coupon doit être configuré..."
}
```

**Solution :** Créer le coupon dans `/admin/coupons`

---

### Test 3 : Vérifier les Logs Serveur

**Dans le terminal où tourne `npm run dev` :**

#### Logs Attendus (Succès)
```
[claim-reward] Auth check: {
  hasUser: true,
  hasError: false,
  userId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  errorMessage: undefined
}
```

#### Logs d'Erreur (Non Connecté)
```
[claim-reward] Auth check: {
  hasUser: false,
  hasError: true,
  userId: undefined,
  errorMessage: "..."
}
[claim-reward] No user found
```

---

### Test 4 : Jeu Card Flip Complet

#### Étape 1 : Préparer le Jeu
1. Aller sur `/admin/card-flip`
2. Éditer "Jeu de cartes d'accueil"
3. **Sélectionner un coupon** (WIN10 ou WIN5)
4. Sauvegarder

#### Étape 2 : Créer le Coupon (si nécessaire)
1. Aller sur `/admin/coupons`
2. Créer un nouveau coupon :
   - **Code :** WIN10
   - **Type :** percentage
   - **Valeur :** 10
   - **Description :** "10% de réduction"
3. Sauvegarder

#### Étape 3 : Jouer
1. Se connecter au site
2. Cliquer sur "Prévisualiser" dans `/admin/card-flip`
3. Retourner des cartes jusqu'à gagner

#### Résultat Attendu ✅
- Message "Félicitations !" avec feux d'artifice
- Coupon visible dans `/account/coupons`
- Dans les logs : `[claim-reward] Auth check: { hasUser: true, ... }`

---

## Débogage Avancé

### Problème 1 : Erreur 401 Persiste

#### Checklist de Vérification

**1. Le serveur a été redémarré ?**
```bash
# Dans le terminal serveur, chercher :
ƒ Middleware                             148 kB
```
- ✅ Si présent : Middleware actif
- ❌ Si absent : Redémarrer le serveur

**2. L'utilisateur est connecté ?**
```javascript
// Dans la console navigateur (F12)
document.cookie
// Doit contenir : sb-qcqbtmvbvipsxwjlgjvk-auth-token
```

**3. Les cookies sont envoyés ?**
- F12 → Network → Claim-reward → Headers → Cookie
- Doit contenir : `sb-qcqbtmvbvipsxwjlgjvk-auth-token=...`

**4. Les logs montrent quoi ?**
```bash
# Dans le terminal serveur
[claim-reward] Auth check: { hasUser: ?, ... }
```
- Si `hasUser: false` → Problème d'authentification
- Si `hasUser: true` → Authentification OK

---

### Problème 2 : "Cannot find module '@/utils/supabase/server'"

**Cause :** TypeScript ne trouve pas le module

**Solutions :**
1. Vérifier que le fichier existe :
   ```bash
   ls -lh utils/supabase/server.ts
   ```

2. Redémarrer le serveur Next.js :
   ```bash
   # Ctrl+C puis
   npm run dev
   ```

3. Nettoyer le cache :
   ```bash
   rm -rf .next
   npm run build
   ```

---

### Problème 3 : Pas de Logs [claim-reward]

**Cause :** L'API n'est pas appelée ou le serveur ne log pas

**Solutions :**
1. Vérifier dans Network (F12) que la requête est bien envoyée
2. Vérifier le code de statut HTTP
3. Regarder l'onglet Console pour les erreurs frontend

---

### Problème 4 : "Type de coupon introuvable"

**Cause :** Le coupon WIN10 n'existe pas dans `coupon_types`

**Solution :**
```sql
-- Via Supabase Dashboard → SQL Editor
INSERT INTO coupon_types (code, type, value, description)
VALUES ('WIN10', 'percentage', 10, '10% de réduction')
ON CONFLICT (code) DO NOTHING;
```

Ou via l'interface admin : `/admin/coupons`

---

## Comparaison getSession() vs getUser()

### getSession() (ANCIEN - Ne pas utiliser)
```typescript
const { data: { session } } = await supabase.auth.getSession()
```

**Comportement :**
- ❌ Lit seulement les cookies localement
- ❌ Ne valide PAS le JWT côté serveur
- ❌ Peut retourner une session expirée
- ❌ Moins sécurisé

**Problèmes :**
- Retourne une session même si le token est invalide
- Ne détecte pas les tokens révoqués
- Problèmes de synchronisation

---

### getUser() (NOUVEAU - Utiliser toujours)
```typescript
const { data: { user } } = await supabase.auth.getUser()
```

**Comportement :**
- ✅ Valide le JWT via l'API Supabase
- ✅ Vérifie que le token est valide
- ✅ Détecte les tokens révoqués
- ✅ Plus sécurisé

**Avantages :**
- Retourne null si le token est invalide
- Garantit que l'utilisateur est authentifié
- Recommandé officiellement par Supabase

---

## Architecture Complète

```
┌──────────────────────────────────────────────────────────────┐
│ NAVIGATEUR                                                   │
│ - Cookies: sb-qcqbtmvbvipsxwjlgjvk-auth-token               │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ POST /api/games/claim-reward
                         │ (cookies envoyés automatiquement)
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ MIDDLEWARE (middleware.ts)                                   │
│ - Import: utils/supabase/middleware                          │
│ - Fonction: updateSession()                                  │
│ - Actions:                                                   │
│   1. createServerClient avec cookies.getAll()               │
│   2. Appelle supabase.auth.getUser()                        │
│   3. Rafraîchit le token si nécessaire                      │
│   4. Met à jour response.cookies                            │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ Cookies mis à jour
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ API ROUTE (app/api/games/claim-reward/route.ts)             │
│ - Import: utils/supabase/server                             │
│ - Fonction: createClient()                                  │
│ - Actions:                                                   │
│   1. createServerClient avec cookieStore.getAll()           │
│   2. Appelle supabase.auth.getUser()                        │
│   3. Valide le JWT côté serveur                             │
│   4. Retourne user (ou null si invalide)                    │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ user.id disponible
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ LOGIQUE MÉTIER                                               │
│ - Vérifier coupon_type                                       │
│ - Créer user_coupon                                          │
│ - Retourner succès/erreur                                    │
└──────────────────────────────────────────────────────────────┘
```

---

## Commandes Utiles

### Vérifier la Structure
```bash
tree -L 2 utils/
# Doit afficher :
# utils/
# └── supabase/
#     ├── middleware.ts
#     └── server.ts
```

### Vérifier les Imports
```bash
grep -n "utils/supabase" middleware.ts app/api/games/claim-reward/route.ts
```

### Vérifier le Build
```bash
npm run build | grep Middleware
# Doit afficher :
# ƒ Middleware                             148 kB
```

### Nettoyer le Cache
```bash
rm -rf .next node_modules/.cache
npm run dev
```

---

## Prochaines Étapes

### Si Tout Fonctionne ✅
1. Appliquer la même logique aux autres API routes :
   - `/api/storage/upload`
   - `/api/orders/*`
   - `/api/stripe/*`
2. Supprimer l'ancien fichier :
   ```bash
   rm lib/supabase-middleware.ts
   ```
3. Documenter les changements
4. Déployer en production

### Si Problèmes Persistent ❌
1. Vérifier les logs serveur ligne par ligne
2. Tester avec un utilisateur différent
3. Vider complètement les cookies et se reconnecter
4. Vérifier que le .env est correct

---

## Points Clés à Retenir

### ✅ À Faire
- Toujours utiliser `getUser()` dans les API Routes
- Toujours utiliser `createClient()` depuis `utils/supabase/server`
- Toujours redémarrer le serveur après modification du middleware
- Toujours vérifier les logs serveur pour déboguer

### ❌ À Éviter
- Ne jamais utiliser `getSession()` dans les API Routes
- Ne jamais créer manuellement un client Supabase dans les routes
- Ne pas oublier de redémarrer le serveur
- Ne pas ignorer les logs d'erreur

---

## Documentation de Référence

**Fichiers Modifiés :**
- `utils/supabase/middleware.ts` (nouveau)
- `utils/supabase/server.ts` (nouveau)
- `middleware.ts` (import mis à jour)
- `app/api/games/claim-reward/route.ts` (getUser)

**Documentation :**
- `RAPPORT-REWRITE-AUTH-COMPLETE.md` - Architecture complète
- `GUIDE-TEST-AUTH-V2.md` - Ce guide
- `STATUT-AUTH-FINAL.md` - Statut précédent

**Supabase Docs :**
- [Server-Side Auth](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [getUser() Reference](https://supabase.com/docs/reference/javascript/auth-getuser)

---

**Le système est prêt. Redémarrez et testez.**

---

**Auteur :** Assistant IA
**Date :** 15 janvier 2026
**Version :** 2.0
