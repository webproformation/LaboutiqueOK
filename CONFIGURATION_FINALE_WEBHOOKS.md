# Configuration Finale des Webhooks - Action Requise

## Statut Actuel

✅ Edge Function `webhook-revalidator` déployée sur Supabase
✅ Triggers PostgreSQL configurés sur 8 tables
✅ Migration avec la bonne URL Supabase (`qcqbtmvbvipsxwjlgjvk.supabase.co`)
✅ API Route `/api/revalidate` prête
❌ **Variables d'environnement manquantes** (cause des erreurs 401 et 404)

## Résultats des Tests

Les logs montrent:
1. **Erreur 404** - L'Edge Function n'est pas accessible (peut nécessiter quelques minutes après déploiement)
2. **Erreur 401** - L'API `/api/revalidate` rejette les requêtes car le token secret n'est pas configuré

## Configuration Obligatoire

### Étape 1: Générer un Token Sécurisé

Sur votre machine locale, exécutez:

```bash
openssl rand -base64 32
```

Copiez le résultat (exemple: `XyZ789AbCd123...`)

### Étape 2: Configurer Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Sélectionnez votre projet
3. Allez dans **Settings → Environment Variables**
4. Ajoutez ces 2 variables:

```
Variable: VERCEL_REVALIDATE_TOKEN
Value: XyZ789AbCd123... (votre token généré)
Environment: Production, Preview, Development

Variable: VERCEL_DEPLOY_URL
Value: https://votre-site.vercel.app
Environment: Production, Preview, Development
```

5. **Redéployez** votre site pour appliquer les variables

### Étape 3: Configurer Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Sélectionnez votre projet `qcqbtmvbvipsxwjlgjvk`
3. Allez dans **Project Settings → Edge Functions**
4. Ajoutez les **mêmes secrets**:

```
Secret: VERCEL_REVALIDATE_TOKEN
Value: XyZ789AbCd123... (le même token)

Secret: VERCEL_DEPLOY_URL
Value: https://votre-site.vercel.app
```

## Vérification du Système

### Option 1: Via l'Interface Admin

1. Allez sur `/admin/test-webhook-revalidation`
2. Cliquez sur "Tester le Webhook Supabase"
3. Vous devriez voir un succès si tout est configuré

### Option 2: Test Manuel

Modifiez un slider:

```sql
-- Dans Supabase SQL Editor
UPDATE home_slides
SET title = 'Test Webhook Automatique'
WHERE id = '46b6ed0c-050f-48c6-abbd-88b4c6ae69b1';
```

Puis vérifiez les logs:

```sql
-- Voir les dernières requêtes HTTP
SELECT
  status_code,
  created,
  content::text
FROM net._http_response
ORDER BY created DESC
LIMIT 5;
```

Vous devriez voir:
- Un appel à l'Edge Function avec status_code 200
- Un appel à l'API de revalidation avec status_code 200

### Option 3: Test Direct de l'Edge Function

```bash
curl -X POST https://qcqbtmvbvipsxwjlgjvk.supabase.co/functions/v1/webhook-revalidator \
  -H "Content-Type: application/json" \
  -d '{
    "table": "home_slides",
    "type": "UPDATE",
    "record": {"id": 1, "title": "Test"}
  }'
```

Réponse attendue:
```json
{
  "success": true,
  "table": "home_slides",
  "type": "UPDATE",
  "revalidated": [
    {
      "path": "/",
      "success": true,
      "result": { "revalidated": true, "timestamp": 1234567890 }
    }
  ]
}
```

## Dépannage

### Problème: Toujours erreur 404 après configuration

**Solution**: Attendez 2-3 minutes après le déploiement de l'Edge Function, puis réessayez.

### Problème: Erreur 401 "Non autorisé"

**Solutions**:
1. Vérifiez que le token est exactement le même sur Vercel et Supabase
2. Assurez-vous d'avoir redéployé le site Vercel après avoir ajouté les variables
3. Pas d'espaces avant/après le token lors de la copie

### Problème: La revalidation ne fonctionne pas

**Solutions**:
1. Vérifiez les logs de l'Edge Function sur Supabase
2. Vérifiez les logs Vercel pour voir si l'API revalidate est appelée
3. Testez manuellement l'API: `curl -X POST "https://votre-site.vercel.app/api/revalidate?path=/&secret=VOTRE_TOKEN"`

### Problème: Trigger ne se déclenche pas

**Vérification**:

```sql
-- Vérifier que les triggers existent
SELECT
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE 'trigger_revalidate%';
```

Vous devriez voir 8 triggers.

## Une Fois Configuré

Le système fonctionnera automatiquement:

1. Vous modifiez un slide dans l'admin
2. PostgreSQL détecte le changement (trigger)
3. pg_net envoie un webhook HTTP
4. L'Edge Function reçoit la notification
5. L'Edge Function appelle l'API Next.js `/api/revalidate`
6. Le cache Vercel est vidé
7. La page est mise à jour en 1-2 secondes

## Tables Surveillées

Ces 8 tables déclenchent automatiquement la revalidation:

- `home_slides` → revalide `/`
- `featured_products` → revalide `/`
- `delivery_batches` → revalide `/`
- `live_streams` → revalide `/live` et `/`
- `guestbook_entries` → revalide `/livre-dor` et `/`
- `customer_reviews` → revalide `/` et pages produits
- `weekly_ambassadors` → revalide `/`
- `gift_thresholds` → revalide `/`

## Support

Pour voir les logs en temps réel:

**Supabase**: Dashboard → Edge Functions → webhook-revalidator → Logs
**Vercel**: Dashboard → Votre Projet → Logs

La documentation complète est dans `WEBHOOK_AUTO_REVALIDATION_SETUP.md`.
