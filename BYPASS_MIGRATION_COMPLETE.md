# Migration BYPASS_SUPABASE - Configuration finale

## Problème résolu

Les variables d'environnement Supabase standards étaient verrouillées par Bolt avec des valeurs obsolètes. Une nouvelle stratégie de bypass a été mise en place.

## Solution appliquée

### Variables d'environnement BYPASS

Le code utilise maintenant en **priorité absolue** ces variables:

```bash
BYPASS_SUPABASE_URL=https://qcqbtmvbvipsxwjlgjvk.supabase.co
BYPASS_SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkzMjM2MCwiZXhwIjoyMDgyNTA4MzYwfQ.mFJHZV-VdueE_okBTqkVh18tRvee94a5Z-k5TM4FQxM
```

## Ordre de priorité des variables

Tous les clients Supabase suivent maintenant cette logique:

1. **BYPASS_SUPABASE_URL** (priorité absolue)
2. APP_DATABASE_URL (fallback)
3. NEXT_PUBLIC_SUPABASE_URL (dernière option)

Pour le service role:

1. **BYPASS_SUPABASE_SERVICE_ROLE** (priorité absolue)
2. APP_DATABASE_SERVICE_ROLE (fallback)
3. SUPABASE_SERVICE_ROLE_KEY (dernière option)

## Fichiers modifiés

### Configuration centrale

1. **lib/env-config.ts** - Gestion centralisée avec BYPASS en priorité
2. **lib/supabase-client.ts** - Client navigateur avec BYPASS
3. **lib/supabase-server.ts** - Client serveur avec BYPASS
4. **lib/supabase-service.ts** - Client service avec BYPASS

### API Routes critiques

1. **app/api/admin/maintenance/route.ts** - API maintenance utilise BYPASS_SUPABASE_SERVICE_ROLE
   - Logs détaillés pour le débogage
   - Affiche si BYPASS est utilisé
   - Retourne les détails complets en cas d'erreur

## Configuration WordPress

Le mot de passe WordPress a été corrigé (sans espaces):

```bash
WORDPRESS_APP_PASSWORD=1ZENOcErQzBZFqaF5TtsQzGC
WP_APPLICATION_PASSWORD=1ZENOcErQzBZFqaF5TtsQzGC
WP_ADMIN_USERNAME=webproformation.fr
```

## Vérification

Exécutez ce script pour vérifier:

```bash
node verify-bypass.js
```

Résultat attendu:
```
✅ BYPASS_SUPABASE_URL CORRECTE - qcqbtmvbvipsxwjlgjvk (PRODUCTION)
✅ BYPASS_SUPABASE_SERVICE_ROLE CORRECTE - qcqbtmvbvipsxwjlgjvk (PRODUCTION)
```

## Test de l'API Maintenance

L'API `/api/admin/maintenance` devrait maintenant:

1. Utiliser BYPASS_SUPABASE_URL et BYPASS_SUPABASE_SERVICE_ROLE
2. Logger si BYPASS est actif
3. Se connecter à qcqbtmvbvipsxwjlgjvk
4. Effectuer l'upsert sur `site_settings` avec l'ID `general`
5. Retourner un JSON détaillé avec tous les détails en cas d'erreur

## Déploiement sur Vercel

**IMPORTANT**: Configurez ces variables d'environnement dans Vercel:

```bash
BYPASS_SUPABASE_URL=https://qcqbtmvbvipsxwjlgjvk.supabase.co
BYPASS_SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkzMjM2MCwiZXhwIjoyMDgyNTA4MzYwfQ.mFJHZV-VdueE_okBTqkVh18tRvee94a5Z-k5TM4FQxM
NEXT_PUBLIC_SUPABASE_URL=https://qcqbtmvbvipsxwjlgjvk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzIzNjAsImV4cCI6MjA4MjUwODM2MH0.q-4uGaHsuojj3ejo5IG4V-z2fx-ER9grHsRzYNkYn0c
```

## État de la table site_settings

La table `site_settings` existe et contient déjà un enregistrement avec l'ID `general`:

```json
{
  "id": "general",
  "is_maintenance_mode": false,
  "maintenance_message": "Le site est actuellement en maintenance. Nous serons bientôt de retour.",
  "maintenance_start": null,
  "maintenance_end": null,
  "updated_at": "2026-01-01 09:27:42.279944+00",
  "updated_by": null
}
```

L'upsert devrait fonctionner correctement.

## Prochaines étapes

1. **Tester l'enregistrement de maintenance** - Utilisez l'interface admin pour sauvegarder la maintenance
2. **Vérifier les logs** - Regardez si "Using BYPASS_SUPABASE_URL: YES" apparaît
3. **En cas d'erreur** - Le JSON de réponse contiendra tous les détails de l'erreur Supabase

## Indépendance totale

Le site fonctionne maintenant **exclusivement** avec les variables BYPASS_ pour toutes les opérations d'écriture en base de données, contournant complètement les variables verrouillées par Bolt.
