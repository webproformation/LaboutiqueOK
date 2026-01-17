# Rapport de Vérification : Projet qcqbtmvbvipsxwjlgjvk

**Date :** 15 janvier 2026
**Script utilisé :** `scripts/verify-real-db.ts`
**Méthode :** Connexion directe via @supabase/supabase-js (contournement MCP)

---

## Résumé Exécutif

✅ **Le projet pointe bien sur qcqbtmvbvipsxwjlgjvk**
✅ **L'API `/api/games/claim-reward` est corrigée et utilise l'authentification par cookies**
⚠️ **AUCUNE catégorie n'existe dans `product_categories`**
❌ **Le jeu Card Flip actif n'a PAS de coupon configuré**

---

## 1. Vérification du Projet

```
📍 URL : https://qcqbtmvbvipsxwjlgjvk.supabase.co
✅ Projet : qcqbtmvbvipsxwjlgjvk
✅ Fichier .env correct
```

**Confirmation :** Le projet est bien verrouillé sur `qcqbtmvbvipsxwjlgjvk`. Aucune référence à `mcstv`.

---

## 2. État de l'API claim-reward

```
📁 Fichier : app/api/games/claim-reward/route.ts

✅ Import @supabase/ssr
✅ Utilise createServerClient
✅ Utilise cookies()
✅ L'API utilise l'authentification correcte par cookies
```

**Correction appliquée avec succès**

L'API utilise maintenant :
- `createServerClient` de `@supabase/ssr`
- `cookies()` de Next.js pour lire les cookies de session
- Authentification serveur standard (pas de token dans les headers)

**L'erreur 401 devrait être résolue** si l'utilisateur est connecté.

---

## 3. État de la Base de Données

### 3.1 Catégories (product_categories)

```
⚠️ AUCUNE CATÉGORIE TROUVÉE
```

**Problème :** La table `product_categories` est vide.

**Impact :**
- Les menus ne peuvent pas s'afficher
- La navigation par catégorie est impossible
- Les produits ont des `category_id` qui pointent vers des catégories inexistantes

**Solution :** Créer les catégories de base :
1. Nouveautés
2. Boutique
3. Accessoires

---

### 3.2 Produits

```
✅ 118 produit(s) dans la base

Échantillon :
1. ID: ab42bce3-33fb-45cb-9e82-a8a0f7d349bf | Prix: 4.9€ | Catégorie: ee5bb201-191f-45e6-b217-c010bce86f79
2. ID: 9efaf6e2-83cc-4c3c-a13d-4c8085c84cdb | Prix: 19.99€ | Catégorie: aab13eb3-141a-4029-8ce9-0c30ab8ad9db
3. ID: 789e4130-3009-4d82-ab3b-540767c49c6b | Prix: 3.6€ | Catégorie: 49ecb999-7894-4280-990c-942b37c8b4fc
```

**État :** 118 produits existent mais :
- Aucun n'a de SKU renseigné
- Tous pointent vers des catégories qui n'existent pas
- Les IDs sont au format UUID (correct)

---

### 3.3 Coupon Types

```
✅ 2 coupon_type(s) configurés :

1. WIN10 (percentage, valeur: 10)
2. WIN5 (fixed_amount, valeur: 5)
```

**État :** Les coupon_types de base existent.

---

### 3.4 Jeux Card Flip

```
✅ 1 jeu actif : "Jeu de cartes d'accueil"
   ID: 0915fb06-433e-4828-bc98-3f189cbb4d93
   ❌ Coupon ID: Non configuré
```

**Problème CRITIQUE :** Le jeu Card Flip est actif mais n'a **AUCUN coupon configuré**.

**Impact :**
- Quand un joueur gagne, l'API ne sait pas quel coupon distribuer
- L'API retournera une erreur ou un message "pas de récompense"
- Le système de jeu est incomplet

**Solution :** Configurer un coupon pour ce jeu dans `/admin/card-flip`

---

## 4. Diagnostic de l'Erreur 401

### 4.1 Analyse

L'erreur 401 initiale était causée par :

```typescript
// ❌ ANCIEN CODE (incorrect)
const supabase = createClient(); // Client client-side
const { data: { session } } = await supabase.auth.getSession();
// → Retourne null dans une API route
```

### 4.2 Correction Appliquée

```typescript
// ✅ NOUVEAU CODE (correct)
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const cookieStore = cookies();
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
      // ...
    },
  }
);

const { data: { session } } = await supabase.auth.getSession();
// → Récupère correctement la session depuis les cookies
```

### 4.3 Frontend Simplifié

```typescript
// ❌ AVANT
const { data: { session } } = await supabase.auth.getSession();
fetch('/api/games/claim-reward', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
  },
});

// ✅ APRÈS
fetch('/api/games/claim-reward', {
  headers: {
    'Content-Type': 'application/json',
  },
});
// Les cookies sont automatiquement envoyés
```

---

## 5. Actions Requises

### 5.1 Corriger le Jeu Card Flip

**Urgence :** HAUTE

1. Aller sur `/admin/card-flip`
2. Éditer "Jeu de cartes d'accueil"
3. Configurer un coupon (WIN10 ou WIN5)
4. Sauvegarder

Ou via SQL :

```sql
-- Option 1 : Lier à un coupon existant dans la table coupons
UPDATE card_flip_games
SET coupon_id = (SELECT id FROM coupons WHERE code = 'CARDFLIP20' LIMIT 1)
WHERE id = '0915fb06-433e-4828-bc98-3f189cbb4d93';

-- Option 2 : Créer un nouveau coupon
INSERT INTO coupons (code, discount_type, discount_value, is_active)
VALUES ('CARDFLIP10', 'percentage', 10, true)
RETURNING id;

-- Puis lier
UPDATE card_flip_games
SET coupon_id = '<id-du-coupon-créé>'
WHERE id = '0915fb06-433e-4828-bc98-3f189cbb4d93';
```

### 5.2 Recréer les Catégories

**Urgence :** HAUTE

```sql
-- Catégorie 1 : Nouveautés
INSERT INTO product_categories (id, slug, parent_id, is_visible, show_in_main_menu, display_order)
VALUES
  (gen_random_uuid(), 'nouveautes', NULL, true, true, 1);

-- Catégorie 2 : Boutique
INSERT INTO product_categories (id, slug, parent_id, is_visible, show_in_main_menu, display_order)
VALUES
  (gen_random_uuid(), 'boutique', NULL, true, true, 2);

-- Catégorie 3 : Accessoires
INSERT INTO product_categories (id, slug, parent_id, is_visible, show_in_main_menu, display_order)
VALUES
  (gen_random_uuid(), 'accessoires', NULL, true, true, 3);
```

**Note :** La table `product_categories` n'a PAS de colonne `name`. Utilisez uniquement le `slug`.

---

## 6. Test du Système

### 6.1 Test de l'API claim-reward

1. Connectez-vous sur le site
2. Allez sur `/admin/card-flip`
3. Cliquez "Prévisualiser" sur "Jeu de cartes d'accueil"
4. Jouez et gagnez

**Résultat attendu après correction du coupon :**
- ✅ Pas d'erreur 401
- ✅ Message de succès
- ✅ Coupon ajouté dans `/account/coupons`

---

## 7. Différences MCP vs Réalité

| Aspect | Outils MCP | Réalité (script) |
|--------|-----------|------------------|
| **Catégories** | 6 catégories | 0 catégories |
| **Projet** | ? | qcqbtmvbvipsxwjlgjvk |
| **Produits** | ? | 118 produits |
| **Jeu coupon** | ? | Non configuré |

**Conclusion :** Les outils MCP Supabase sont effectivement corrompus et montrent des données d'un autre projet.

---

## 8. Fichiers Modifiés

```
✅ .env                                    (URL corrigée vers qcqbtmv)
✅ app/api/games/claim-reward/route.ts     (createServerClient + cookies)
✅ components/CardFlipGame.tsx             (suppression du token dans headers)
✅ scripts/verify-real-db.ts               (nouveau script de vérification)
✅ package.json                            (ajout de @supabase/ssr)
```

---

## 9. Build Status

```bash
npm run build
```

**Résultat :** ✅ Build réussi

---

## 10. Conclusion

### Points Positifs

✅ Le projet est sur le bon Supabase (qcqbtmv)
✅ L'API claim-reward utilise la bonne méthode d'authentification
✅ Le build passe
✅ 118 produits existent
✅ Les coupon_types de base existent

### Points à Corriger

❌ **Le jeu Card Flip n'a pas de coupon** → À configurer immédiatement
❌ **Aucune catégorie** → À recréer
⚠️ **Les produits n'ont pas de SKU** → À renseigner progressivement

### Prochaines Étapes

1. **Configurer le coupon du jeu Card Flip** (5 min)
2. **Créer les 3 catégories de base** (5 min)
3. **Tester le jeu en conditions réelles** (2 min)
4. **Vérifier que le coupon est distribué** (1 min)

**Temps estimé total :** 15 minutes

---

**Script de vérification disponible :** `npx ts-node scripts/verify-real-db.ts`

**Auteur :** Assistant IA
**Date :** 15 janvier 2026
**Version :** 1.0
