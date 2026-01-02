# Fix: Affichage des images dans /admin/mediatheque

## Problème identifié

Les images uploadées dans Supabase Storage n'apparaissaient pas dans l'interface `/admin/mediatheque`.

**Cause :** Le composant `MediaLibrary` lit depuis la table `media_library`, mais l'insertion dans cette table peut échouer lors de la synchronisation à cause des RLS policies ou d'autres contraintes.

---

## Solutions implémentées

### 1. Logs améliorés dans sync-media API

**Fichier :** `app/api/admin/sync-media/route.ts`

**Modifications :**
- Ajout de logs détaillés lors de l'insertion dans `media_library`
- Affichage du code d'erreur, des détails et des hints
- Confirmation visuelle quand l'insertion réussit

**Exemple de logs :**
```
[Media Sync] [1/50] Creating media_library entry...
[Media Sync] [1/50] ✅ Media library entry created: uuid-123
```

**En cas d'erreur :**
```
[Media Sync] [1/50] ⚠️ Media library insert failed: {
  error: "duplicate key value violates unique constraint",
  code: "23505",
  details: "Key (url)=(...) already exists",
  hint: "..."
}
```

---

### 2. Fallback Storage dans MediaLibrary

**Fichier :** `components/MediaLibrary.tsx`

**Fonctionnement :**

1. **Tentative principale :** Charger depuis `media_library`
   ```typescript
   const { data } = await supabase
     .from('media_library')
     .select('*')
     .eq('bucket_name', bucket)
     .order('created_at', { ascending: false });
   ```

2. **Fallback automatique :** Si `media_library` est vide, lister depuis Storage
   ```typescript
   if (safeFiles.length === 0) {
     const { data: storageFiles } = await supabase
       .storage
       .from(bucket)
       .list(folder, { limit: 100 });

     // Convertir en format MediaFile
     safeFiles = storageFiles.map(file => ({
       id: file.id || file.name,
       filename: file.name,
       url: getPublicUrl(file),
       bucket_name: bucket,
       file_size: file.metadata?.size || 0,
       mime_type: file.metadata?.mimetype || 'image/jpeg',
       created_at: file.created_at,
       usage_count: 0,
       is_orphan: false
     }));
   }
   ```

**Avantages :**
- ✅ Les images sont **toujours visibles** même si `media_library` est vide
- ✅ Aucune perte d'images
- ✅ Transparent pour l'utilisateur

**Logs de diagnostic :**
```
📚 Loaded 0 files from media_library (product-images)
⚠️ media_library is empty, falling back to Storage API...
✅ Found 45 files in Storage (product-images/products)
🔄 Converted 45 Storage files to MediaFile format
```

---

### 3. Nouvelle API : sync-media-library

**Fichier :** `app/api/admin/sync-media-library/route.ts`

**Objectif :** Synchroniser la table `media_library` depuis Supabase Storage

**Processus :**
1. Lister tous les fichiers dans Storage (product-images et category-images)
2. Pour chaque fichier, vérifier s'il existe déjà dans `media_library`
3. Si non, créer une entrée dans `media_library`

**Code clé :**
```typescript
// List from Storage
const { data: storageFiles } = await supabase
  .storage
  .from(bucket)
  .list(folder, { limit: 1000 });

// For each file
for (const file of storageFiles) {
  const publicUrl = getPublicUrl(file);

  // Check if exists
  const { data: existingMedia } = await supabase
    .from('media_library')
    .select('id')
    .eq('url', publicUrl)
    .maybeSingle();

  if (!existingMedia) {
    // Insert
    await supabase
      .from('media_library')
      .insert({
        filename: file.name,
        url: publicUrl,
        bucket_name: bucket,
        file_size: file.metadata?.size || 0,
        mime_type: file.metadata?.mimetype || 'image/jpeg',
        usage_count: 0,
        is_orphan: false
      });
  }
}
```

**Réponse API :**
```json
{
  "success": true,
  "message": "45 fichiers synchronisés dans media_library",
  "totalSynced": 45,
  "totalErrors": 0
}
```

---

### 4. Bouton Sync dans l'interface

**Fichier :** `app/admin/mediatheque/page.tsx`

**Nouveau bouton :**
```tsx
<Button
  variant="outline"
  size="sm"
  onClick={handleSyncMediaLibrary}
  disabled={syncingLibrary}
>
  {syncingLibrary ? (
    <>
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      Sync...
    </>
  ) : (
    <>
      <Database className="h-4 w-4 mr-2" />
      Sync media_library
    </>
  )}
</Button>
```

**Emplacement :** Dans la section "Bibliothèque de médias", à côté du bouton "Nettoyer les orphelins"

**Fonction associée :**
```typescript
const handleSyncMediaLibrary = async () => {
  if (!confirm('Synchroniser la table media_library depuis Supabase Storage ?')) {
    return;
  }

  setSyncingLibrary(true);
  try {
    const response = await fetch('/api/admin/sync-media-library', {
      method: 'POST'
    });

    const result = await response.json();

    if (result.success) {
      toast.success(`${result.totalSynced} fichiers synchronisés dans media_library`);
      await loadMigrationStatus();
      router.refresh();
      setRefreshKey(prev => prev + 1);
    }
  } catch (error) {
    toast.error('Erreur lors de la synchronisation');
  } finally {
    setSyncingLibrary(false);
  }
};
```

---

## Utilisation

### Cas 1 : Images déjà uploadées mais invisibles

**Symptôme :** Les images sont dans Storage mais pas dans l'interface

**Solution automatique :**
1. Ouvrir `/admin/mediatheque`
2. Les images s'affichent automatiquement (fallback Storage)

**Solution manuelle (recommandée) :**
1. Ouvrir `/admin/mediatheque`
2. Cliquer sur le bouton "Sync media_library"
3. Confirmer l'opération
4. Les images sont maintenant dans `media_library` ET visibles

---

### Cas 2 : Nouvelle synchronisation WordPress

**Processus :**
1. Aller sur `/admin/mediatheque`
2. Cliquer sur "Synchroniser les images" (section bleue)
3. Les images sont :
   - ✅ Téléchargées depuis WordPress
   - ✅ Uploadées dans Storage
   - ✅ Insérées dans `media_library` (si RLS permet)
   - ✅ Produits mis à jour avec URLs Supabase
4. Si `media_library` reste vide (RLS bloque) :
   - Les images sont quand même visibles (fallback Storage)
   - Optionnel : Cliquer sur "Sync media_library" pour forcer l'insertion

---

## Tests de validation

### Test 1 : Vérifier le fallback Storage

**Étapes :**
1. Vider la table `media_library` :
   ```sql
   DELETE FROM media_library WHERE bucket_name = 'product-images';
   ```
2. Aller sur `/admin/mediatheque`
3. Vérifier les logs console :
   ```
   📚 Loaded 0 files from media_library (product-images)
   ⚠️ media_library is empty, falling back to Storage API...
   ✅ Found 45 files in Storage (product-images/products)
   🔄 Converted 45 Storage files to MediaFile format
   ```
4. Les images doivent s'afficher ✅

---

### Test 2 : Synchroniser media_library

**Étapes :**
1. Garder `media_library` vide (comme Test 1)
2. Sur `/admin/mediatheque`, cliquer sur "Sync media_library"
3. Confirmer
4. Observer le toast : "45 fichiers synchronisés dans media_library"
5. Vérifier en base de données :
   ```sql
   SELECT COUNT(*) FROM media_library WHERE bucket_name = 'product-images';
   -- Devrait retourner 45
   ```
6. Rafraîchir la page
7. Les images sont maintenant chargées depuis `media_library` ✅

---

### Test 3 : Synchronisation WordPress complète

**Étapes :**
1. S'assurer qu'il y a des produits avec images WordPress :
   ```sql
   SELECT COUNT(*) FROM products
   WHERE image_url LIKE '%wp.laboutiquedemorgane.com%';
   ```
2. Sur `/admin/mediatheque`, cliquer sur "Synchroniser les images"
3. Observer les logs serveur :
   ```
   [Media Sync] [1/50] Processing image for product 123
   [Media Sync] [1/50] ✅ Downloaded: 45678 bytes
   [Media Sync] [1/50] ✅ Uploaded to Supabase
   [Media Sync] [1/50] Creating media_library entry...
   [Media Sync] [1/50] ✅ Media library entry created: uuid-123
   [Media Sync] [1/50] ✅ Product 123 updated
   ```
4. Si erreur RLS sur `media_library` :
   ```
   [Media Sync] [1/50] ⚠️ Media library insert failed: RLS policy violation
   ```
5. Vérifier que les produits sont quand même mis à jour :
   ```sql
   SELECT woocommerce_id, image_url FROM products
   WHERE image_url LIKE '%supabase.co%';
   ```
6. Les images doivent être visibles dans `/admin/mediatheque` ✅

---

## Diagnostic des erreurs RLS

Si l'insertion dans `media_library` échoue systématiquement :

### 1. Vérifier les policies RLS

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'media_library'
ORDER BY policyname;
```

**Policies attendues :**
- INSERT policy pour `service_role` ou `anon`
- SELECT policy pour `anon` (lecture publique)

---

### 2. Vérifier si service_role bypasse RLS

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'media_library';
```

**Si `rowsecurity = true` :** RLS est activée

**Solution temporaire :** Créer une policy permissive pour service_role
```sql
CREATE POLICY "Allow service_role to insert media"
ON media_library
FOR INSERT
TO service_role
USING (true)
WITH CHECK (true);
```

---

### 3. Vérifier les contraintes de la table

```sql
\d media_library
```

**Contraintes potentiellement problématiques :**
- `UNIQUE(url)` : L'URL existe déjà
- `NOT NULL` sur certains champs : Un champ obligatoire est null
- Foreign keys : Référence invalide

**Solution :** Ajuster les données insérées dans l'API

---

## Architecture finale

```
┌─────────────────────────────────────────┐
│  /admin/mediatheque (Interface)         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  MediaLibrary Component                 │
│                                         │
│  1. Essaye de charger depuis            │
│     media_library                       │
│                                         │
│  2. Si vide : Fallback Storage API      │
│     (liste directement les fichiers)    │
│                                         │
│  3. Convertit en format MediaFile       │
│                                         │
│  4. Affiche les images                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Bouton "Sync media_library"            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  /api/admin/sync-media-library          │
│                                         │
│  Pour chaque fichier dans Storage :     │
│  - Vérifier si existe dans media_library│
│  - Si non : Insérer                     │
└─────────────────────────────────────────┘
```

---

## Logs de diagnostic

### Console navigateur

**Chargement normal (media_library rempli) :**
```
📚 Loaded 45 files from media_library (product-images)
🖼️ [MEDIA_LIBRARY] Image render: {
  id: "uuid-123",
  filename: "product_123_1704105600000_abc123.jpg",
  rawUrl: "https://qcqbtmvbvipsxwjlgjvk.supabase.co/storage/...",
  finalUrl: "https://qcqbtmvbvipsxwjlgjvk.supabase.co/storage/...",
  bucket: "product-images"
}
```

**Chargement avec fallback (media_library vide) :**
```
📚 Loaded 0 files from media_library (product-images)
⚠️ media_library is empty, falling back to Storage API...
✅ Found 45 files in Storage (product-images/products)
🔄 Converted 45 Storage files to MediaFile format
🖼️ [MEDIA_LIBRARY] Image render: { ... }
```

---

### Console serveur (sync-media-library)

```
[Sync Media Library] Starting synchronization...
[Sync Media Library] Processing bucket: product-images
[Sync Media Library] Found 45 files in product-images/products
[Sync Media Library] ⏭️ Already exists: product_123_1704105600000_abc123.jpg
[Sync Media Library] ✅ Synced: product_124_1704105601234_def456.jpg
[Sync Media Library] ✅ Synced: product_125_1704105602468_ghi789.jpg
...
[Sync Media Library] Processing bucket: category-images
[Sync Media Library] Found 10 files in category-images/categories
...
[Sync Media Library] Completed: 45 synced, 0 errors
```

---

## Résumé des fichiers modifiés

### Créés
1. `/app/api/admin/sync-media-library/route.ts` (133 lignes)
   - API pour synchroniser `media_library` depuis Storage

### Modifiés
1. `/app/api/admin/sync-media/route.ts`
   - Logs améliorés pour l'insertion dans `media_library`

2. `/components/MediaLibrary.tsx`
   - Fallback automatique vers Storage API si `media_library` vide
   - Conversion des fichiers Storage en format MediaFile

3. `/app/admin/mediatheque/page.tsx`
   - Ajout du bouton "Sync media_library"
   - Fonction `handleSyncMediaLibrary()`
   - État `syncingLibrary`

---

## Statut final

✅ **Problème résolu : Les images sont maintenant toujours visibles**
✅ **Fallback automatique implémenté (Storage → MediaLibrary)**
✅ **API de synchronisation créée (/api/admin/sync-media-library)**
✅ **Bouton dans l'interface pour forcer la synchronisation**
✅ **Logs détaillés pour diagnostic**
✅ **Pas de perte d'images**

**Le système est robuste et resilient** ✅

---

## Prochaines étapes (optionnelles)

### 1. Corriger les RLS policies sur media_library

Si les insertions échouent systématiquement, créer une policy permissive :

```sql
CREATE POLICY "Allow service_role to manage media"
ON media_library
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

### 2. Synchronisation automatique au démarrage

Ajouter un hook dans `MediaLibrary` pour synchroniser automatiquement si vide :

```typescript
useEffect(() => {
  loadMediaFiles().then(() => {
    if (files.length === 0) {
      // Auto-sync si vide
      fetch('/api/admin/sync-media-library', { method: 'POST' });
    }
  });
}, [bucket]);
```

### 3. Indicateur visuel de la source

Ajouter un badge pour indiquer si les images viennent de `media_library` ou Storage :

```tsx
{loadedFromStorage && (
  <Badge variant="outline" className="text-xs">
    <AlertCircle className="h-3 w-3 mr-1" />
    Chargé depuis Storage
  </Badge>
)}
```
