# Configuration des Webhooks Automatiques pour Revalidation Next.js

## Vue d'ensemble

Ce système permet de revalider automatiquement le cache Next.js chaque fois qu'une donnée importante est modifiée dans la base de données Supabase, **sans avoir besoin d'accès au dashboard admin**.

## Architecture

```
Modification dans Supabase (INSERT/UPDATE/DELETE)
    ↓
Trigger PostgreSQL détecte le changement
    ↓
Extension pg_net envoie un webhook HTTP
    ↓
Edge Function "webhook-revalidator" reçoit la notification
    ↓
Edge Function appelle l'API Next.js /api/revalidate
    ↓
Cache Next.js revalidé automatiquement
```

## Avantages

✅ **Bypass complet du cache PostgREST** - Les triggers fonctionnent au niveau base de données
✅ **Pas besoin d'accès admin** - Tout est automatisé via des triggers
✅ **Temps réel** - La revalidation se déclenche immédiatement
✅ **Asynchrone** - N'impacte pas les performances des opérations utilisateur
✅ **Fiable** - Utilise pg_net, une extension native de Supabase

## Configuration Requise

### 1. Variables d'environnement Vercel

Dans votre projet Vercel, ajoutez ces variables :

```bash
VERCEL_REVALIDATE_TOKEN=votre-token-secret-unique-et-long
VERCEL_DEPLOY_URL=https://votre-site.vercel.app
```

**OU** si vous préférez utiliser le nom `WEBHOOK_SECRET` :

```bash
WEBHOOK_SECRET=votre-token-secret-unique-et-long
VERCEL_DEPLOY_URL=https://votre-site.vercel.app
```

**Important** : Le token doit être un secret unique. Générez-le avec :
```bash
openssl rand -base64 32
```

Les deux noms de variables fonctionnent, mais assurez-vous d'utiliser le même nom partout.

### 2. Configuration Supabase

Dans votre projet Supabase, allez dans **Settings > Edge Functions** et ajoutez ces secrets :

```
VERCEL_REVALIDATE_TOKEN=le-meme-token-que-vercel
VERCEL_DEPLOY_URL=https://votre-site.vercel.app
```

### 3. URL Supabase dans la fonction trigger

Si votre URL Supabase n'est pas `https://oaeczvfpqyxqaqdhuxsl.supabase.co`, vous devez mettre à jour la migration :

Ouvrez le fichier : `supabase/migrations/[timestamp]_create_automatic_revalidation_webhooks_v2.sql`

Et modifiez cette ligne :
```sql
project_url := 'https://oaeczvfpqyxqaqdhuxsl.supabase.co';
```

Remplacez par votre URL Supabase complète.

## Tables surveillées

Le système surveille automatiquement ces tables :

| Table | Action de revalidation |
|-------|------------------------|
| `home_slides` | Revalide la page d'accueil `/` |
| `featured_products` | Revalide la page d'accueil `/` |
| `delivery_batches` | Revalide la page d'accueil `/` |
| `live_streams` | Revalide `/live` et `/` |
| `guestbook_entries` | Revalide `/livre-dor` et `/` |
| `customer_reviews` | Revalide `/` et les pages produits |
| `weekly_ambassadors` | Revalide la page d'accueil `/` |
| `gift_thresholds` | Revalide la page d'accueil `/` |

## Test du système

### 1. Vérifier que l'Edge Function est déployée

```bash
curl https://oaeczvfpqyxqaqdhuxsl.supabase.co/functions/v1/webhook-revalidator \
  -H "Content-Type: application/json" \
  -d '{
    "table": "home_slides",
    "type": "UPDATE",
    "record": {"id": 1}
  }'
```

Vous devriez recevoir une réponse JSON confirmant la revalidation.

### 2. Tester avec une vraie modification

1. Connectez-vous à votre interface admin
2. Modifiez un slider sur la page d'accueil
3. Attendez 1-2 secondes
4. Rafraîchissez la page d'accueil
5. La modification devrait être visible immédiatement

## Logs et débogage

### Voir les logs de l'Edge Function

1. Allez dans le dashboard Supabase
2. Cliquez sur **Edge Functions** dans le menu
3. Sélectionnez `webhook-revalidator`
4. Consultez les logs en temps réel

### Voir les requêtes pg_net

Exécutez cette requête SQL dans le SQL Editor :

```sql
SELECT * FROM net._http_response
ORDER BY created DESC
LIMIT 10;
```

Cela vous montrera les 10 dernières requêtes HTTP envoyées par pg_net.

## Ajouter d'autres tables

Pour surveiller d'autres tables, ajoutez un trigger similaire :

```sql
CREATE TRIGGER trigger_revalidate_ma_table
  AFTER INSERT OR UPDATE OR DELETE
  ON public.ma_table
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_revalidation_webhook();
```

Puis mettez à jour l'Edge Function `webhook-revalidator` pour gérer cette table dans le switch statement.

## Désactiver temporairement

Pour désactiver un trigger spécifique :

```sql
ALTER TABLE home_slides DISABLE TRIGGER trigger_revalidate_home_slides;
```

Pour le réactiver :

```sql
ALTER TABLE home_slides ENABLE TRIGGER trigger_revalidate_home_slides;
```

## Problèmes courants

### La revalidation ne fonctionne pas

1. Vérifiez que l'extension pg_net est activée :
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_net';
   ```

2. Vérifiez les logs de l'Edge Function dans le dashboard Supabase

3. Vérifiez que les variables d'environnement sont bien configurées

4. Testez l'API de revalidation directement :
   ```bash
   curl -X POST "https://votre-site.vercel.app/api/revalidate?path=/&secret=votre-token"
   ```

### L'Edge Function timeout

Si vous avez beaucoup de paths à revalider, augmentez le timeout dans la fonction trigger :

```sql
timeout_milliseconds := 10000  -- 10 secondes au lieu de 5
```

## Support

Si vous rencontrez des problèmes :

1. Consultez les logs Supabase Edge Functions
2. Consultez les logs Vercel
3. Vérifiez la table `net._http_response` pour voir les requêtes pg_net
4. Testez manuellement l'Edge Function avec curl

## Conclusion

Ce système garantit que votre cache Next.js est toujours à jour automatiquement, sans intervention manuelle et sans dépendre du cache PostgREST qui peut être problématique.
