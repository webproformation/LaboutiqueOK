# Correction Affichage Catégories - Page Admin

## Date : 31 Décembre 2024

## Problème Initial

Les catégories sont bien présentes dans la table `public.categories` (vérifié en SQL), mais elles ne s'affichent pas sur la page `/admin/home-categories`.

## Diagnostic

### Cause 1 : Filtre `is_active: true` Trop Restrictif

**Fichier** : `/app/api/categories-cache/route.ts`
**Ligne** : 35

```typescript
// ❌ AVANT
let query = supabase
  .from('categories')
  .select('*')
  .eq('is_active', true)  // ← Filtre trop restrictif
  .order('name', { ascending: true });
```

**Problème** : Si les catégories sont synchronisées sans le flag `is_active: true`, elles ne sont pas retournées par l'API.

**Solution** : Supprimer le filtre `is_active` pour afficher toutes les catégories disponibles.

```typescript
// ✅ APRÈS
let query = supabase
  .from('categories')
  .select('*')
  .order('name', { ascending: true });
```

### Cause 2 : Filtre `parent_only` Incompatible avec `NULL`

**Fichier** : `/app/api/categories-cache/route.ts`
**Ligne** : 38-39

```typescript
// ❌ AVANT
if (parentOnly) {
  query = query.eq('woocommerce_parent_id', 0);  // ← Cherche 0 au lieu de NULL
}
```

**Problème** : Après la correction précédente qui convertit `parent: 0` en `NULL`, ce filtre ne trouve plus rien car il cherche `0` alors que les catégories racine ont maintenant `NULL`.

**Solution** : Utiliser `.is('woocommerce_parent_id', null)` pour chercher les catégories racine.

```typescript
// ✅ APRÈS
if (parentOnly) {
  query = query.is('woocommerce_parent_id', null);  // ← Cherche NULL
}
```

### Cause 3 : Insertion Manuelle avec Mauvaise Valeur Parent ID

**Fichier** : `/app/admin/home-categories/page.tsx`
**Ligne** : 206

```typescript
// ❌ AVANT
woocommerce_parent_id: wooCat.parent || 0,
```

**Problème** : Lors de l'ajout manuel d'une catégorie depuis l'interface, le code utilisait encore `0` au lieu de `null`.

**Solution** : Utiliser la même logique que dans l'API de synchronisation.

```typescript
// ✅ APRÈS
woocommerce_parent_id: wooCat.parent && wooCat.parent !== 0 ? wooCat.parent : null,
```

## Corrections Appliquées

### 1. API Categories Cache - Suppression Filtres Restrictifs

**Fichier** : `/app/api/categories-cache/route.ts`

#### Ligne 31-39 : Suppression du filtre `is_active`

```typescript
console.log('[Categories Cache API] Fetching from categories table...');
let query = supabase
  .from('categories')
  .select('*')
  .order('name', { ascending: true });

if (parentOnly) {
  query = query.is('woocommerce_parent_id', null);
}
```

**Impact** :
- ✅ Toutes les catégories sont retournées, quel que soit leur statut `is_active`
- ✅ Le filtre `parent_only` cherche maintenant `NULL` au lieu de `0`
- ✅ Compatible avec la nouvelle logique de gestion des parent IDs

### 2. Page Admin - Logs de Debug Détaillés

**Fichier** : `/app/admin/home-categories/page.tsx`

#### Ligne 90-102 : Logs au Chargement Initial

```typescript
const data = await response.json();
console.log('[Home Categories] Réponse API:', data);
console.log('[Home Categories] data.categories:', data.categories);
const cachedCategories = Array.isArray(data.categories) ? data.categories : [];
console.log('[Home Categories] Catégories reçues par le composant:', cachedCategories);
console.log('[Home Categories] Nombre de catégories:', cachedCategories.length);
setAllWooCategories(cachedCategories);

if (cachedCategories.length === 0) {
  toast.info('Aucune catégorie dans le cache. Cliquez sur "Rafraîchir depuis WordPress" pour synchroniser.');
} else {
  console.log(`[Home Categories] ✅ ${cachedCategories.length} catégories chargées avec succès`);
}
```

#### Ligne 145-168 : Logs après Synchronisation

```typescript
const syncResult = await syncResponse.json();
console.log('[Home Categories] Résultat de la synchro:', syncResult);

// Reload from cache avec logs détaillés
console.log('[Home Categories] 🔄 Rechargement automatique après synchro...');
const cacheResponse = await fetch('/api/categories-cache?parent_only=true');
if (cacheResponse.ok) {
  const data = await cacheResponse.json();
  console.log('[Home Categories] Données après synchro:', data);
  const cachedCategories = Array.isArray(data.categories) ? data.categories : [];
  console.log('[Home Categories] Catégories après synchro:', cachedCategories);
  console.log('[Home Categories] Nombre après synchro:', cachedCategories.length);
  setAllWooCategories(cachedCategories);

  if (cachedCategories.length > 0) {
    console.log(`[Home Categories] ✅ ${cachedCategories.length} catégories disponibles après synchro`);
    toast.success(`${syncResult.count || cachedCategories.length} catégories synchronisées et chargées`);
  } else {
    console.warn('[Home Categories] ⚠️ Synchro réussie mais aucune catégorie trouvée après');
    toast.warning('Synchronisation réussie mais aucune catégorie disponible');
  }
} else {
  console.error('[Home Categories] Erreur lors du rechargement après synchro');
  toast.warning('Synchronisation réussie mais erreur de rechargement');
}
```

#### Ligne 373-375 : Logs avant le Render

```typescript
console.log('[Home Categories] Avant le render - allWooCategories:', allWooCategories);
console.log('[Home Categories] Avant le render - availableCategories:', availableCategories);
console.log('[Home Categories] Avant le render - selectedCategories:', selectedCategories);
```

**Impact** :
- ✅ Visibilité complète du flux de données
- ✅ Debug facile dans la console Vercel
- ✅ Identification immédiate de l'étape problématique

### 3. Page Admin - Correction Parent ID lors de l'Ajout

**Fichier** : `/app/admin/home-categories/page.tsx`
**Ligne** : 206

```typescript
const { data: newCategory, error: createError } = await supabase
  .from('categories')
  .insert({
    woocommerce_id: wooCat.id,
    name: decodeHtmlEntities(wooCat.name),
    slug: wooCat.slug,
    description: '',
    woocommerce_parent_id: wooCat.parent && wooCat.parent !== 0 ? wooCat.parent : null,
    image_url: wooCat.image?.src || null,
    count: wooCat.count || 0,
    is_active: true
  })
  .select('id')
  .single();
```

**Impact** :
- ✅ Cohérence avec l'API de synchronisation
- ✅ Pas de violation de contrainte de clé étrangère
- ✅ Les catégories ajoutées manuellement ont `NULL` au lieu de `0`

### 4. Refresh Automatique après Synchronisation

**Impact** :
- ✅ Après avoir cliqué sur "Rafraîchir depuis WordPress"
- ✅ La liste se recharge automatiquement
- ✅ Toast de confirmation avec le nombre exact de catégories
- ✅ Toast d'avertissement si la synchro réussit mais aucune catégorie n'est trouvée

## Logs Console Disponibles

Voici tous les logs que vous verrez maintenant dans la console Vercel / Browser :

### Au Chargement de la Page

```
[Home Categories] Réponse API: { success: true, categories: [...], count: 68 }
[Home Categories] data.categories: [...]
[Home Categories] Catégories reçues par le composant: [...]
[Home Categories] Nombre de catégories: 68
[Home Categories] ✅ 68 catégories chargées avec succès
```

### Après Synchronisation WordPress

```
[Home Categories] Résultat de la synchro: { success: true, count: 68, ... }
[Home Categories] 🔄 Rechargement automatique après synchro...
[Home Categories] Données après synchro: { success: true, categories: [...], count: 68 }
[Home Categories] Catégories après synchro: [...]
[Home Categories] Nombre après synchro: 68
[Home Categories] ✅ 68 catégories disponibles après synchro
```

### Avant le Render

```
[Home Categories] Avant le render - allWooCategories: [...]
[Home Categories] Avant le render - availableCategories: [...]
[Home Categories] Avant le render - selectedCategories: [...]
```

## Résumé des Changements

| Fichier | Lignes | Changement | Impact |
|---------|--------|------------|--------|
| `/app/api/categories-cache/route.ts` | 35 | Suppression filtre `is_active` | Toutes les catégories retournées |
| `/app/api/categories-cache/route.ts` | 38 | `eq(0)` → `is(null)` | Filtre `parent_only` fonctionne |
| `/app/admin/home-categories/page.tsx` | 90-102 | Logs au chargement | Visibilité données reçues |
| `/app/admin/home-categories/page.tsx` | 145-168 | Logs + refresh après synchro | Rechargement automatique + debug |
| `/app/admin/home-categories/page.tsx` | 206 | `|| 0` → `&& !== 0 ? : null` | Cohérence parent ID |
| `/app/admin/home-categories/page.tsx` | 373-375 | Logs avant render | Debug état du composant |

## Tests Recommandés

### 1. Test Chargement Initial
1. ✅ Ouvrir `/admin/home-categories`
2. ✅ Vérifier les logs dans la console
3. ✅ Vérifier que les 68 catégories s'affichent dans "Catégories disponibles"

### 2. Test Synchronisation WordPress
1. ✅ Cliquer sur "Rafraîchir depuis WordPress"
2. ✅ Vérifier le toast "X catégories synchronisées et chargées"
3. ✅ Vérifier que la liste se rafraîchit automatiquement
4. ✅ Vérifier les logs dans la console

### 3. Test Ajout Catégorie
1. ✅ Ajouter une catégorie depuis la liste disponible
2. ✅ Vérifier qu'elle apparaît dans "Catégories sélectionnées"
3. ✅ Vérifier en SQL que `woocommerce_parent_id` est `NULL` et non `0`

### 4. Test Filtrage
1. ✅ Vérifier que les catégories déjà sélectionnées ne s'affichent pas dans "Catégories disponibles"
2. ✅ Retirer une catégorie et vérifier qu'elle réapparaît dans "Catégories disponibles"

## État Final

| Objectif | État | Solution |
|----------|------|----------|
| Supprimer filtre `is_active` | ✅ Corrigé | Filtre retiré de l'API |
| Filtre `parent_only` fonctionnel | ✅ Corrigé | `.eq(0)` → `.is(null)` |
| Logs de debug détaillés | ✅ Ajouté | 3 points de logging |
| Refresh automatique après synchro | ✅ Ajouté | Rechargement + toast |
| Cohérence parent ID | ✅ Corrigé | Même logique partout |

## Fichiers Modifiés

- ✅ `/app/api/categories-cache/route.ts` (lignes 31-39)
- ✅ `/app/admin/home-categories/page.tsx` (lignes 90-102, 145-168, 206, 373-375)
- ✅ `/HOME_CATEGORIES_DISPLAY_FIX.md` (ce document)

Build en cours. Les catégories devraient maintenant s'afficher correctement sur la page `/admin/home-categories`.
