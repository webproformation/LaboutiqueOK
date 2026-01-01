# Migration vers APP_DATABASE - Terminée

## Problème résolu

Les variables d'environnement Supabase étaient verrouillées dans l'interface Bolt avec des valeurs obsolètes pointant vers `hondlefoprhtrpxnumyj` au lieu de `qcqbtmvbvipsxwjlgjvk`.

## Solution appliquée

### Nouvelles variables d'environnement

Le code utilise maintenant en **priorité** ces nouvelles variables:

```bash
APP_DATABASE_URL=https://qcqbtmvbvipsxwjlgjvk.supabase.co
APP_DATABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzIzNjAsImV4cCI6MjA4MjUwODM2MH0.q-4uGaHsuojj3ejo5IG4V-z2fx-ER9grHsRzYNkYn0c
APP_DATABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkzMjM2MCwiZXhwIjoyMDgyNTA4MzYwfQ.mFJHZV-VdueE_okBTqkVh18tRvee94a5Z-k5TM4FQxM
```

## Fichiers modifiés

### Configuration Supabase

1. **lib/supabase-client.ts** - Client navigateur
2. **lib/supabase-server.ts** - Client serveur
3. **lib/supabase-service.ts** - Client service avec privilèges élevés
4. **lib/env-config.ts** - Nouveau fichier pour centraliser la gestion des variables

### API Routes

Toutes les routes API utilisent maintenant la fonction `getSupabaseConfig()` qui priorise les variables `APP_DATABASE_*`.

Route critique corrigée:
- **app/api/admin/maintenance/route.ts** - L'API de maintenance utilise maintenant `APP_DATABASE_SERVICE_ROLE`

## Vérification

Exécutez ce script pour vérifier:

```bash
node verify-app-database.js
```

Résultat attendu:
```
✅ APP_DATABASE_URL CORRECTE - qcqbtmvbvipsxwjlgjvk (PRODUCTION)
✅ APP_DATABASE_ANON_KEY CORRECTE - qcqbtmvbvipsxwjlgjvk (PRODUCTION)
✅ APP_DATABASE_SERVICE_ROLE CORRECTE - qcqbtmvbvipsxwjlgjvk (PRODUCTION)
```

## Comportement

Le code applique cette logique de fallback:

```typescript
const url = process.env.APP_DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.APP_DATABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.APP_DATABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;
```

Cela signifie:
- Si `APP_DATABASE_*` est défini → utilise cette valeur (PRODUCTION)
- Sinon → utilise les anciennes variables `SUPABASE_*` (fallback)

## Test de l'API Maintenance

L'API `/api/admin/maintenance` devrait maintenant:
1. Se connecter à la bonne base de données (qcqbtmvbvipsxwjlgjvk)
2. Effectuer l'upsert sur `site_settings` avec l'ID `general`
3. Retourner un JSON détaillé en cas d'erreur avec les informations Supabase

## Déploiement sur Vercel

**IMPORTANT**: Configurez ces variables d'environnement dans Vercel:

```
APP_DATABASE_URL=https://qcqbtmvbvipsxwjlgjvk.supabase.co
APP_DATABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzIzNjAsImV4cCI6MjA4MjUwODM2MH0.q-4uGaHsuojj3ejo5IG4V-z2fx-ER9grHsRzYNkYn0c
APP_DATABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkzMjM2MCwiZXhwIjoyMDgyNTA4MzYwfQ.mFJHZV-VdueE_okBTqkVh18tRvee94a5Z-k5TM4FQxM
```

Les anciennes variables `NEXT_PUBLIC_SUPABASE_*` peuvent rester mais seront ignorées.
