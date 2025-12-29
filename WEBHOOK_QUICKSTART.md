# Démarrage Rapide - Webhooks Automatiques

## Ce qui a été installé

✅ **Edge Function `webhook-revalidator`** - Déployée sur Supabase
✅ **Triggers PostgreSQL** - Sur 8 tables importantes
✅ **Extension pg_net** - Pour envoyer des webhooks HTTP
✅ **API Route Next.js** - Mise à jour pour accepter les webhooks

## Configuration en 3 étapes

### Étape 1 : Générer un token secret

Sur votre ordinateur, exécutez :

```bash
openssl rand -base64 32
```

Copiez le résultat (exemple : `AbCd1234XyZ789...`)

### Étape 2 : Configurer Vercel

Allez sur [vercel.com](https://vercel.com) → Votre projet → Settings → Environment Variables

Ajoutez :

```
VERCEL_REVALIDATE_TOKEN = AbCd1234XyZ789... (le token généré)
VERCEL_DEPLOY_URL = https://votre-site.vercel.app
```

**Redéployez** votre site après avoir ajouté les variables.

### Étape 3 : Configurer Supabase

Allez sur [supabase.com](https://supabase.com) → Votre projet → Project Settings → Edge Functions

Ajoutez les mêmes secrets :

```
VERCEL_REVALIDATE_TOKEN = AbCd1234XyZ789... (le même token)
VERCEL_DEPLOY_URL = https://votre-site.vercel.app
```

## Comment tester

### Test 1 : Modifier un slider

1. Connectez-vous à `/admin/slides`
2. Modifiez un slider existant
3. Sauvegardez
4. Attendez 2 secondes
5. Allez sur la page d'accueil → Votre modification devrait être visible immédiatement

### Test 2 : Ajouter un produit en avant

1. Allez sur `/admin/featured-products`
2. Ajoutez un nouveau produit
3. Retournez sur la page d'accueil
4. Le produit devrait apparaître immédiatement

### Test 3 : Vérifier les logs

Sur Supabase → Edge Functions → `webhook-revalidator` → Logs

Vous devriez voir des entrées comme :
```
Received webhook for table: home_slides, type: UPDATE
Revalidated /: { success: true }
```

## Tables surveillées

| Table | Page revalidée |
|-------|---------------|
| `home_slides` | `/` (accueil) |
| `featured_products` | `/` (accueil) |
| `delivery_batches` | `/` (accueil) |
| `live_streams` | `/live` et `/` |
| `guestbook_entries` | `/livre-dor` et `/` |
| `customer_reviews` | `/` et pages produits |
| `weekly_ambassadors` | `/` (accueil) |
| `gift_thresholds` | `/` (accueil) |

## Dépannage express

### "Configuration serveur manquante"
→ Les variables d'environnement ne sont pas configurées sur Vercel. Retournez à l'Étape 2.

### "Non autorisé"
→ Le token ne correspond pas entre Vercel et Supabase. Vérifiez qu'ils sont identiques.

### Rien ne se passe
→ Vérifiez les logs sur Supabase → Edge Functions → webhook-revalidator

### L'URL Supabase est différente

Si votre URL n'est pas `https://oaeczvfpqyxqaqdhuxsl.supabase.co`, modifiez :

`supabase/migrations/[dernier fichier]_create_automatic_revalidation_webhooks_v2.sql`

Ligne ~49 :
```sql
project_url := 'https://VOTRE-PROJET.supabase.co';
```

Puis réappliquez la migration.

## C'est tout !

Votre cache est maintenant automatiquement revalidé à chaque modification importante. 🎉

Pour plus de détails, consultez `WEBHOOK_AUTO_REVALIDATION_SETUP.md`.
