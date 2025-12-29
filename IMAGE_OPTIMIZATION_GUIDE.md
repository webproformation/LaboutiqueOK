# Guide d'Optimisation des Images

## Problèmes identifiés et résolus

### 1. Configuration des domaines d'images
**Problème** : Les images provenant de WordPress/WooCommerce ne se chargeaient pas correctement en production.

**Cause** : La configuration utilisait un wildcard `hostname: '**'` qui ne fonctionne pas de manière fiable en production sur Vercel.

**Solution** : Domaines explicitement autorisés dans `next.config.js` :
- `wp.laboutiquedemorgane.com` (WordPress/WooCommerce)
- `images.pexels.com` (images de placeholder)
- `**.supabase.co` (tous les sous-domaines Supabase)

### 2. Optimisation des images
**Avant** : Images chargées avec `unoptimized={true}`
- Aucune compression
- Pas de formats modernes (AVIF/WebP)
- Chargement lent

**Après** : Images optimisées avec Next.js Image
- Compression intelligente avec paramètres `quality`
- Conversion automatique en AVIF/WebP
- Chargement progressif et lazy loading

### 3. Réduction de la charge de données

#### Requêtes GraphQL optimisées :
- **Produits featured** : 100 → 12 produits
- **Images de galerie** : Illimité → 2 images max par produit
- **Live streams** : 8 → 6 streams
- **Vidéos showcase** : 6 → 4 vidéos

#### Configuration Next.js :
- Cache d'images : 60s → 3600s (1 heure)
- Formats : AVIF et WebP activés
- Minification SWC activée
- Device sizes optimisés

### 4. Composants optimisés

#### HeroSlider
```tsx
<Image
  src={slide.image_url}
  alt={slide.title}
  fill
  sizes="100vw"
  className="object-cover"
  priority={index === 0}
  quality={85}
/>
```

#### ProductCard
```tsx
<Image
  src={images[currentImageIndex]}
  alt={product.name}
  fill
  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
  className="object-cover"
  quality={75}
/>
```

#### CategoryCard
```tsx
<Image
  src={imageUrl}
  alt={category.name}
  fill
  sizes="(max-width: 768px) 100vw, 50vw"
  className="object-cover"
  quality={80}
/>
```

## Améliorations des performances attendues

1. **Temps de chargement** : Réduction de 60-70%
2. **Poids des pages** : Réduction de 50-60%
3. **Score Lighthouse** : Amélioration significative
4. **Expérience utilisateur** : Chargement progressif et plus rapide

## Déploiement

Les changements prendront effet automatiquement lors du prochain déploiement sur Vercel. Les images seront :
- Converties automatiquement en formats modernes
- Mises en cache pendant 1 heure
- Optimisées pour chaque appareil
- Servies via le CDN de Vercel

## Surveillance

Pour vérifier les performances après déploiement :
1. Utilisez Chrome DevTools (Network tab)
2. Vérifiez que les images sont en format AVIF ou WebP
3. Vérifiez les temps de chargement
4. Testez sur mobile et desktop

## Remarques importantes

- Les images WordPress doivent être accessibles publiquement
- Les images Supabase nécessitent les bonnes permissions
- Le premier chargement peut être plus lent (génération des images optimisées)
- Les chargements suivants seront instantanés grâce au cache
