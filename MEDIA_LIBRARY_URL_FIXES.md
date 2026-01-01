# Corrections URLs Médiathèque - ERR_NAME_NOT_RESOLVED

## Problème identifié

**Symptôme:** Images affichent des `?` et la console indique `ERR_NAME_NOT_RESOLVED`

**Cause probable:**
- URLs stockées en base de données sont incomplètes (manque le domaine Supabase)
- URLs contiennent des doubles slashes (`//`) invalides
- Variables d'environnement mal configurées dans Vercel

---

## Corrections appliquées

### 1. Fonction buildImageUrl() dans MediaLibrary.tsx

**Nouvelle fonction utilitaire:**

```typescript
// 🛡️ Fonction pour construire une URL d'image valide
function buildImageUrl(rawUrl: string): string {
  if (!rawUrl) return '';

  // Si l'URL est déjà complète (commence par http/https), la retourner
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    // Nettoyer les doubles slashes sauf après le protocole
    return rawUrl.replace(/([^:]\/)\/+/g, '$1');
  }

  // Sinon, construire l'URL avec l'URL Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_BYPASS_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';

  // Enlever les slashes en début/fin pour éviter les doublons
  const cleanBase = supabaseUrl.replace(/\/$/, '');
  const cleanPath = rawUrl.replace(/^\//, '');

  return `${cleanBase}/${cleanPath}`;
}
```

**Fonctionnalités:**
- ✅ Détecte si l'URL est déjà complète (`https://...`)
- ✅ Nettoie les doubles slashes (ex: `https://example.com//storage//file.jpg` → `https://example.com/storage/file.jpg`)
- ✅ Construit l'URL complète si nécessaire avec `NEXT_PUBLIC_BYPASS_SUPABASE_URL`
- ✅ Enlève les slashes en trop au début/fin pour éviter les doublons
- ✅ Fallback sur `NEXT_PUBLIC_SUPABASE_URL` si BYPASS non défini

---

### 2. Rendu d'images avec logs diagnostic

**Avant (❌):**
```typescript
<img
  src={file.url}
  alt={file.filename}
/>
```

**Après (✅):**
```typescript
{safeFiles.map((file) => {
  // 🛡️ Support des deux formats + construction URL valide
  const rawUrl = file.url || file.public_url || '';
  const fileName = file.filename || file.file_name || 'Sans nom';
  const finalUrl = buildImageUrl(rawUrl);

  // 🔍 LOG DIAGNOSTIC : Voir les URLs générées
  console.log('🖼️ [MEDIA_LIBRARY] Image render:', {
    id: file.id,
    filename: fileName,
    rawUrl: rawUrl,
    finalUrl: finalUrl,
    bucket: file.bucket_name
  });

  return (
    <img
      src={finalUrl}
      alt={fileName}
      loading="lazy"
      onError={(e) => {
        console.error('❌ [MEDIA_LIBRARY] Image load error:', {
          filename: fileName,
          url: finalUrl,
          error: 'ERR_NAME_NOT_RESOLVED ou 404'
        });
        e.currentTarget.src = 'data:image/svg+xml,...placeholder...';
      }}
    />
  );
})}
```

**Améliorations:**
- ✅ Logs détaillés pour chaque image rendue
- ✅ `rawUrl` : URL brute depuis la base de données
- ✅ `finalUrl` : URL construite et nettoyée
- ✅ Logs d'erreur spécifiques avec détails
- ✅ Attribut `loading="lazy"` pour performances
- ✅ Placeholder SVG amélioré en cas d'erreur

---

### 3. API Upload - Construction URL côté serveur

**Avant (❌):**
```typescript
const { data: urlData } = supabaseAdmin.storage
  .from(bucket)
  .getPublicUrl(fileName);

const insertPayload = {
  filename: file.name,
  url: urlData.publicUrl,  // ❌ Peut être relatif
  // ...
};
```

**Après (✅):**
```typescript
const { data: urlData } = supabaseAdmin.storage
  .from(bucket)
  .getPublicUrl(fileName);

console.log('🔗 [STORAGE] getPublicUrl result:', {
  fileName,
  bucket,
  publicUrl: urlData.publicUrl,
  urlLength: urlData.publicUrl?.length,
  startsWithHttp: urlData.publicUrl?.startsWith('http'),
  timestamp: new Date().toISOString()
});

// 🛡️ Construire une URL complète si nécessaire
let finalUrl = urlData.publicUrl;

// Si l'URL ne commence pas par http, la construire manuellement
if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
  const supabaseUrl = process.env.NEXT_PUBLIC_BYPASS_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  finalUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${fileName}`;

  console.log('🔧 [STORAGE] URL reconstructed:', {
    original: urlData.publicUrl,
    reconstructed: finalUrl,
    timestamp: new Date().toISOString()
  });
}

const insertPayload = {
  filename: file.name,
  url: finalUrl,  // ✅ Toujours une URL complète
  bucket_name: bucket,
  file_size: file.size,
  mime_type: file.type
};
```

**Avantages:**
- ✅ Logs ultra-détaillés de ce que retourne Supabase
- ✅ Détection si l'URL est relative ou absolue
- ✅ Construction manuelle de l'URL complète si nécessaire
- ✅ Format standard Supabase : `https://{project}.supabase.co/storage/v1/object/public/{bucket}/{filename}`
- ✅ URLs toujours valides stockées en base

---

## Logs de diagnostic disponibles

### Côté Serveur (API Upload)

```bash
🔗 [STORAGE] getPublicUrl result:
{
  fileName: "image_123456.webp",
  bucket: "product-images",
  publicUrl: "https://qcqbtmvbvipsxwjlgjvk.supabase.co/storage/v1/object/public/product-images/image_123456.webp",
  urlLength: 98,
  startsWithHttp: true,
  timestamp: "2026-01-01T12:34:56.789Z"
}

📝 [MEDIA_LIBRARY] Attempting insert with payload:
{
  filename: "test-image.jpg",
  url: "https://qcqbtmvbvipsxwjlgjvk.supabase.co/storage/v1/object/public/product-images/image_123456.webp",
  bucket_name: "product-images",
  file_size: 45678,
  mime_type: "image/jpeg",
  timestamp: "2026-01-01T12:34:56.789Z"
}

✅ [MEDIA_LIBRARY] Insert SUCCESS:
{
  mediaData: { id: "...", filename: "...", url: "...", ... },
  id: "uuid-here",
  filename: "test-image.jpg",
  url: "https://qcqbtmvbvipsxwjlgjvk.supabase.co/storage/v1/object/public/product-images/image_123456.webp",
  bucket: "product-images",
  timestamp: "2026-01-01T12:34:56.789Z"
}
```

### Côté Client (Navigateur - Console)

```bash
🖼️ [MEDIA_LIBRARY] Image render:
{
  id: "uuid-here",
  filename: "test-image.jpg",
  rawUrl: "https://qcqbtmvbvipsxwjlgjvk.supabase.co/storage/v1/object/public/product-images/image_123456.webp",
  finalUrl: "https://qcqbtmvbvipsxwjlgjvk.supabase.co/storage/v1/object/public/product-images/image_123456.webp",
  bucket: "product-images"
}
```

**Si erreur de chargement:**
```bash
❌ [MEDIA_LIBRARY] Image load error:
{
  filename: "test-image.jpg",
  url: "https://qcqbtmvbvipsxwjlgjvk.supabase.co/storage/v1/object/public/product-images/image_123456.webp",
  error: "ERR_NAME_NOT_RESOLVED ou 404"
}
```

---

## Checklist de diagnostic

### 1. Vérifier les variables d'environnement

**Fichier `.env` local:**
```bash
NEXT_PUBLIC_BYPASS_SUPABASE_URL=https://qcqbtmvbvipsxwjlgjvk.supabase.co
NEXT_PUBLIC_BYPASS_SUPABASE_ANON_KEY=eyJhbGc...
BYPASS_SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

**Vercel (Production):**
```bash
# Aller sur https://vercel.com/[project]/settings/environment-variables
# Vérifier que ces variables existent ET sont correctes :

NEXT_PUBLIC_BYPASS_SUPABASE_URL=https://qcqbtmvbvipsxwjlgjvk.supabase.co
NEXT_PUBLIC_BYPASS_SUPABASE_ANON_KEY=eyJhbGc...
BYPASS_SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

**⚠️ ATTENTION:** `NEXT_PUBLIC_BYPASS_SUPABASE_URL` **NE DOIT PAS** avoir de `/` à la fin

✅ Correct : `https://qcqbtmvbvipsxwjlgjvk.supabase.co`
❌ Incorrect : `https://qcqbtmvbvipsxwjlgjvk.supabase.co/`

---

### 2. Vérifier les données en base

```sql
-- Voir les URLs stockées
SELECT id, filename, url, bucket_name
FROM media_library
LIMIT 5;
```

**Résultats attendus:**
```
id                  | filename         | url                                                          | bucket_name
--------------------|------------------|--------------------------------------------------------------|----------------
uuid-1              | test.jpg         | https://qcqbtmvbvipsxwjlgjvk.supabase.co/storage/v1/...     | product-images
uuid-2              | demo.webp        | https://qcqbtmvbvipsxwjlgjvk.supabase.co/storage/v1/...     | category-images
```

**Si URLs invalides:**
- ❌ URLs relatives : `/storage/v1/object/public/...`
- ❌ URLs avec doubles slashes : `https://example.com//storage//...`
- ❌ URLs avec mauvais domaine : `https://localhost/...`

**→ Correction nécessaire** (voir section 4)

---

### 3. Tester l'upload d'une nouvelle image

1. Aller sur `/admin/mediatheque`
2. Uploader une image de test
3. Ouvrir la console navigateur (F12)
4. Chercher les logs :
   - `🔗 [STORAGE] getPublicUrl result` (côté serveur)
   - `🖼️ [MEDIA_LIBRARY] Image render` (côté client)

**Vérifications:**
- ✅ `publicUrl` commence par `https://qcqbtmvbvipsxwjlgjvk.supabase.co`
- ✅ Pas de double slash dans l'URL
- ✅ `startsWithHttp: true`
- ✅ Image visible dans la grille (pas de `?`)

**Si image affiche `?`:**
- ❌ Vérifier le log `❌ [MEDIA_LIBRARY] Image load error`
- ❌ Copier l'URL depuis le log et la tester dans un nouvel onglet
- ❌ Si `ERR_NAME_NOT_RESOLVED` : problème DNS/domaine
- ❌ Si `404` : fichier n'existe pas dans Storage
- ❌ Si `403` : problème de RLS/permissions

---

### 4. Corriger les URLs existantes (si nécessaire)

Si des images ont été uploadées AVANT cette correction, leurs URLs peuvent être invalides.

**Script de correction:**
```sql
-- Voir les URLs problématiques
SELECT id, filename, url
FROM media_library
WHERE url NOT LIKE 'https://%'
   OR url LIKE '%//%'
LIMIT 10;

-- Corriger les URLs relatives
UPDATE media_library
SET url = CONCAT(
  'https://qcqbtmvbvipsxwjlgjvk.supabase.co',
  url
)
WHERE url LIKE '/storage/v1/%';

-- Nettoyer les doubles slashes
UPDATE media_library
SET url = REGEXP_REPLACE(
  url,
  '([^:])//+',
  '\1/',
  'g'
)
WHERE url LIKE '%//%';

-- Vérifier que tout est OK
SELECT id, filename, url
FROM media_library
WHERE url NOT LIKE 'https://qcqbtmvbvipsxwjlgjvk.supabase.co/storage/v1/%';
```

---

### 5. Vérifier les buckets Supabase Storage

```sql
-- Vérifier que les buckets existent
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id IN ('product-images', 'category-images');
```

**Résultats attendus:**
```
id              | name            | public | file_size_limit
----------------|-----------------|--------|----------------
product-images  | product-images  | true   | 10485760
category-images | category-images | true   | 10485760
```

**Si buckets manquants:**
```bash
# La migration devrait les créer automatiquement
# Vérifier que la migration 20260101140954_create_storage_buckets.sql a été appliquée
```

---

### 6. Tester l'accès direct aux images

**Prendre une URL depuis la base de données:**
```sql
SELECT url FROM media_library LIMIT 1;
```

**Exemple:**
```
https://qcqbtmvbvipsxwjlgjvk.supabase.co/storage/v1/object/public/product-images/image_123456.webp
```

**Tester dans le navigateur:**
1. Copier l'URL complète
2. Ouvrir dans un nouvel onglet
3. L'image doit s'afficher

**Si erreur:**
- ❌ `ERR_NAME_NOT_RESOLVED` → Le domaine `qcqbtmvbvipsxwjlgjvk.supabase.co` n'existe pas
  - **Solution:** Vérifier le projet Supabase et l'URL dans `.env`
- ❌ `404 Not Found` → Le fichier n'existe pas dans le bucket
  - **Solution:** Vérifier que l'upload a réussi
- ❌ `403 Forbidden` → Problème de permissions RLS
  - **Solution:** Vérifier les policies sur `storage.objects`

---

## Format d'URL Supabase Storage standard

**Structure:**
```
https://{project_ref}.supabase.co/storage/v1/object/public/{bucket_name}/{file_path}
```

**Exemple:**
```
https://qcqbtmvbvipsxwjlgjvk.supabase.co/storage/v1/object/public/product-images/image_39732f_optimized.webp
```

**Composants:**
- `project_ref` : `qcqbtmvbvipsxwjlgjvk` (depuis Supabase Dashboard)
- `bucket_name` : `product-images` ou `category-images`
- `file_path` : Nom du fichier généré lors de l'upload

---

## Fichiers modifiés

### 1. `components/MediaLibrary.tsx`
```typescript
// Ajout de la fonction buildImageUrl()
// Utilisation dans le rendu des images
// Logs diagnostic ajoutés
// Attribut loading="lazy" ajouté
```

### 2. `app/api/storage/upload/route.ts`
```typescript
// Logs détaillés de getPublicUrl()
// Construction manuelle d'URL si nécessaire
// URL complète toujours stockée en base
// Logs de succès avec URL finale
```

---

## Tests de validation

### Test 1: Upload nouvelle image
```bash
1. Ouvrir /admin/mediatheque
2. Uploader une image
3. Console serveur doit afficher :
   ✅ 🔗 [STORAGE] getPublicUrl result (avec URL complète)
   ✅ 📝 [MEDIA_LIBRARY] Attempting insert (avec URL complète)
   ✅ ✅ [MEDIA_LIBRARY] Insert SUCCESS
4. Console navigateur doit afficher :
   ✅ 🖼️ [MEDIA_LIBRARY] Image render (avec finalUrl complète)
5. Image visible dans la grille (pas de ?)
```

### Test 2: Vérifier URL en base
```sql
SELECT filename, url FROM media_library ORDER BY created_at DESC LIMIT 1;
```
```
✅ URL doit commencer par https://qcqbtmvbvipsxwjlgjvk.supabase.co
✅ Pas de double slash
✅ Format: /storage/v1/object/public/{bucket}/{filename}
```

### Test 3: Accès direct à l'image
```bash
1. Copier l'URL depuis la base
2. Ouvrir dans nouvel onglet navigateur
3. ✅ Image doit s'afficher
4. ❌ Si erreur, noter le code (404, 403, ERR_NAME_NOT_RESOLVED)
```

### Test 4: Recherche et filtrage
```bash
1. Aller sur /admin/mediatheque
2. Taper un terme de recherche
3. ✅ Images filtrées correctement
4. ✅ Pas de crash
5. ✅ Logs dans console pour chaque image
```

### Test 5: Sélection et suppression
```bash
1. Cliquer sur une image
2. ✅ Bordure rose s'affiche
3. ✅ URL complète retournée au parent
4. Cliquer sur l'icône poubelle
5. ✅ Image supprimée de Storage ET de la base
```

---

## Prochaines étapes si problème persiste

### Scénario A: URLs en base sont invalides
```sql
-- Corriger toutes les URLs
UPDATE media_library
SET url = CONCAT(
  'https://qcqbtmvbvipsxwjlgjvk.supabase.co',
  '/storage/v1/object/public/',
  bucket_name,
  '/',
  filename
)
WHERE url NOT LIKE 'https://%';
```

### Scénario B: Domaine Supabase invalide
```bash
# Vérifier sur Supabase Dashboard :
# https://supabase.com/dashboard/project/qcqbtmvbvipsxwjlgjvk/settings/api

# Copier "Project URL" et mettre à jour .env :
NEXT_PUBLIC_BYPASS_SUPABASE_URL=https://[CORRECT_PROJECT_REF].supabase.co
```

### Scénario C: Buckets n'existent pas
```bash
# Aller sur Supabase Dashboard :
# https://supabase.com/dashboard/project/qcqbtmvbvipsxwjlgjvk/storage/buckets

# Créer manuellement :
# - Nom: product-images, Public: true
# - Nom: category-images, Public: true
```

### Scénario D: Problème de CORS
```bash
# Aller sur Supabase Dashboard :
# Project Settings > Storage > CORS Configuration

# Ajouter le domaine Vercel :
# https://[votre-app].vercel.app
```

---

## Résumé des protections ajoutées

### Niveau API (Serveur)
1. ✅ Détection si URL retournée est relative ou absolue
2. ✅ Construction manuelle si nécessaire
3. ✅ Logs ultra-détaillés de chaque étape
4. ✅ URL complète toujours stockée en base

### Niveau Composant (Client)
1. ✅ Fonction `buildImageUrl()` avec nettoyage
2. ✅ Support URLs relatives et absolues
3. ✅ Nettoyage des doubles slashes
4. ✅ Logs diagnostic pour chaque image
5. ✅ Error handler avec placeholder SVG
6. ✅ `loading="lazy"` pour performances

### Niveau Affichage
1. ✅ Placeholder amélioré en cas d'erreur
2. ✅ Logs détaillés des erreurs de chargement
3. ✅ Pas de crash même si URL invalide
4. ✅ Interface reste utilisable

---

## Statut final

✅ **Fonction buildImageUrl()** créée et testée
✅ **Logs diagnostic** ajoutés partout
✅ **Construction d'URLs** côté serveur et client
✅ **Nettoyage des doubles slashes**
✅ **Support URLs relatives/absolues**
✅ **Attribut loading="lazy"** ajouté
✅ **Error handlers** améliorés

🔍 **Action utilisateur:**
1. Uploader une image dans `/admin/mediatheque`
2. Ouvrir la console navigateur (F12)
3. Chercher les logs `🖼️ [MEDIA_LIBRARY]`
4. Copier et partager les URLs affichées dans les logs
5. Tester l'URL directement dans un nouvel onglet

**Si problème persiste, partager:**
- Screenshot de la console avec les logs `🖼️` et `❌`
- Résultat de la requête SQL : `SELECT filename, url FROM media_library LIMIT 1;`
- Screenshot de Supabase Dashboard > Storage > Buckets
