# Correctifs Maintenance & Médiathèque

Date: 3 Janvier 2026

## Résumé des modifications

### 1. Middleware - Mode Maintenance Optimisé

**Fichier**: `middleware.ts`

#### Problème résolu
Le middleware bloquait l'accès administrateur même en mode maintenance, empêchant les admins de désactiver le mode maintenance.

#### Solution implémentée
- Liste de routes exemptées du mode maintenance:
  - `/admin` et toutes ses sous-routes
  - `/api/admin` et toutes ses sous-routes
  - `/api/auth` (authentification Supabase)
  - Pages d'authentification (`/auth/login`, `/auth/register`, etc.)
  - Pages de debug et outils admin

- Double protection:
  1. Routes exemptées: accès direct sans vérification
  2. Vérification du rôle admin pour les autres routes en mode maintenance

#### Comportement
- **Admin connecté**: Accès total au site même en maintenance
- **Utilisateur public**: Redirection vers `/maintenance` quand le mode est actif
- **Routes exemptées**: Toujours accessibles (login, admin, API)

---

### 2. MediaLibrary - Stabilisation Complète

**Fichier**: `components/MediaLibrary.tsx`

#### Problèmes résolus
1. **Erreurs d'hydratation React #460**: IDs non stables entre serveur et client
2. **Images qui disparaissent**: Données temporaires non persistées
3. **Crashes React**: Erreurs de rendu qui cassaient toute la galerie

#### Solutions implémentées

##### A. État `mounted` pour éviter l'hydratation
```typescript
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) {
  return <Loader2 />; // Pas de rendu avant hydratation
}
```

##### B. IDs stables basés sur le chemin du fichier
Au lieu de `Math.random()` et `Date.now()`, utilisation d'un hash du chemin:
```typescript
const filePath = `${bucket}/${folder}/${file.name}`;
const stableId = `storage-${Buffer.from(filePath).toString('base64')...}`;
```

##### C. Synchronisation automatique depuis Storage
Si `media_library` est vide:
1. Appel automatique à l'API de sync
2. Synchronisation des fichiers Storage vers la table
3. Rechargement des données depuis la base

##### D. Gestion d'erreurs robuste
```typescript
{safeFiles.map((file) => {
  try {
    // Validation stricte
    if (!file?.id || !rawUrl) return null;

    // Rendu de la carte
    return <Card>...</Card>;

  } catch (renderError) {
    // Si une image bug, les autres continuent de s'afficher
    console.error('Render error:', file?.id, renderError);
    return null;
  }
})}
```

##### E. Validation stricte des données
- Filtrage avec try/catch pour éviter les erreurs fatales
- Vérification de l'existence de `id`, `url`, `filename`
- Support des anciens et nouveaux formats de données

---

### 3. API Sync Media Library

**Fichier**: `app/api/admin/sync-media-library/route.ts`

#### Amélioration
Support pour synchroniser un bucket spécifique:
```typescript
POST /api/admin/sync-media-library
Body: { bucket: "product-images" }
```

Permet une synchronisation ciblée et plus rapide.

---

### 4. Base de données - RLS Sécurisé

**Migration**: `ensure_media_library_rls_security.sql`

#### Politiques RLS appliquées

```sql
-- SELECT: Tout le monde peut voir les images (public)
CREATE POLICY "Public can view all media files"
  ON media_library FOR SELECT
  USING (true);

-- INSERT: Seulement les utilisateurs authentifiés
CREATE POLICY "Authenticated users can insert media"
  ON media_library FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: Seulement les utilisateurs authentifiés
CREATE POLICY "Authenticated users can update media"
  ON media_library FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

-- DELETE: Seulement les utilisateurs authentifiés
CREATE POLICY "Authenticated users can delete media"
  ON media_library FOR DELETE
  TO authenticated
  USING (true);
```

#### Nettoyage
- Suppression de toutes les politiques en double
- Recréation avec noms clairs et cohérents
- service_role bypass RLS automatiquement (pas de politique explicite)

---

## Vérifications effectuées

### 1. Colonne `is_maintenance_mode`
Tous les fichiers utilisent bien le nom de colonne exact:
- `middleware.ts` ✓
- `app/api/admin/maintenance/route.ts` ✓
- `app/admin/site/page.tsx` ✓

### 2. Build réussi
```bash
npm run build
✓ Compiled successfully
```

---

## Tests recommandés

### Mode Maintenance
1. Activer le mode maintenance depuis `/admin/site`
2. Vérifier que les utilisateurs publics sont redirigés vers `/maintenance`
3. Vérifier que l'admin peut toujours accéder à `/admin`
4. Se déconnecter et vérifier qu'on peut accéder à `/auth/login`
5. Désactiver le mode maintenance depuis l'interface admin

### Médiathèque
1. Aller sur `/admin/mediatheque`
2. Cliquer sur "Sync media_library" pour peupler la base
3. Vérifier que les images s'affichent
4. Rafraîchir la page (F5) et vérifier que les images restent
5. Changer d'onglet (Produits/Catégories)
6. Uploader une nouvelle image
7. Vérifier qu'elle apparaît immédiatement

### Erreurs React
1. Ouvrir la console du navigateur (F12)
2. Naviguer sur `/admin/mediatheque`
3. Vérifier qu'il n'y a plus d'erreurs React #460
4. Vérifier qu'il n'y a plus d'erreurs "Minified React error"

---

## Sécurité

### RLS media_library
- ✓ Public peut lire (nécessaire pour afficher les images)
- ✓ Seuls les authentifiés peuvent écrire/modifier/supprimer
- ✓ Service role bypass automatique pour les syncs

### Mode Maintenance
- ✓ Admin garde un accès complet
- ✓ Routes d'authentification toujours accessibles
- ✓ API admin protégée mais accessible pour la désactivation

---

## Performance

### Optimisations
- Chargement lazy des images (`loading="lazy"`)
- Synchronisation ciblée par bucket
- Validation des données en amont pour éviter les re-renders
- IDs stables pour éviter les re-montages de composants

---

## Prochaines étapes recommandées

1. Tester le mode maintenance en production
2. Vérifier les permissions RLS sur `site_settings`
3. Monitorer les logs lors des uploads d'images
4. Tester la suppression d'images orphelines
