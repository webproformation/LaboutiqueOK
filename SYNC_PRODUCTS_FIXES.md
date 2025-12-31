# Corrections Synchronisation Produits

## Date : 31 Décembre 2024

## Problèmes Identifiés et Résolus

### 1. URL WooCommerce Incorrecte

**Problème** :
- La variable `NEXT_PUBLIC_WORDPRESS_API_URL` pointait vers `/graphql` (endpoint GraphQL)
- URL résultante : `https://wp.laboutiquedemorgane.com/graphql/wp-json/wc/v3/products` ❌
- Résultat : Erreur "Unexpected token '<'" (HTML reçu au lieu de JSON)

**Solution** :
- Utilisation de la variable `WORDPRESS_URL` qui contient l'URL de base
- URL correcte : `https://wp.laboutiquedemorgane.com/wp-json/wc/v3/products` ✅

**Fichier modifié** : `/app/api/admin/sync-products/route.ts`
- Ligne 31 : `const wcUrl = process.env.WORDPRESS_URL;`
- Ligne 63 : `const wcUrl = process.env.WORDPRESS_URL;`

### 2. Gestion des Erreurs JSON Améliorée

**Problème** :
- Pas de vérification du Content-Type avant de parser le JSON
- Erreur cryptique "Unexpected token '<'" sans contexte

**Solution** :
- Vérification du Content-Type avant parsing
- Capture du texte brut en cas d'erreur
- Logs détaillés avec prévisualisation du contenu

**Code ajouté (lignes 276-326)** :

```typescript
console.log(`[Sync Products] Response status: ${response.status}`);
console.log(`[Sync Products] Response headers:`, {
  contentType: response.headers.get('content-type'),
  total: response.headers.get('X-WP-Total'),
  totalPages: response.headers.get('X-WP-TotalPages')
});

const contentType = response.headers.get('content-type');
if (!contentType || !contentType.includes('application/json')) {
  const textResponse = await response.text();
  console.error('[Sync Products] Expected JSON but received:', {
    contentType,
    bodyPreview: textResponse.substring(0, 500)
  });
  throw new Error(`La réponse n'est pas du JSON. Type reçu: ${contentType}. Corps: ${textResponse.substring(0, 200)}`);
}

let products: WooCommerceProduct[];
try {
  products = await response.json();
} catch (jsonError: any) {
  const textResponse = await response.text();
  console.error('[Sync Products] JSON parse error:', jsonError);
  console.error('[Sync Products] Response body:', textResponse.substring(0, 1000));
  throw new Error(`Impossible de parser la réponse JSON: ${jsonError.message}. Corps: ${textResponse.substring(0, 200)}`);
}
```

### 3. Mapping des Colonnes Corrigé

**Problème** :
- Utilisation de `price` au lieu de `regular_price`
- Utilisation de `gallery_images` au lieu de `images`

**Solution** :
- Changement de `price` → `regular_price` (ligne 191)
- Changement de `gallery_images` → `images` (ligne 194)

**Code corrigé (lignes 185-208)** :

```typescript
const productData = {
  woocommerce_id: wcProduct.id,
  name: wcProduct.name,
  slug: wcProduct.slug,
  description: wcProduct.description || '',
  short_description: wcProduct.short_description || '',
  regular_price: wcProduct.regular_price ? parseFloat(wcProduct.regular_price) : 0,  // ✅ Corrigé
  sale_price: wcProduct.sale_price ? parseFloat(wcProduct.sale_price) : null,
  image_url: wcProduct.images && wcProduct.images.length > 0 ? wcProduct.images[0].src : null,
  images: wcProduct.images ? wcProduct.images.map(img => ({                          // ✅ Corrigé
    src: img.src,
    alt: img.alt || wcProduct.name
  })) : [],
  stock_status: wcProduct.stock_status || 'instock',
  stock_quantity: wcProduct.stock_quantity,
  category_id: categoryId,                                                            // ✅ Liaison catégorie
  woocommerce_category_id: wooCategoryId,                                             // ✅ ID WooCommerce
  categories: wcProduct.categories || [],
  tags: wcProduct.tags || [],
  attributes: wcProduct.attributes || [],
  variations: wcProduct.variations || [],
  is_active: wcProduct.status === 'publish',
  updated_at: new Date().toISOString()
};
```

### 4. Liaison Automatique aux Catégories

**Fonctionnalité déjà implémentée** (lignes 163-183) :
- Extraction de la catégorie principale du produit
- Recherche de son UUID dans la table `categories`
- Assignment à `category_id`
- Stockage de l'ID WooCommerce dans `woocommerce_category_id`
- Pas d'échec si la catégorie n'existe pas

## Structure de la Table Products (Attendue)

Colonnes principales :
- `id` (UUID, PK)
- `woocommerce_id` (Integer, Unique)
- `name` (Text)
- `slug` (Text)
- `description` (Text)
- `short_description` (Text)
- `regular_price` (Numeric)
- `sale_price` (Numeric, Nullable)
- `image_url` (Text, Nullable)
- `images` (JSONB) - Array d'objets `{src: string, alt: string}`
- `stock_status` (Text)
- `stock_quantity` (Integer, Nullable)
- `category_id` (UUID, FK → `categories.id`, Nullable)
- `woocommerce_category_id` (Integer, Nullable)
- `categories` (JSONB) - Array complet des catégories WooCommerce
- `tags` (JSONB)
- `attributes` (JSONB)
- `variations` (JSONB)
- `is_active` (Boolean)
- `created_at` (Timestamptz)
- `updated_at` (Timestamptz)

## Variables d'Environnement Utilisées

Fichier `.env` :
```env
WORDPRESS_URL=https://wp.laboutiquedemorgane.com        # ✅ Utilisé pour WooCommerce
WC_CONSUMER_KEY=ck_d620ae1f9fcd1832bdb2c31fe3ad8362a9de8b28
WC_CONSUMER_SECRET=cs_f452fc79440e83b64d6c3a0c712d51c91c8dd5a4
NEXT_PUBLIC_SUPABASE_URL=https://hondlefoprhtrpxnumyj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

**Note** : `NEXT_PUBLIC_WORDPRESS_API_URL` (pointe vers `/graphql`) n'est PAS utilisée pour la synchro produits.

## URL API Construite

Format final :
```
https://wp.laboutiquedemorgane.com/wp-json/wc/v3/products?page=1&per_page=20&consumer_key=ck_...&consumer_secret=cs_...
```

## Logs de Debugging Ajoutés

### Lors de chaque requête WooCommerce :

```
[Sync Products] Step 5.1: Fetching page 1 (20 products per page)...
[Sync Products] Full API URL: https://wp.laboutiquedemorgane.com/wp-json/wc/v3/products?page=1&per_page=20&consumer_key=ck_d620ae1...
[Sync Products] Response status: 200
[Sync Products] Response headers: {
  contentType: 'application/json',
  total: '150',
  totalPages: '8'
}
```

### En cas d'erreur Content-Type :

```
[Sync Products] Expected JSON but received: {
  contentType: 'text/html',
  bodyPreview: '<!DOCTYPE html><html>...'
}
```

### Liaison catégories :

```
[Sync Products] Product 123: Linked to category UUID abc-def (WooCommerce ID: 45)
[Sync Products] Product 124: Category 99 not found in categories table (will remain null)
```

## Test de Configuration

Endpoint GET pour vérifier la config :

```bash
curl https://votre-domaine.vercel.app/api/admin/sync-products
```

Réponse attendue :
```json
{
  "success": true,
  "configuration": {
    "wordpress_url": "https://wp.laboutiquedemorgane.com",
    "wc_consumer_key": "ck_d620ae1...",
    "wc_consumer_secret": "***CONFIGURED***",
    "supabase_url": "https://hondlefoprhtrpxnumyj...",
    "supabase_service_key": "***CONFIGURED***"
  },
  "ready": true
}
```

## Ordre d'Exécution Recommandé

### 1. Vérifier la Configuration
```bash
curl -X GET https://votre-domaine.vercel.app/api/admin/sync-products
```

### 2. Synchroniser les Catégories d'Abord
- Interface : `/admin/home-categories`
- Bouton : "Rafraîchir depuis WordPress"
- Résultat attendu : "68 catégories synchronisées" ✅

### 3. Synchroniser les Produits
- Interface : `/admin/products`
- Bouton : "Synchroniser les produits"
- Durée estimée : 2-5 minutes selon le nombre de produits

### 4. Vérifier les Résultats

```sql
-- Dans Supabase SQL Editor

-- 1. Compter les produits
SELECT COUNT(*) as total FROM products;

-- 2. Vérifier les liaisons catégories
SELECT
  COUNT(*) FILTER (WHERE category_id IS NOT NULL) as with_category,
  COUNT(*) FILTER (WHERE category_id IS NULL) as without_category,
  COUNT(*) as total
FROM products;

-- 3. Voir quelques produits avec leurs catégories
SELECT
  p.woocommerce_id,
  p.name,
  p.regular_price,
  p.sale_price,
  c.name as category_name,
  p.woocommerce_category_id,
  jsonb_array_length(p.images) as image_count
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LIMIT 20;
```

## Messages d'Erreur Possibles

### Erreur 1 : "Configuration WooCommerce manquante"
**Cause** : Variables d'environnement non définies
**Solution** : Vérifier le fichier `.env` sur Vercel

### Erreur 2 : "La réponse n'est pas du JSON"
**Cause** : URL incorrecte ou erreur serveur WordPress
**Solution** : Vérifier que `WORDPRESS_URL` est correct et que le site est accessible

### Erreur 3 : "Authentification WooCommerce échouée" (401)
**Cause** : Clés API WooCommerce incorrectes
**Solution** : Régénérer les clés dans WooCommerce → Réglages → Avancé → API REST

### Erreur 4 : "La table products n'existe pas"
**Cause** : Migration non appliquée
**Solution** : Créer la table `products` avec toutes les colonnes requises

## Résumé des Changements

| Fichier | Lignes | Type de Changement | Impact |
|---------|--------|-------------------|---------|
| `/app/api/admin/sync-products/route.ts` | 31, 63 | Utilisation de `WORDPRESS_URL` | URL WooCommerce correcte |
| `/app/api/admin/sync-products/route.ts` | 191 | `price` → `regular_price` | Mapping correct vers DB |
| `/app/api/admin/sync-products/route.ts` | 194 | `gallery_images` → `images` | Mapping correct vers DB |
| `/app/api/admin/sync-products/route.ts` | 276-326 | Gestion erreurs JSON | Debugging amélioré |
| `/app/api/admin/sync-products/route.ts` | 163-183 | Liaison catégories | Produits liés aux catégories |

## État Actuel

| Composant | État | Notes |
|-----------|------|-------|
| URL WooCommerce | ✅ Corrigée | Utilise `WORDPRESS_URL` |
| Mapping colonnes | ✅ Corrigé | `regular_price`, `images` |
| Gestion erreurs | ✅ Améliorée | Logs détaillés, capture texte |
| Liaison catégories | ✅ Fonctionnelle | Via UUID lookup |
| Build | ✅ En cours | Vérification finale |

## Prochaines Étapes

1. ✅ Déployer sur Vercel
2. ✅ Tester l'endpoint de configuration (GET)
3. ✅ Synchroniser les catégories (68 disponibles)
4. ✅ Synchroniser les produits (POST)
5. ✅ Vérifier les résultats dans Supabase

## Support de Debugging

Si la synchronisation échoue :

1. **Consulter les logs Vercel** : Rechercher `[Sync Products]`
2. **Vérifier l'URL complète** : Log `Full API URL` montre l'URL exacte utilisée
3. **Vérifier le Content-Type** : Log `Response headers` montre le type de réponse
4. **Voir le corps de la réponse** : Log `bodyPreview` affiche les 500 premiers caractères

Tous les logs sont préfixés avec `[Sync Products]` pour faciliter la recherche.
