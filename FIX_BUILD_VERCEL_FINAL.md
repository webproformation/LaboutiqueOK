# ✅ Corrections Build Vercel - Variables BYPASS

## Problème résolu

Le build Vercel échouait à cause de :
1. **Noms de variables incorrects** - Variables sans `NEXT_PUBLIC_` non accessibles côté client
2. **Erreurs pendant le build** - `throw new Error` qui interrompait la compilation
3. **Pré-rendu statique** - Routes API collectées pendant le build sans variables

---

## 🔧 Changements effectués

### 1. Variables d'environnement (.env + .env.example)

**AVANT (❌ incorrect):**
```env
BYPASS_SUPABASE_URL=https://qcqbtmvbvipsxwjlgjvk.supabase.co
BYPASS_SUPABASE_ANON_KEY=eyJhbGci...
BYPASS_SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

**APRÈS (✅ correct):**
```env
# Variables CLIENT + SERVEUR (visible côté navigateur)
NEXT_PUBLIC_BYPASS_SUPABASE_URL=https://qcqbtmvbvipsxwjlgjvk.supabase.co
NEXT_PUBLIC_BYPASS_SUPABASE_ANON_KEY=eyJhbGci...

# Variable SERVEUR UNIQUEMENT (sécurisée, jamais envoyée au client)
BYPASS_SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

**Raison:** Dans Next.js, les variables sans `NEXT_PUBLIC_` sont uniquement disponibles côté serveur. Les composants client ne peuvent pas y accéder.

---

### 2. Fichiers Supabase Client (lib/)

**Fichiers modifiés:**
- ✅ `lib/supabase-client.ts`
- ✅ `lib/supabase-server.ts`
- ✅ `lib/supabase-service.ts`

**Changement 1 - Noms de variables:**
```typescript
// AVANT
const supabaseUrl = process.env.BYPASS_SUPABASE_URL || ...

// APRÈS
const supabaseUrl = process.env.NEXT_PUBLIC_BYPASS_SUPABASE_URL || ...
```

**Changement 2 - Protection build:**
```typescript
// Ne pas lancer d'erreur pendant le build Next.js
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' ||
                    process.env.NODE_ENV === 'test';

if (!supabaseUrl && !isBuildTime) {
  console.error('❌ Missing NEXT_PUBLIC_BYPASS_SUPABASE_URL');
  throw new Error('Missing Supabase URL');
}
```

**Changement 3 - Placeholders:**
```typescript
export const supabaseService = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder-key',
  { ... }
);
```

**Raison:** Les erreurs pendant le build interrompent la compilation. Les placeholders permettent au build de réussir.

---

### 3. Routes API Storage

**Fichiers modifiés:**
- ✅ `app/api/storage/upload/route.ts`
- ✅ `app/api/storage/migrate-image/route.ts`

**Changement 1 - Routes dynamiques:**
```typescript
// Marquer la route comme dynamique pour éviter le pré-rendu statique
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
```

**Changement 2 - Variables corrigées:**
```typescript
const supabaseUrl =
  process.env.NEXT_PUBLIC_BYPASS_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseServiceKey =
  process.env.BYPASS_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;
```

**Changement 3 - Client conditionnel:**
```typescript
const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, { ... })
  : null;

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { success: false, error: 'Supabase credentials not configured' },
      { status: 500 }
    );
  }
  // ...
}
```

**Raison:** Évite les erreurs pendant la collecte des données du build. Les routes sont évaluées dynamiquement uniquement à l'exécution.

---

## 📋 Configuration Vercel

### Variables à configurer dans Vercel Dashboard

**Settings → Environment Variables → Ajouter:**

```env
# OBLIGATOIRE - Variables CLIENT + SERVEUR
NEXT_PUBLIC_BYPASS_SUPABASE_URL=https://qcqbtmvbvipsxwjlgjvk.supabase.co
NEXT_PUBLIC_BYPASS_SUPABASE_ANON_KEY=<votre_clé_anon_réelle>

# OBLIGATOIRE - Variable SERVEUR uniquement
BYPASS_SUPABASE_SERVICE_ROLE_KEY=<votre_clé_service_role_réelle>

# OBLIGATOIRE - WordPress
BYPASS_WORDPRESS_URL=https://wp.laboutiquedemorgane.com
WORDPRESS_CONSUMER_KEY=<votre_clé_woo>
WORDPRESS_CONSUMER_SECRET=<votre_secret_woo>
```

**⚠️ IMPORTANT:**
- Ne PAS ajouter `NEXT_PUBLIC_` à `BYPASS_SUPABASE_SERVICE_ROLE_KEY`
- Cette clé doit rester côté serveur uniquement pour la sécurité
- Vercel expose automatiquement les variables `NEXT_PUBLIC_*` au client

---

## ✅ Tests de validation

### Test 1 - Build local
```bash
npm run build
# Doit réussir sans erreur "Missing Supabase URL"
```

### Test 2 - Vérifier variables client
```javascript
// Dans la console navigateur (après déploiement)
console.log(process.env.NEXT_PUBLIC_BYPASS_SUPABASE_URL)
// Résultat attendu: "https://qcqbtmvbvipsxwjlgjvk.supabase.co"

console.log(process.env.BYPASS_SUPABASE_SERVICE_ROLE_KEY)
// Résultat attendu: undefined (correct - pas exposée)
```

### Test 3 - Upload image
```bash
# Admin → Médiathèque → Upload image
# Doit afficher "Optimisation de l'image en cours..."
# Puis "Image optimisée et uploadée (XXX KB)"
# URL générée: https://qcqbtmvbvipsxwjlgjvk.supabase.co/storage/...
```

---

## 🔍 Diagnostic

### Si le build échoue encore

**Erreur 1:** "Missing Supabase URL during build"
- **Cause:** Variables pas définies dans Vercel
- **Solution:** Vérifier Settings → Environment Variables

**Erreur 2:** "Cannot read property 'storage' of null"
- **Cause:** Route appelée pendant le build statique
- **Solution:** Vérifier `export const dynamic = 'force-dynamic'` dans la route

**Erreur 3:** "NEXT_PUBLIC_BYPASS_SUPABASE_URL is undefined"
- **Cause:** Variable pas définie ou mal nommée
- **Solution:** Redéployer après ajout des variables

### Commandes de diagnostic

```bash
# Vérifier les variables localement
grep "NEXT_PUBLIC_BYPASS" .env

# Tester le build
npm run build 2>&1 | grep -i "error\|supabase\|missing"

# Vérifier les routes dynamiques
grep -r "export const dynamic" app/api/
```

---

## 📊 Résumé des fichiers modifiés

| Fichier | Changement | Raison |
|---------|------------|--------|
| `.env` | NEXT_PUBLIC_BYPASS_* | Visibilité client |
| `.env.example` | NEXT_PUBLIC_BYPASS_* | Documentation |
| `lib/supabase-client.ts` | Protection build + placeholders | Éviter erreurs build |
| `lib/supabase-server.ts` | NEXT_PUBLIC_BYPASS_* | Visibilité serveur |
| `lib/supabase-service.ts` | Protection build + placeholders | Éviter erreurs build |
| `app/api/storage/upload/route.ts` | dynamic + NEXT_PUBLIC_* + null check | Pré-rendu + sécurité |
| `app/api/storage/migrate-image/route.ts` | dynamic + NEXT_PUBLIC_* + null check | Pré-rendu + sécurité |

**Total:** 7 fichiers modifiés

---

## 🚀 Déploiement

### Étape 1 - Variables Vercel (2 min)
1. Aller sur vercel.com → Dashboard
2. Sélectionner le projet
3. Settings → Environment Variables
4. Ajouter les 3 variables BYPASS_* (voir section Configuration)
5. Environnement: **Production + Preview + Development**

### Étape 2 - Push vers Git (1 min)
```bash
git add .
git commit -m "Fix: Variables BYPASS corrigées pour build Vercel"
git push origin main
```

### Étape 3 - Vérifier le build (3 min)
1. Vercel détecte automatiquement le push
2. Build démarre automatiquement
3. Suivre les logs en temps réel
4. Vérifier "✓ Compiled successfully"

### Étape 4 - Test production (2 min)
1. Visiter `https://votre-app.vercel.app/diagnostic-config`
2. Vérifier "Projet actif: qcqbtmv"
3. Tester upload image dans Admin → Médiathèque

---

## 🔐 Sécurité

### Variables exposées au client (SAFE)
```env
NEXT_PUBLIC_BYPASS_SUPABASE_URL ✅
NEXT_PUBLIC_BYPASS_SUPABASE_ANON_KEY ✅
```
- Visibles dans le code source du navigateur
- Protégées par RLS (Row Level Security) Supabase
- Pas de risque de sécurité

### Variables serveur uniquement (SECURED)
```env
BYPASS_SUPABASE_SERVICE_ROLE_KEY 🔒
```
- Jamais envoyée au client
- Accessible uniquement dans les API routes côté serveur
- Permet de contourner RLS (accès administrateur)

**Test de sécurité:**
```javascript
// Console navigateur
console.log(process.env.BYPASS_SUPABASE_SERVICE_ROLE_KEY)
// Doit afficher: undefined ✅
```

---

## 📝 Notes importantes

1. **Règle d'or:** Toutes les variables visibles côté client doivent avoir `NEXT_PUBLIC_`
2. **Sécurité:** SERVICE_ROLE_KEY ne doit JAMAIS avoir `NEXT_PUBLIC_`
3. **Build:** Les erreurs `throw new Error` doivent être conditionnelles (pas pendant le build)
4. **Routes API:** Toujours marquer comme `dynamic = 'force-dynamic'` pour éviter le pré-rendu

---

**Date:** 2026-01-01
**Statut:** ✅ Prêt pour déploiement Vercel
**Temps estimé:** 8 minutes (2+1+3+2)
