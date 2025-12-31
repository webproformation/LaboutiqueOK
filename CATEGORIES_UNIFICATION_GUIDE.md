# Guide d'Unification de la Table Categories

## Problème Résolu

**Conflit de tables** : Le frontend cherchait `categories` (erreur 400) mais le backend utilisait `woocommerce_categories_cache` (erreur 500).

## Solution Appliquée

### 1. Table Unique : `public.categories`

Toutes les références à `woocommerce_categories_cache` ont été remplacées par `categories`.

**Structure de la table `categories` :**

```sql
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  woocommerce_id integer UNIQUE NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  parent_id uuid REFERENCES categories(id),
  woocommerce_parent_id integer DEFAULT 0,
  image_url text,
  count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 2. Mapping Sécurisé des Images

L'API extrait maintenant correctement l'URL de l'image :

```typescript
// Extraction sécurisée de l'URL de l'image
let imageUrl = null;
if (cat.image) {
  if (typeof cat.image === 'string') {
    imageUrl = cat.image;
  } else if (cat.image.src) {
    imageUrl = cat.image.src;  // ✅ Extraction correcte
  }
}
```

### 3. Upsert Basé sur `woocommerce_id`

```typescript
const { data, error } = await supabase
  .from('categories')
  .upsert(formattedCategories, {
    onConflict: 'woocommerce_id',  // ✅ Clé unique
    ignoreDuplicates: false
  })
  .select();
```

### 4. Logs Détaillés

Tous les logs sont préfixés par `[Categories Cache API]` :

```
[Categories Cache API] ===== POST REQUEST STARTED =====
[Categories Cache API] Step 1: Parsing request body...
[Categories Cache API] Step 2: Checking environment variables...
[Categories Cache API] Step 3: Creating Supabase client...
[Categories Cache API] Step 4: Validating categories array...
[Categories Cache API] Step 5: Formatting X categories for table 'categories'...
[Categories Cache API] Step 6: Sample category data: {...}
[Categories Cache API] Step 7: Upserting X categories into 'categories' table...
[Categories Cache API] ===== SUCCESS =====
```

En cas d'erreur :

```
[Categories Cache API] ===== ERROR DURING UPSERT =====
[Categories Cache API] Supabase upsert error: {
  message: "...",
  details: "...",
  hint: "...",
  code: "..."
}
[Categories Cache API] Sample formatted category: {...}
```

### 5. Réponse JSON Garantie

L'API retourne **TOUJOURS** un JSON valide, même en cas d'erreur ou de liste vide :

**GET `/api/categories-cache`**

```json
{
  "success": true,
  "categories": [...],
  "count": 15
}
```

Même si aucune catégorie :

```json
{
  "success": true,
  "categories": [],
  "count": 0
}
```

**POST `/api/categories-cache`**

```json
{
  "success": true,
  "count": 15,
  "inserted": 15,
  "message": "15 catégories synchronisées",
  "data": [...]
}
```

En cas d'erreur :

```json
{
  "success": false,
  "error": "Message d'erreur clair",
  "details": "...",
  "hint": "...",
  "code": "23505"
}
```

## API Routes Modifiées

### `/api/categories-cache` (Modifié ✅)

- **GET** : Récupère les catégories depuis la table `categories`
- **POST** : Synchronise les catégories WooCommerce vers la table `categories`

**Paramètres GET :**
- `parent_only=true` : Récupère uniquement les catégories parentes

**Body POST :**
```json
{
  "action": "sync",
  "categories": [
    {
      "id": 123,
      "name": "Vêtements",
      "slug": "vetements",
      "parent": 0,
      "description": "...",
      "image": { "src": "https://..." },
      "count": 45
    }
  ]
}
```

### `/api/woocommerce/categories` (Inchangé)

Cette API charge **directement depuis WooCommerce** sans cache.
Elle reste indépendante et fonctionnelle.

## Comment Tester

### 1. Test Manual via Page Admin

Accédez à `/admin/test-categories-cache` :

- **Bouton "Récupérer les Catégories"** : Teste GET
- **Bouton "Tester la Synchronisation"** : Teste POST avec 2 catégories de test

### 2. Test via cURL

**GET - Récupérer le cache :**

```bash
curl https://www.laboutiquedemorgane.com/api/categories-cache
```

**POST - Synchroniser :**

```bash
curl -X POST https://www.laboutiquedemorgane.com/api/categories-cache \
  -H "Content-Type: application/json" \
  -d '{
    "action": "sync",
    "categories": [
      {
        "id": 999,
        "name": "Test Category",
        "slug": "test-category",
        "parent": 0,
        "description": "Test",
        "count": 5,
        "image": { "src": "https://example.com/image.jpg" }
      }
    ]
  }'
```

### 3. Vérifier les Logs Vercel

Dans le Dashboard Vercel → Logs, filtrez par :
```
[Categories Cache API]
```

Vous verrez :
- Chaque étape du processus
- Les erreurs Supabase exactes si échec
- Les données formatées avant insertion

## Schéma de Synchronisation

```
WooCommerce API
      ↓
  (Fetch categories)
      ↓
/api/categories-cache POST
      ↓
  Extract image.src → image_url
      ↓
  Format pour table 'categories'
      ↓
  UPSERT sur woocommerce_id
      ↓
  Table: public.categories
```

## Différences Clés

| Ancienne Table | Nouvelle Table |
|----------------|----------------|
| `woocommerce_categories_cache` | `categories` |
| `category_id` (primary) | `id` (uuid primary) |
| `category_id` (unique) | `woocommerce_id` (unique) |
| `parent` (integer) | `woocommerce_parent_id` (integer) |
| N/A | `parent_id` (uuid, self-reference) |
| `image` (jsonb) | `image_url` (text) |
| N/A | `is_active` (boolean) |

## Avantages

✅ **Table unique** : Plus de confusion entre frontend et backend
✅ **Mapping sécurisé** : Extraction robuste de `image.src`
✅ **Logs détaillés** : Debugging facile avec logs étape par étape
✅ **Toujours JSON** : Pas d'erreur HTML, toujours `{ success: true/false }`
✅ **RLS activé** : Accès public en lecture, sécurisé
✅ **Self-referencing** : Support des catégories parentes via `parent_id`

## Corrections Frontend

### `/admin/home-categories`

**Problème** : Crash avec `b.filter is not a function` car le composant attendait un tableau mais recevait un objet `{ success: true, categories: [] }`.

**Solution appliquée** :

```typescript
// ✅ AVANT (LIGNE 90)
const cachedCategories = await response.json();
setAllWooCategories(cachedCategories || []);

// ✅ APRÈS
const data = await response.json();
const cachedCategories = Array.isArray(data.categories) ? data.categories : [];
setAllWooCategories(cachedCategories);
```

**Protection ajoutée** :

```typescript
// ✅ Protection contre les valeurs non-array (LIGNE 349)
const availableCategories = Array.isArray(allWooCategories)
  ? allWooCategories.filter(woo => !selectedCategories.some(home => home.category_slug === woo.slug))
  : [];
```

Même correction appliquée dans la fonction `refreshWooCategories()` (ligne 143).

## Prochaines Étapes

1. **Déployer sur Vercel**
2. **Tester via `/admin/home-categories`** - Plus de crash
3. **Tester via `/admin/test-categories-cache`**
4. **Synchroniser les catégories WooCommerce** :
   ```bash
   POST /api/categories-cache
   {
     "action": "sync",
     "categories": [...]  // Fetch depuis WooCommerce
   }
   ```
5. **Vérifier les logs Vercel** pour confirmer le succès

## Suppression de l'Ancienne Table (Optionnel)

Une fois que tout fonctionne, vous pouvez supprimer `woocommerce_categories_cache` :

```sql
-- Vérifier d'abord qu'elle n'est plus utilisée
DROP TABLE IF EXISTS woocommerce_categories_cache CASCADE;
```

⚠️ **Attention** : Faites cela uniquement après avoir confirmé que la nouvelle table fonctionne parfaitement.

## Rollback (Si Problème)

Si vous rencontrez des problèmes, vous pouvez revenir à l'ancienne API en modifiant :

1. Changer `categories` → `woocommerce_categories_cache` dans `/api/categories-cache/route.ts`
2. Redéployer

Mais avec les logs détaillés, vous devriez pouvoir identifier et corriger rapidement tout problème.
