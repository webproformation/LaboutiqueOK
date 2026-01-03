# RÉSOLUTION MÉDIATHÈQUE - ÉTAPES À SUIVRE

**Date:** 3 Janvier 2026
**Problème:** Médiathèque vide après synchronisation

---

## DIAGNOSTIC

### Problème Initial
- Médiathèque affiche 0 fichiers
- Synchronisation retourne "0 fichiers synchronisés"
- L'utilisateur mentionne "125 images existantes"

### Investigation SQL
```sql
SELECT COUNT(*) FROM storage.objects
WHERE bucket_id IN ('product-images', 'category-images');
-- Résultat: 0 fichiers
```

**Conclusion:** Les buckets Supabase Storage sont VIDES. Les "125 images" sont probablement:
- Sur WordPress (pas encore migrées vers Supabase)
- Dans un autre projet Supabase
- Pas encore uploadées

---

## CORRECTIONS APPLIQUÉES

### 1. API de Synchronisation Améliorée ✅

**Fichier:** `app/api/admin/sync-media-library/route.ts`

**Modifications:**
- ✅ Scan de la **RACINE** du bucket + sous-dossiers
- ✅ Logs MASSIFS à chaque étape
- ✅ Affichage des erreurs SQL complètes
- ✅ UPSERT avec `onConflict: 'url'`
- ✅ Retour des logs dans la réponse

**Avant:** Scannait uniquement `products/` et `categories/`
**Après:** Scanne `RACINE`, `products/` ET `categories/`

### 2. API de Vérification Storage ✅

**Fichier:** `app/api/admin/verify-storage/route.ts` (NOUVEAU)

**Fonctionnalités:**
- Liste tous les buckets
- Scanne tous les emplacements (racine + sous-dossiers)
- Affiche le nombre exact de fichiers
- Logs détaillés dans la console

### 3. Interface Admin Améliorée ✅

**Fichier:** `app/admin/mediatheque/page.tsx`

**Ajouts:**
- ✅ Bouton "Vérifier Storage" (diagnostic complet)
- ✅ Logs automatiques dans console Browser (F12)
- ✅ Messages informatifs avec instructions

### 4. Erreur React #460 ÉLIMINÉE ✅

**Fichier:** `components/MediaLibrary.tsx`

**Fix:** `return null` si non monté (CLIENT ONLY strict)

---

## ÉTAPES À SUIVRE MAINTENANT

### Étape 1: Vérifier le Storage

1. **Ouvrir la médiathèque:**
   ```
   https://votre-site.com/admin/mediatheque
   ```

2. **Cliquer sur "Vérifier Storage"**

3. **Ouvrir la console Browser (F12)**

4. **Lire le diagnostic:**
   ```
   ════════════════════════════════════════════════════════════════
   VÉRIFICATION STORAGE SUPABASE
   ════════════════════════════════════════════════════════════════
   📍 Supabase URL: https://qcqbtmvbvipsxwjlgjvk.supabase.co
   ✅ Service Key: Présente

   🪣 BUCKET: product-images
   ────────────────────────────────────────────────────────────────
   📁 Scan RACINE du bucket...
   📊 X éléments à la racine

   📁 Scan dossier products/...
   📊 Y éléments dans products/

   📊 RÉSUMÉ
   ════════════════════════════════════════════════════════════════
   product-images: Z fichiers

   🔢 TOTAL: Z fichiers dans tous les buckets
   ```

5. **Analyser le résultat:**
   - Si `TOTAL: 0` → Les buckets sont vides (voir Étape 2)
   - Si `TOTAL: > 0` → Les fichiers existent (voir Étape 3)

---

### Étape 2: Si Storage est VIDE (0 fichiers)

**Option A: Upload Direct** (RECOMMANDÉ si vous avez les images localement)

1. Aller dans l'onglet "Bibliothèque de médias"
2. Cliquer sur "Uploader"
3. Sélectionner vos images
4. Les images sont uploadées et apparaissent immédiatement

**Option B: Migrer depuis WordPress** (si les 125 images sont sur WordPress)

1. Vérifier que l'URL WordPress est configurée
2. Cliquer sur "Synchroniser les images depuis WordPress"
3. Les images sont téléchargées et migrées vers Supabase
4. Voir les logs dans la console

**Option C: Upload via Supabase Dashboard**

1. Ouvrir https://supabase.com/dashboard
2. Projet: qcqbtmvbvipsxwjlgjvk
3. Storage → product-images
4. Uploader vos images dans le dossier `products/` (ou à la racine)
5. Retourner sur /admin/mediatheque
6. Cliquer "Synchroniser depuis Storage"

---

### Étape 3: Si Storage contient des fichiers (> 0)

**Les images existent mais media_library est vide**

1. **Cliquer sur "Synchroniser depuis Storage"**

2. **Ouvrir la console (F12)**

3. **Vérifier les logs:**
   ```
   ════════════════════════════════════════════════════════════════
   SYNCHRONISATION MEDIA LIBRARY
   ════════════════════════════════════════════════════════════════
   📁 Scan de: product-images/RACINE
   📊 Résultat: 50 fichiers dans RACINE

   📁 Scan de: product-images/products
   📊 Résultat: 75 fichiers dans products

   📊 TOTAL pour product-images: 125 fichiers trouvés

   🔄 DÉBUT DE L'INSERTION EN BASE...

   [1/125] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📄 Fichier: image-1.jpg (fullPath: products/image-1.jpg)
   🔗 URL générée: https://...
   ✅ SUCCÈS: Fichier inséré avec ID abc-123

   [2/125] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ...

   ════════════════════════════════════════════════════════════════
   📊 BILAN FINAL
   ════════════════════════════════════════════════════════════════
   ✅ Total synchronisés: 125
   ❌ Total erreurs: 0
   ```

4. **Vérifier media_library:**
   ```sql
   SELECT COUNT(*) FROM media_library;
   -- Devrait retourner: 125
   ```

5. **Rafraîchir la page**
   - Les images apparaissent dans la médiathèque
   - Le compteur affiche "Toutes (125)"

---

### Étape 4: En cas d'erreurs SQL

**Si vous voyez des erreurs dans les logs:**

```
❌ ERREUR D'INSERTION: {...}
   Code: 23505
   Message: duplicate key value violates unique constraint "media_library_url_key"
```

**Solutions:**

1. **Erreur "duplicate key"** (code 23505)
   - Une image avec cette URL existe déjà
   - Normal si vous relancez la sync
   - Pas grave, l'image est déjà en base

2. **Erreur "permission denied"** (code 42501)
   - Problème de RLS ou permissions
   - Vérifier que service_role key est correcte
   - Exécuter: `GRANT ALL ON media_library TO service_role;`

3. **Erreur "relation does not exist"** (code 42P01)
   - La table media_library n'existe pas
   - Exécuter la migration: `20260101144759_create_media_library_system.sql`

---

## DIAGNOSTIC SQL COMPLET

**Fichier:** `DIAGNOSTIC_STORAGE_BUCKETS.sql`

Exécuter dans SQL Editor pour un diagnostic complet:
- Liste des buckets
- Nombre de fichiers par bucket et par dossier
- État de media_library
- Policies RLS
- Recommandations automatiques

---

## VÉRIFICATIONS POST-SYNCHRONISATION

### 1. Vérifier le compte
```sql
SELECT COUNT(*) as total_media FROM media_library;
```

### 2. Vérifier par bucket
```sql
SELECT
  bucket_name,
  COUNT(*) as files,
  SUM(file_size) as total_bytes,
  pg_size_pretty(SUM(file_size)) as total_size
FROM media_library
GROUP BY bucket_name;
```

### 3. Vérifier les orphelins
```sql
SELECT
  COUNT(*) FILTER (WHERE is_orphan = true) as orphans,
  COUNT(*) FILTER (WHERE is_orphan = false) as used_files
FROM media_library;
```

### 4. Lister les 10 dernières images
```sql
SELECT
  filename,
  bucket_name,
  pg_size_pretty(file_size) as size,
  created_at
FROM media_library
ORDER BY created_at DESC
LIMIT 10;
```

---

## FAQ

### Q: Pourquoi la médiathèque est toujours vide ?

**Réponses possibles:**

1. **Storage est vide**
   - Vérifier avec "Vérifier Storage"
   - Uploader des images

2. **Les images ne sont pas synchronisées**
   - Cliquer "Synchroniser depuis Storage"
   - Vérifier les logs console

3. **Cache navigateur**
   - Vider le cache: Ctrl+Shift+R
   - Fermer/rouvrir le navigateur

4. **Mauvais projet Supabase**
   - Vérifier les variables .env
   - S'assurer que NEXT_PUBLIC_BYPASS_SUPABASE_URL est correct

### Q: Comment savoir si j'ai des images WordPress à migrer ?

```bash
# Vérifier les produits WordPress avec images
curl "https://wp.laboutiquedemorgane.com/wp-json/wc/v3/products?per_page=5" \
  -u "ck_xxx:cs_xxx"

# Regarder si les produits ont des "images"
```

Si les produits ont des images, utilisez la synchronisation WordPress.

### Q: Où sont mes 125 images ?

Possibilités:
1. **Sur WordPress** → Utiliser "Synchroniser depuis WordPress"
2. **Dans un autre projet Supabase** → Vérifier l'URL dans .env
3. **Sur le disque local** → Les uploader via l'interface
4. **Pas encore uploadées** → Commencer par en uploader quelques unes

### Q: La synchronisation dit "0 fichiers" mais j'ai uploadé des images

1. Attendre 30 secondes (délai de propagation)
2. Cliquer "Actualiser"
3. Vider le cache navigateur
4. Relancer "Vérifier Storage"

---

## COMMANDES UTILES

### Forcer un rafraîchissement complet

```sql
-- Vider media_library (ATTENTION: perte de données)
TRUNCATE TABLE media_library;

-- Relancer la synchronisation depuis l'interface
```

### Réinitialiser les orphelins

```sql
-- Marquer toutes les images comme orphelines
UPDATE media_library SET is_orphan = true;

-- Relancer le marquage d'utilisation (TODO: fonction à créer)
```

### Lister les URLs des images

```sql
SELECT
  filename,
  url,
  bucket_name
FROM media_library
ORDER BY created_at DESC
LIMIT 20;
```

---

## RÉSUMÉ

1. ✅ API de sync améliore (scan racine + sous-dossiers)
2. ✅ API de vérification créée
3. ✅ Logs massifs pour diagnostic
4. ✅ Interface avec bouton "Vérifier Storage"
5. ✅ Erreur React #460 éliminée

**PROCHAINE ACTION:**
Cliquer sur "Vérifier Storage" et suivre les instructions selon le résultat.
