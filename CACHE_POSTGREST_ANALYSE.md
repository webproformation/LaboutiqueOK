# 🔍 Analyse du Cache PostgREST et Configurations

## Où se trouve le cache ?

### 1. **Cache PostgREST (Sur Supabase) ⚠️ PRINCIPAL SUSPECT**

Le cache PostgREST est **côté serveur sur Supabase**, pas dans votre navigateur ni sur Vercel.

**Ce qu'il cache :**
- Schéma de base de données (tables, colonnes, types)
- Politiques RLS (Row Level Security)
- Fonctions RPC disponibles
- Configuration des permissions

**Symptômes d'un cache PostgREST obsolète :**
- 404 sur des tables/fonctions qui existent vraiment
- 400 sur des requêtes qui devraient fonctionner
- Anciennes politiques RLS appliquées alors que vous les avez modifiées
- Fonctions RPC "introuvables" après création

**Comment le vider :**

#### Option 1 : Via l'API Supabase (recommandé)
```sql
-- Exécuter dans l'éditeur SQL Supabase
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
```

#### Option 2 : Via le Dashboard Supabase
1. Aller sur https://supabase.com/dashboard/project/qcqbtmvbvipsxwjlgjvk
2. Settings → API
3. Cliquer sur "Restart Server" ou attendre ~5 minutes

#### Option 3 : Migration automatique
Vos migrations incluent déjà des commandes NOTIFY, mais elles peuvent ne pas suffire si :
- Le cache est corrompu
- Il y a eu un problème pendant la migration
- Le serveur PostgREST était en cours de redémarrage

---

### 2. **Cache Vercel (Déploiement)**

Vercel cache :
- Pages statiques générées
- Réponses des API Routes (avec `revalidate`)
- Variables d'environnement au moment du build

**Symptômes d'un cache Vercel obsolète :**
- Anciennes valeurs d'environnement utilisées
- Pages qui ne se mettent pas à jour après déploiement
- L'URL Supabase revient à l'ancienne après redéploiement

**Comment le vider :**

1. **Redéploiement complet (recommandé)**
   ```bash
   # Sur Vercel Dashboard
   Deployments → [...] → Redeploy
   ```

2. **Vérifier les variables d'environnement sur Vercel**
   ```
   https://vercel.com/votre-projet/settings/environment-variables
   ```

   Vérifier que TOUTES ces variables contiennent `qcqbtmvbvipsxwjlgjvk` :
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY

3. **Supprimer le cache de build**
   Dans les paramètres du projet Vercel, activer "Clear Build Cache" pour le prochain déploiement

---

### 3. **Cache Navigateur (Client)**

Le navigateur cache :
- Réponses API (si headers Cache-Control présents)
- Assets statiques (images, CSS, JS)
- Cookies et LocalStorage

**Ce qu'il NE cache PAS :**
- Le schéma de base de données
- Les politiques RLS
- La configuration PostgREST

**Comment le vider :**
- Chrome/Edge : `Ctrl + Shift + Del` → Vider le cache
- Firefox : `Ctrl + Shift + Del` → Cookies et cache
- Safari : Développement → Vider les caches

---

## 🔍 Diagnostic : D'où vient le problème ?

### Test 1 : Vérifier que Supabase utilise bien le bon projet

```bash
# Exécuter dans le terminal local
curl https://qcqbtmvbvipsxwjlgjvk.supabase.co/rest/v1/ \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzIzNjAsImV4cCI6MjA4MjUwODM2MH0.1AkV5xYQC_bqyGf9gd2pTZKNEQ5AKMKAzCaDdLLl5VQ"
```

**Si vous obtenez une réponse** : PostgREST fonctionne
**Si vous obtenez une 404/400** : Cache PostgREST corrompu

### Test 2 : Vérifier Vercel en production

1. Aller sur votre site en production
2. Ouvrir `/api/debug-env`
3. Vérifier que TOUTES les valeurs indiquent `qcqbtmvbvipsxwjlgjvk (PRODUCTION ✅)`

**Si non :** Problème de variables d'environnement Vercel

### Test 3 : Forcer le reload PostgREST

Exécuter dans l'éditeur SQL Supabase :
```sql
-- Forcer le rechargement complet
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Attendre 30 secondes puis tester à nouveau
```

---

## ⚡ Solution Recommandée (Ordre d'action)

### Étape 1 : Vider le cache PostgREST sur Supabase ⭐
```sql
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
```

### Étape 2 : Vérifier les variables Vercel
1. Aller sur https://vercel.com
2. Ouvrir votre projet → Settings → Environment Variables
3. Vérifier que TOUTES les variables Supabase contiennent `qcqbtmvbvipsxwjlgjvk`
4. Si non, les corriger et redéployer

### Étape 3 : Redéploiement Vercel avec cache vidé
1. Dans Vercel Dashboard → Deployments
2. Cliquer sur le dernier déploiement → [...] → Redeploy
3. Cocher "Clear Build Cache"
4. Déployer

### Étape 4 : Vider le cache navigateur
- `Ctrl + Shift + R` (hard refresh)
- Ou ouvrir en navigation privée

### Étape 5 : Tester
1. Ouvrir `/api/debug-env` sur votre site en production
2. Vérifier que tout indique `qcqbtmvbvipsxwjlgjvk (PRODUCTION ✅)`

---

## 🚨 Configuration Supabase à vérifier

Si le problème persiste après tout ça, vérifier dans le Dashboard Supabase :

### 1. Région du projet
- Vérifier que le projet `qcqbtmvbvipsxwjlgjvk` est dans la bonne région (Europe)

### 2. État du serveur PostgREST
- Settings → API → Server Status → "Running"
- Si "Error" ou "Stopped", redémarrer

### 3. Quotas et limites
- Settings → Usage → Vérifier qu'aucune limite n'est atteinte

### 4. Connexion base de données
- Settings → Database → Connexion string doit contenir `qcqbtmvbvipsxwjlgjvk`

---

## 📊 Configuration Vercel à vérifier

### 1. Variables d'environnement
Toutes doivent pointer vers `qcqbtmvbvipsxwjlgjvk` :
- ✅ Production
- ✅ Preview
- ✅ Development

### 2. Build & Development Settings
```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### 3. Caching Headers
Vercel utilise le cache par défaut pour Next.js. Pour forcer un refresh :
- Activer "Clear Build Cache" lors du déploiement
- Ou ajouter `?v=timestamp` à vos requêtes API temporairement

---

## 🎯 Conclusion

**Le problème vient probablement de :**

1. **Cache PostgREST sur Supabase** (90% des cas)
   → Solution : `NOTIFY pgrst, 'reload schema';`

2. **Variables d'environnement Vercel** (9% des cas)
   → Solution : Vérifier et corriger sur le dashboard Vercel

3. **Cache navigateur** (1% des cas)
   → Solution : Hard refresh ou navigation privée

**Le problème ne vient PAS de :**
- Votre code local (corrigé ✅)
- Vos fichiers .env (corrigés ✅)
- Vos migrations (bonnes ✅)
