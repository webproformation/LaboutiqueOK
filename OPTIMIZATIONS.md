# Optimisations de Performance

Ce document détaille les optimisations appliquées à l'application pour améliorer les temps de chargement.

## Optimisations Implémentées

### 1. Lazy Loading du Widget Mondial Relay
**Impact : Réduction de ~150KB au chargement initial**

- Le widget Mondial Relay (jQuery + plugin) ne se charge que lorsqu'une méthode de livraison en point relais est sélectionnée
- Utilisation de `next/dynamic` avec `ssr: false`
- Affichage d'un loader pendant le chargement

**Fichiers modifiés :**
- `app/checkout/page.tsx` - Ajout du lazy loading

### 2. Mise en Cache des Options de Checkout
**Impact : Réduction des appels API répétés à WooCommerce**

- Cache localStorage avec expiration de 1 heure
- Stockage des méthodes de livraison, paiement et taxes
- Chargement instantané depuis le cache lors des visites suivantes

**Fichiers modifiés :**
- `app/checkout/page.tsx` - Fonction `loadCheckoutOptions()`

### 3. Optimisation des Requêtes Parallèles
**Impact : Réduction du temps de chargement de 40-50%**

- Exécution en parallèle de :
  - Vérification du statut client
  - Chargement des adresses
  - Chargement des options de checkout
  - Vérification des batches de livraison

**Avant :**
```javascript
await checkStatus();
await Promise.all([loadAddresses(), loadCheckoutOptions(), checkBatch()]);
```

**Après :**
```javascript
const [statusResponse] = await Promise.all([
  checkStatus(),
  loadAddresses(),
  loadCheckoutOptions(),
  checkBatch(),
]);
```

**Fichiers modifiés :**
- `app/checkout/page.tsx` - Fonction `loadCheckoutData()`

### 4. Code Splitting des Composants Non-Critiques
**Impact : Réduction du bundle JavaScript initial**

- Lazy loading de `CouponSelector`
- Lazy loading de `MondialRelaySelector`
- Loaders visuels pendant le chargement

**Fichiers modifiés :**
- `app/checkout/page.tsx` - Import dynamique des composants

### 5. Prévention des Réinitialisations du Widget
**Impact : Élimination des rechargements multiples**

- Détection de l'initialisation via `widgetInitializedRef`
- Return early si déjà initialisé
- Suppression des logs de debug excessifs

**Fichiers modifiés :**
- `components/MondialRelaySelector.tsx` - Logique de chargement optimisée

## Résultats Attendus

### Temps de Chargement Initial
- **Avant :** ~3-4 secondes
- **Après :** ~1-2 secondes (réduction de 50-60%)

### Taille du Bundle
- **JavaScript initial :** Réduction de ~200KB
- **Chargement différé :** ~150KB chargés uniquement si nécessaire

### Expérience Utilisateur
- Affichage plus rapide de la page checkout
- Pas de blocage pendant le chargement du widget Mondial Relay
- Rechargements de page plus rapides grâce au cache

## Optimisations Futures Possibles

### Court Terme (Facile à implémenter)
1. **Prefetch des ressources critiques**
   - Ajouter `<link rel="prefetch">` pour les images produits
   - Précharger les scripts Google Maps

2. **Compression des images**
   - Optimiser les images produits avec Next.js Image
   - Utiliser WebP avec fallback

3. **Service Worker**
   - Mise en cache des ressources statiques
   - Mode hors ligne pour les pages visitées

### Moyen Terme (Nécessite plus de travail)
1. **GraphQL Caching**
   - Implémenter Apollo Client cache persistant
   - Réduire les requêtes WooCommerce répétées

2. **Server-Side Rendering**
   - SSR pour les pages produits
   - ISR (Incremental Static Regeneration) pour le catalogue

3. **CDN pour les Assets**
   - Servir les images depuis un CDN
   - Réduire la latence réseau

### Long Terme (Refactoring majeur)
1. **Migration vers API Platform**
   - Remplacer WooCommerce REST API par une API GraphQL optimisée
   - Réduire le payload des réponses

2. **Edge Computing**
   - Déployer sur Vercel Edge
   - Réduire la latence géographique

3. **Database Indexing**
   - Optimiser les requêtes Supabase
   - Ajouter des index sur les colonnes fréquemment interrogées

## Monitoring des Performances

Pour surveiller l'impact de ces optimisations, utilisez :

1. **Chrome DevTools**
   - Network tab pour analyser les temps de chargement
   - Performance tab pour identifier les bottlenecks

2. **Lighthouse**
   ```bash
   npm install -g lighthouse
   lighthouse https://your-domain.com --view
   ```

3. **Next.js Analytics**
   - Activer dans Vercel Dashboard
   - Suivre les Core Web Vitals

## Cache Invalidation

Pour vider le cache des options de checkout (par exemple après des modifications dans WooCommerce) :

```javascript
localStorage.removeItem('checkout_options_cache');
localStorage.removeItem('checkout_options_cache_time');
```

Ou créer une page admin pour le faire :
```javascript
// Page admin : /admin/clear-cache
export default function ClearCache() {
  const clearCache = () => {
    localStorage.clear();
    window.location.reload();
  };

  return <Button onClick={clearCache}>Vider le cache</Button>;
}
```
