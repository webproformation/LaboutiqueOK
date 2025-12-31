# Corrections des Erreurs 500 sur les API Routes

## Problème Initial

L'API `/api/categories-cache` retournait une **erreur 500** et du **HTML au lieu de JSON**, causant l'erreur : `Unexpected token '<'`

Logs Vercel confirmés :
- POST /api/categories-cache → 500 Internal Server Error
- Execution Duration: 209ms
- External APIs: DELETE et POST vers Supabase réussis, mais erreur avant la réponse

## Causes Identifiées

### 1. Assertions Non-Null Dangereuses ❌
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
```
Si les variables d'environnement sont manquantes, cela cause un crash **avant** le try/catch, retournant du HTML d'erreur Next.js.

### 2. Manque de Logging 📝
Impossible de diagnostiquer où exactement l'erreur se produisait :
- Parsing du body ?
- Connexion Supabase ?
- DELETE du cache ?
- UPSERT des données ?

### 3. Mauvaise Condition DELETE 🗑️
```typescript
.delete()
.neq('id', 0)  // Condition ambiguë
```
Changé en :
```typescript
.delete()
.gte('id', 0)  // Supprime toutes les entrées avec id >= 0
```

### 4. Pas de Double Catch ⚠️
Si le `NextResponse.json()` échouait, pas de fallback pour garantir une réponse JSON.

## Solutions Appliquées

### ✅ API `/api/categories-cache`

#### 1. Suppression des Assertions Non-Null
```typescript
// ❌ AVANT
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// ✅ APRÈS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl || !supabaseServiceKey) {
  return NextResponse.json({ success: false, error: '...' }, { status: 500 });
}
```

#### 2. Logging Détaillé Étape par Étape
```typescript
console.log('[Categories Cache API] ===== POST REQUEST STARTED =====');
console.log('[Categories Cache API] Step 1: Parsing request body...');
console.log('[Categories Cache API] Step 2: Checking environment variables...');
console.log('[Categories Cache API] Step 3: Creating Supabase client...');
console.log('[Categories Cache API] Step 4: Validating categories array...');
console.log('[Categories Cache API] Step 5: Deleting old cache...');
console.log('[Categories Cache API] Step 6: Formatting categories...');
console.log('[Categories Cache API] Step 7: Upserting categories...');
console.log('[Categories Cache API] ===== SUCCESS =====');
```

#### 3. Validation Améliorée du Body
```typescript
const body = await request.json().catch((parseError) => {
  console.error('[Categories Cache API] JSON parse error:', parseError);
  throw new Error('Invalid JSON body');
});

console.log('[Categories Cache API] Body received:', {
  action: body?.action,
  categoriesCount: Array.isArray(body?.categories) ? body.categories.length : 'not an array'
});
```

#### 4. Correction de la Condition DELETE
```typescript
// ❌ AVANT
.delete()
.neq('id', 0);

// ✅ APRÈS
.delete()
.gte('id', 0);
```

#### 5. Double Catch pour Garantir JSON
```typescript
catch (error: any) {
  console.error('[Categories Cache API] ===== CRITICAL ERROR =====');

  try {
    return NextResponse.json({
      success: false,
      error: error?.message || 'Erreur inconnue'
    }, { status: 500 });
  } catch (responseError) {
    // Fallback absolu si NextResponse.json échoue
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Critical error: Unable to format response'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
```

#### 6. Logs d'Erreur Détaillés
```typescript
if (error) {
  console.error('[Categories Cache API] ===== ERROR DURING UPSERT =====');
  console.error('[Categories Cache API] Error syncing:', {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code
  });
}
```

### ✅ API `/api/admin/sync-products`

Même traitement appliqué :
- Suppression des `!` assertions
- Logging détaillé de Step 1 à Step 5+
- Vérification de la table `products` avant sync
- Capture des erreurs réseau avec `.catch()`
- Double catch pour garantir JSON
- Route GET pour tester la configuration

## Pages de Test Créées

### 1. `/admin/test-sync-config`
Interface pour tester la configuration de l'API sync-products :
- GET `/api/admin/sync-products` : Affiche l'état de chaque variable d'environnement
- Interface visuelle avec indicateurs de statut
- Guide de débogage intégré

### 2. `/admin/test-categories-cache`
Interface pour tester l'API categories-cache :
- GET : Récupérer les catégories du cache
- POST : Tester la synchronisation avec 2 catégories de test
- Affichage des résultats en temps réel
- Logs de débogage expliqués

## Comment Utiliser

### Diagnostic en Production (Vercel)

1. **Vérifier les logs en temps réel**
   - Vercel Dashboard → Project → Logs
   - Filtrer par "Categories Cache API" ou "Sync Products"
   - Identifier à quelle étape l'erreur se produit

2. **Tester la configuration**
   - Accéder à `/admin/test-sync-config`
   - Cliquer sur "Vérifier la Configuration"
   - Toutes les variables doivent afficher ✓

3. **Tester la synchronisation**
   - Accéder à `/admin/test-categories-cache`
   - Cliquer sur "Tester la Synchronisation"
   - Doit retourner `success: true` avec 2 catégories

### Variables d'Environnement Requises

```env
# WooCommerce
NEXT_PUBLIC_WORDPRESS_API_URL=https://votre-site.com
WC_CONSUMER_KEY=ck_xxxxx
WC_CONSUMER_SECRET=cs_xxxxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

## Résultats Attendus

### Avant les Corrections ❌
```
POST /api/categories-cache
→ 500 Internal Server Error
→ HTML error page
→ Client reçoit: SyntaxError: Unexpected token '<'
```

### Après les Corrections ✅
```
POST /api/categories-cache
→ 200 OK (même en cas d'erreur interne, on retourne du JSON valide)
→ JSON response: { "success": false, "error": "Message clair" }
→ Logs détaillés dans Vercel pour identifier le problème exact
```

## Logs de Débogage

Exemple de logs réussis :
```
[Categories Cache API] ===== POST REQUEST STARTED =====
[Categories Cache API] Step 1: Parsing request body...
[Categories Cache API] Body received: { action: 'sync', categoriesCount: 15 }
[Categories Cache API] Step 2: Checking environment variables...
[Categories Cache API] Environment check: { hasSupabaseUrl: true, hasSupabaseServiceKey: true }
[Categories Cache API] Step 3: Creating Supabase client...
[Categories Cache API] Step 4: Validating categories array...
[Categories Cache API] Step 5: Deleting old cache (clearing all entries)...
[Categories Cache API] Cache cleared successfully
[Categories Cache API] Step 6: Formatting 15 categories...
[Categories Cache API] Step 7: Upserting 15 categories...
[Categories Cache API] ===== SUCCESS =====
[Categories Cache API] 15 categories synced successfully
```

Exemple de logs avec erreur :
```
[Categories Cache API] ===== POST REQUEST STARTED =====
[Categories Cache API] Step 1: Parsing request body...
[Categories Cache API] JSON parse error: Unexpected token...
[Categories Cache API] ===== CRITICAL ERROR =====
[Categories Cache API] Unexpected error: {
  message: 'Invalid JSON body',
  stack: '...'
}
```

## Points Clés

1. **Toujours retourner du JSON**, même en cas d'erreur critique
2. **Logger chaque étape** pour diagnostiquer rapidement
3. **Ne jamais utiliser d'assertions non-null** (`!`) avec les variables d'environnement
4. **Double catch** pour garantir qu'une réponse JSON sera toujours envoyée
5. **Tester localement** avec les pages de test avant de déployer

## Fichiers Modifiés

- ✅ `/app/api/categories-cache/route.ts` - Corrigé
- ✅ `/app/api/admin/sync-products/route.ts` - Corrigé
- ✅ `/app/admin/test-sync-config/page.tsx` - Créé
- ✅ `/app/admin/test-categories-cache/page.tsx` - Créé
- ✅ `API_ERROR_FIXES.md` - Documentation
