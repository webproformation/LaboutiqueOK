# Configuration BYPASS Supabase - Migration Complète

## Résumé

Le système a été configuré pour utiliser **prioritairement** les variables `BYPASS_*` afin de contourner le verrouillage des variables Supabase dans Bolt.new.

## Variables d'environnement configurées

### ✅ PRIORITE 1 - Variables BYPASS (OBLIGATOIRES)

```env
BYPASS_SUPABASE_URL=https://qcqbtmvbvipsxwjlgjvk.supabase.co
BYPASS_SUPABASE_ANON_KEY=<À_REMPLACER_PAR_LA_VRAIE_CLE>
BYPASS_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
BYPASS_WORDPRESS_URL=https://wp.laboutiquedemorgane.com
```

### 🔄 PRIORITE 2 - Variables fallback (si BYPASS manquantes)

```env
NEXT_PUBLIC_SUPABASE_URL=https://qcqbtmvbvipsxwjlgjvk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<À_REMPLACER_PAR_LA_VRAIE_CLE>
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🚨 ACTION REQUISE

### Obtenir la vraie clé ANON du projet qcqbtmv

1. Allez sur https://supabase.com/dashboard/project/qcqbtmvbvipsxwjlgjvk
2. Naviguez vers **Settings** → **API**
3. Copiez la clé **anon / public** (section "Project API keys")
4. Remplacez la valeur dans `.env` :

```env
BYPASS_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzIzNjAsImV4cCI6MjA4MjUwODM2MH0.VOTRE_VRAIE_CLE_ICI
```

⚠️ **La clé actuelle dans le .env est factice et ne fonctionnera pas !**

## Fichiers modifiés

### 1. Configuration Supabase

Tous les fichiers d'initialisation Supabase ont été mis à jour pour utiliser les variables `BYPASS_*` en priorité :

- ✅ `/lib/supabase-client.ts` - Client Supabase (browser)
- ✅ `/lib/supabase-server.ts` - Server client (SSR)
- ✅ `/lib/supabase-service.ts` - Service role client
- ✅ `/lib/env-config.ts` - Configuration centralisée

### 2. Routes API

Toutes les routes API ont été corrigées pour utiliser `BYPASS_SUPABASE_SERVICE_ROLE_KEY` :

- ✅ `/app/api/storage/migrate-image/route.ts`
- ✅ `/app/api/storage/upload/route.ts`
- ✅ `/app/api/admin/maintenance/route.ts`
- ✅ `/app/api/admin/migrate-media/route.ts`

### 3. Nouvelles routes

- ✅ `/app/api/config/route.ts` - API pour exposer la config au frontend
- ✅ `/app/diagnostic-config/page.tsx` - Page de diagnostic de configuration

### 4. Documentation

- ✅ `.env.example` - Mis à jour avec la nouvelle structure
- ✅ `.env` - Variables BYPASS ajoutées en priorité

## Ordre de priorité des variables

Le système utilise cet ordre de priorité pour chaque type de clé :

### URL Supabase
1. `BYPASS_SUPABASE_URL` ⭐ **PRIORITE**
2. `NEXT_PUBLIC_SUPABASE_URL` (fallback)

### Clé ANON
1. `BYPASS_SUPABASE_ANON_KEY` ⭐ **PRIORITE**
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` (fallback)

### Clé Service Role
1. `BYPASS_SUPABASE_SERVICE_ROLE_KEY` ⭐ **PRIORITE**
2. `SUPABASE_SERVICE_ROLE_KEY` (fallback)

### URL WordPress
1. `BYPASS_WORDPRESS_URL` ⭐ **PRIORITE**
2. `WORDPRESS_URL` (fallback)

## Diagnostic

### Vérifier la configuration actuelle

Visitez `/diagnostic-config` pour voir :
- ✅ Quel projet Supabase est utilisé (qcqbtmv ou hondlef)
- ✅ Si les variables BYPASS sont actives
- ✅ Si la clé ANON est configurée
- ⚠️ Alertes si le mauvais projet est utilisé

### Logs de démarrage

Lors du démarrage de l'application, vous verrez dans la console :

```
✅ Supabase client initialized with BYPASS variables (project: qcqbtmv)
📍 URL: https://qcqbtmvbvipsxwjlgjvk.supabase.co
```

ou

```
⚠️ Supabase client initialized with NEXT_PUBLIC variables (deprecated project)
```

## Tests

Pour tester que tout fonctionne :

1. **Tester l'API config**
```bash
curl http://localhost:3000/api/config
```

2. **Visiter la page diagnostic**
```
http://localhost:3000/diagnostic-config
```

3. **Vérifier les logs de build**
```bash
npm run build
```

Le build doit réussir sans erreurs de configuration.

## Résolution des problèmes

### Problème : "Missing BYPASS_SUPABASE_URL"

**Solution :** Vérifiez que `.env` contient bien :
```env
BYPASS_SUPABASE_URL=https://qcqbtmvbvipsxwjlgjvk.supabase.co
```

### Problème : Le système utilise encore le projet "hondlef"

**Solution :**
1. Redémarrez le serveur de dev
2. Vérifiez que les variables BYPASS sont en haut du fichier `.env`
3. Visitez `/diagnostic-config` pour vérifier

### Problème : Erreur 401 Unauthorized

**Solution :** La clé ANON est incorrecte ou manquante. Suivez les étapes dans "ACTION REQUISE" ci-dessus.

## Migration depuis l'ancien système

Si vous aviez des variables `APP_DATABASE_*`, elles ne sont plus utilisées. Le nouveau système utilise uniquement :
- `BYPASS_*` (priorité 1)
- `NEXT_PUBLIC_*` et `SUPABASE_SERVICE_ROLE_KEY` (fallback)

## Déploiement Vercel

Sur Vercel, vous devez configurer ces variables d'environnement :

```
BYPASS_SUPABASE_URL=https://qcqbtmvbvipsxwjlgjvk.supabase.co
BYPASS_SUPABASE_ANON_KEY=<VOTRE_CLE_ANON>
BYPASS_SUPABASE_SERVICE_ROLE_KEY=<VOTRE_CLE_SERVICE_ROLE>
BYPASS_WORDPRESS_URL=https://wp.laboutiquedemorgane.com
```

Les variables `NEXT_PUBLIC_*` peuvent être laissées comme fallback mais ne seront pas utilisées si les `BYPASS_*` sont définies.
