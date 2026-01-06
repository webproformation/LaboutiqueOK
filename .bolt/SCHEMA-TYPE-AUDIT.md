# 🔍 AUDIT COMPLET DES TYPES D'ID - Projet qcqbtmv

**Date :** 2026-01-06
**Projet :** qcqbtmvbvipsxwjlgjvk
**Statut :** SYNCHRONISÉ ✅

---

## 📊 SYNTHÈSE GLOBALE

### Types d'ID dans le Schéma

| Type | Tables Concernées | Nombre de Colonnes |
|------|-------------------|-------------------|
| **TEXT** | Products, Categories, Relations | 18 colonnes |
| **UUID** | Toutes les autres tables | 100+ colonnes |

---

## 🔑 COLONNES ID TYPE TEXT

### 1. Table `products`

```sql
id: TEXT (PRIMARY KEY)
```

**Raison :** Héritage WooCommerce (IDs comme "571", "102", etc.)

### 2. Table `categories`

```sql
id: TEXT (PRIMARY KEY)
parent_id: TEXT (FOREIGN KEY → categories.id)
```

**Raison :** Compatibilité avec l'import WooCommerce

### 3. Relations Produits

| Table | Colonne | Type | Cible |
|-------|---------|------|-------|
| `product_category_mapping` | product_id | TEXT | products.id |
| `product_category_mapping` | category_id | TEXT | categories.id |
| `product_images` | product_id | TEXT | products.id |
| `product_attribute_values` | product_id | TEXT | products.id |
| `product_variations` | product_id | TEXT | products.id |
| `featured_products` | product_id | TEXT | products.id |
| `seo_metadata` | product_id | TEXT | products.id |
| `wishlist` | product_id | TEXT | products.id |

### 4. Panier et Commandes

| Table | Colonne | Type | Notes |
|-------|---------|------|-------|
| `cart_items` | product_id | TEXT | ID produit texte |
| `cart_items` | variation_id | TEXT | ID variation texte (nullable) |
| `delivery_batch_items` | product_id | TEXT | ID produit texte |

### 5. Méthodes de Livraison

| Table | Colonne | Type | Notes |
|-------|---------|------|-------|
| `delivery_batches` | shipping_method_id | TEXT | Nullable |
| `orders` | shipping_method_id | TEXT | Nullable |

### 6. Autres Relations TEXT

| Table | Colonne | Type | Notes |
|-------|---------|------|-------|
| `home_categories` | category_id | TEXT | → categories.id |
| `live_stream_products` | product_id | TEXT | ID produit texte |
| `look_products` | woocommerce_product_id | TEXT | Héritage WooCommerce |
| `guestbook_entries` | order_id | TEXT | ID commande texte (nullable) |

---

## 🆔 COLONNES ID TYPE UUID

Toutes les autres tables utilisent UUID pour leurs IDs :

### Tables Principales

- `addresses.id` : UUID
- `cart_items.id` : UUID
- `coupons.id` : UUID
- `orders.id` : UUID
- `profiles.id` : UUID (sync avec auth.users.id)
- `shipping_methods.id` : UUID
- `news_posts.id` : UUID
- `media.id` : UUID
- `live_streams.id` : UUID
- `looks.id` : UUID
- `gift_cards.id` : UUID
- `guestbook_entries.id` : UUID

### Relations UUID

- `user_id` : UUID (partout, référence auth.users.id)
- `order_id` : UUID (dans order_items, gift_card_transactions, etc.)
- `batch_id` : UUID
- `attribute_id` : UUID
- `term_id` : UUID

---

## ⚠️ RÈGLES CRITIQUES POUR LE CODE

### 1. Requêtes Supabase

**TOUJOURS traiter product_id, category_id, variation_id comme des strings :**

```typescript
// ✅ CORRECT
const { data } = await supabase
  .from('cart_items')
  .insert({
    product_id: "571",        // STRING
    variation_id: "1234"      // STRING
  });

// ❌ INCORRECT
const { data } = await supabase
  .from('cart_items')
  .insert({
    product_id: parseInt("571"),  // NE PAS CONVERTIR EN NUMBER
    variation_id: 1234            // NE PAS UTILISER DE NUMBER
  });
```

### 2. Interfaces TypeScript

```typescript
interface CartItem {
  id: string;              // UUID
  user_id: string;         // UUID
  product_id: string;      // TEXT (pas number!)
  variation_id?: string;   // TEXT (pas number!)
  quantity: number;
}

interface Product {
  id: string;              // TEXT (pas number!)
  name: string;
  regular_price: number;
  // ...
}
```

### 3. Comparaisons et Filtres

```typescript
// ✅ CORRECT
.eq('product_id', productId)  // productId doit être string

// ❌ INCORRECT
.eq('product_id', parseInt(productId))
```

---

## 📋 COLONNES DE GESTION DE STOCK

### Table `products`

| Colonne | Type | Valeur par Défaut | Notes |
|---------|------|-------------------|-------|
| `manage_stock` | boolean | false | Activer/désactiver gestion stock |
| `stock_status` | text | 'instock' | 'instock', 'outofstock', 'onbackorder' |
| `stock_quantity` | integer | 0 | Quantité en stock |
| `is_variable_product` | boolean | false | Produit avec variations |
| `has_variations` | boolean | false | Possède des variations |

---

## ✅ VALIDATION DE LA SYNCHRONISATION

### Migration Appliquée

```
✅ add_stock_management_columns (2026-01-06)
   - Ajout de manage_stock (boolean, default: false)
   - Ajout de stock_status (text, default: 'instock')
```

### Vérification Effectuée

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name IN ('id', 'manage_stock', 'stock_status', 'is_variable_product');
```

**Résultat :**
- ✅ `id` : TEXT
- ✅ `manage_stock` : boolean (default: false)
- ✅ `stock_status` : text (default: 'instock')
- ✅ `is_variable_product` : boolean (default: false)

---

## 🚫 INTERDICTIONS ABSOLUES

### NE JAMAIS :

1. ❌ Convertir product_id ou category_id en INTEGER
2. ❌ Utiliser `parseInt()` sur les IDs de produits/catégories
3. ❌ Assumer que product_id est un nombre
4. ❌ Créer des migrations pour convertir TEXT → UUID (données existantes)
5. ❌ Modifier le type des colonnes TEXT existantes

### TOUJOURS :

1. ✅ Traiter product_id comme string dans le code TypeScript
2. ✅ Utiliser des strings lors des insertions/updates Supabase
3. ✅ Respecter le type TEXT dans les interfaces
4. ✅ Documenter le type TEXT dans les commentaires
5. ✅ Vérifier les types lors des reviews de code

---

## 📈 STATISTIQUES

- **Tables totales :** 54
- **Colonnes ID TEXT :** 18
- **Colonnes ID UUID :** 100+
- **Tables produits :** 12
- **Tables avec foreign keys vers products :** 10

---

**Ce document est SACRÉ. Ne JAMAIS ignorer ces règles.**
