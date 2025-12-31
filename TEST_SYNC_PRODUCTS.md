# TEST SYNC 3 PRODUITS

## Instructions de Test

### 1. Ouvrir l'interface Admin

```
http://localhost:3000/admin/products
```

### 2. Cliquer sur "Sync WooCommerce"

### 3. Vérifier la Console Browser

Vous devriez voir :

```
[Sync Products] ===== STARTING SYNC REQUEST =====
[Sync Products] Step 1: Checking environment variables...
[Sync Products] Environment check: { ... }
[Sync Products] Step 2: Creating Supabase client...
[Sync Products] Step 3: Verifying products table exists...
[Sync Products] Step 4: Starting product sync from WooCommerce...
[Sync Products] Step 5.1: Fetching page 1 (3 products per page)...
[Sync Products] Response status: 200
[Sync Products] Successfully fetched 3 products from WooCommerce
[Sync Products] Successfully upserted product XXX (Nom du produit)
[Sync Products] Successfully upserted product YYY (Nom du produit)
[Sync Products] Successfully upserted product ZZZ (Nom du produit)
[Sync Products] TEST MODE: Stopping after 1 page(s)
[Sync Products] Database verification: 3 products in database
```

### 4. Vérifier la Réponse JSON

La réponse doit contenir :

```json
{
  "success": true,
  "message": "Synchronisation terminée - TEST MODE (3 produits max)",
  "productsProcessed": 3,
  "productsCreated": 3,
  "productsUpdated": 0,
  "databaseCount": 3,  // ← DOIT ÊTRE 3
  "errors": [],
  "debugInfo": {
    "testMode": true,
    "maxProductsPerPage": 3,
    "maxPages": 1,
    "hasErrors": false,
    "errorDetails": []
  }
}
```

### 5. Vérifier en SQL

```sql
SELECT
  woocommerce_id,
  name,
  slug,
  regular_price,
  sale_price,
  stock_status,
  created_at
FROM products
ORDER BY created_at DESC
LIMIT 3;
```

**RÉSULTAT ATTENDU** : 3 lignes avec les produits synchronisés

### 6. Test Home Categories

```
http://localhost:3000/admin/home-categories
```

**ATTENDU** :
- Panneau de gauche : Liste des catégories WooCommerce
- Panneau de droite : 6 catégories sélectionnées (depuis SQL)

## Si Problèmes

### databaseCount = 0

Si `databaseCount: 0` alors que `productsCreated: 3`, c'est un problème RLS.

**Console affichera** :

```
Error upserting product 123: {
  message: "new row violates row-level security policy",
  code: "42501",
  hint: "Check RLS policies on products table"
}
```

**Solution** :

```sql
-- Vérifier les policies RLS
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'products';

-- Si aucune policy pour service_role, ajouter :
CREATE POLICY "service_role_all_access" ON products
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### API Timeout (Home Categories)

Si l'API met plus de 5 secondes :

```
[Home Categories] API timeout after 5 seconds
```

**Solution** :

1. Vérifier les logs Supabase
2. Vérifier que les tables home_categories et categories existent
3. Vérifier les policies RLS sur ces tables

### Panneau de Droite Vide

Si le panneau de droite est vide mais SQL montre 6 entrées :

**Console affichera** :

```
[Home Categories] Raw response: { success: true, data: [] }
[Home Categories] Extracted categories: 0
```

**Causes possibles** :

1. RLS bloque la lecture de home_categories
2. RLS bloque la lecture de categories
3. Les category_id ne correspondent pas

**Debug** :

```sql
-- Vérifier les home_categories
SELECT * FROM home_categories ORDER BY display_order;

-- Vérifier les categories liées
SELECT c.*
FROM categories c
INNER JOIN home_categories hc ON hc.category_id = c.id
ORDER BY hc.display_order;
```

## Mode Production

Une fois les tests validés (3 produits + 6 catégories visibles) :

### 1. Désactiver le Mode Test

**Fichier** : `app/api/admin/sync-products/route.ts`

```typescript
// Ligne 156-159
const perPage = 20; // Remettre à 20 ou 100
// const MAX_PAGES = 1; // Commenter cette ligne
```

### 2. Supprimer la limite MAX_PAGES

```typescript
// Ligne 346-348
// Commenter ou supprimer ce bloc :
// if (page >= MAX_PAGES) {
//   hasMore = false;
//   console.log(`[Sync Products] TEST MODE: Stopping after ${MAX_PAGES} page(s)`);
// }
```

### 3. Relancer la Sync Complète

```
http://localhost:3000/admin/products
```

Cliquer sur "Sync WooCommerce"

**ATTENDU** :

```json
{
  "success": true,
  "message": "Synchronisation terminée",
  "productsProcessed": 122,
  "productsCreated": 119, // 3 déjà créés
  "productsUpdated": 3,
  "databaseCount": 122,
  "errors": []
}
```

## Commandes Rapides

### Compter les Produits

```sql
SELECT COUNT(*) FROM products;
```

### Compter les Home Categories

```sql
SELECT COUNT(*) FROM home_categories;
```

### Voir les Derniers Produits Synchronisés

```sql
SELECT
  woocommerce_id,
  name,
  regular_price,
  created_at
FROM products
ORDER BY created_at DESC
LIMIT 10;
```

### Vérifier les Erreurs de Sync

Si errors.length > 0 dans la réponse, afficher les détails :

```json
{
  "errors": [
    {
      "productId": 123,
      "productName": "Nom du produit",
      "error": "Message d'erreur détaillé avec code et hint"
    }
  ]
}
```

## Checklist de Validation

- [ ] API home-categories-get répond en < 5 secondes
- [ ] Réponse contient { success: true, data: [...] }
- [ ] Panneau de droite affiche 6 catégories
- [ ] Sync de 3 produits réussit
- [ ] databaseCount: 3 dans la réponse
- [ ] SQL COUNT(*) FROM products = 3
- [ ] Aucune erreur dans debugInfo.errorDetails
- [ ] Console affiche "Successfully upserted" pour chaque produit

## Prêt pour Production

Une fois tous les tests validés :

✅ Désactiver le mode test
✅ Relancer la sync complète (122 produits)
✅ Vérifier databaseCount: 122
✅ Valider l'affichage frontend

**TEST MODE ACTIVÉ - PRÊT POUR VALIDATION**
