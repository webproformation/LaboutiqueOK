# Configuration du Webhook Supabase → Vercel

Ce guide explique comment configurer le système de revalidation automatique du cache entre Supabase et Vercel.

## Architecture

Quand une donnée change dans Supabase (INSERT/UPDATE/DELETE):
1. Supabase envoie un webhook à Vercel
2. Vercel vide son cache automatiquement
3. Les utilisateurs voient les données à jour immédiatement

## Étape 1: Générer un secret pour le webhook

Générez un secret aléatoire sécurisé:

```bash
openssl rand -base64 32
```

Ou utilisez ce générateur: https://www.uuidgenerator.net/

Exemple de secret: `8f3d2e1a9b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e`

## Étape 2: Ajouter la variable d'environnement sur Vercel

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet: **laboutiquedemorgane**
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez une nouvelle variable:
   - **Name**: `WEBHOOK_SECRET`
   - **Value**: Collez le secret généré à l'étape 1
   - **Environments**: Cochez **Production**, **Preview** et **Development**
5. Cliquez sur **Save**
6. **IMPORTANT**: Redéployez votre application pour que la variable soit prise en compte

## Étape 3: Configurer les Webhooks dans Supabase

### 3.1 Accéder à la configuration des Webhooks

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet: **qcqbtmvbvipsxwjlgjvk**
3. Dans le menu de gauche, cliquez sur **Database** → **Webhooks**

### 3.2 Créer un Webhook global pour toutes les tables importantes

Pour chaque webhook à créer (vous pouvez en créer plusieurs):

**Webhook 1: Tables utilisateurs et rôles**

- **Name**: `revalidate_users`
- **Table**: Sélectionnez `user_profiles`, `user_roles`
- **Events**: Cochez `INSERT`, `UPDATE`, `DELETE`
- **Type**: `HTTP Request`
- **Method**: `POST`
- **URL**: `https://www.laboutiquedemorgane.com/api/revalidate`
- **HTTP Headers**:
  - Cliquez sur **+ Add header**
  - **Name**: `x-webhook-secret`
  - **Value**: Collez le même secret que l'étape 2
- **HTTP Params**: (laissez vide)
- Cliquez sur **Create Webhook**

**Webhook 2: Contenu du site (slides, catégories, produits)**

- **Name**: `revalidate_content`
- **Table**: Sélectionnez `home_slides`, `home_categories`, `featured_products`
- **Events**: Cochez `INSERT`, `UPDATE`, `DELETE`
- **Type**: `HTTP Request`
- **Method**: `POST`
- **URL**: `https://www.laboutiquedemorgane.com/api/revalidate`
- **HTTP Headers**:
  - **Name**: `x-webhook-secret`
  - **Value**: Le même secret
- Cliquez sur **Create Webhook**

**Webhook 3: Commandes et factures**

- **Name**: `revalidate_orders`
- **Table**: Sélectionnez `orders`, `order_items`, `order_invoices`
- **Events**: Cochez `INSERT`, `UPDATE`, `DELETE`
- **Type**: `HTTP Request`
- **Method**: `POST`
- **URL**: `https://www.laboutiquedemorgane.com/api/revalidate`
- **HTTP Headers**:
  - **Name**: `x-webhook-secret`
  - **Value**: Le même secret
- Cliquez sur **Create Webhook**

**Webhook 4: Jeux et fidélité**

- **Name**: `revalidate_games_loyalty`
- **Table**: Sélectionnez `scratch_game_settings`, `wheel_game_settings`, `loyalty_tiers`, `loyalty_rewards`
- **Events**: Cochez `INSERT`, `UPDATE`, `DELETE`
- **Type**: `HTTP Request`
- **Method**: `POST`
- **URL**: `https://www.laboutiquedemorgane.com/api/revalidate`
- **HTTP Headers**:
  - **Name**: `x-webhook-secret`
  - **Value**: Le même secret
- Cliquez sur **Create Webhook**

**Webhook 5: Live et actualités**

- **Name**: `revalidate_live_news`
- **Table**: Sélectionnez `live_streams`, `news_posts`, `news_categories`
- **Events**: Cochez `INSERT`, `UPDATE`, `DELETE`
- **Type**: `HTTP Request`
- **Method**: `POST`
- **URL**: `https://www.laboutiquedemorgane.com/api/revalidate`
- **HTTP Headers**:
  - **Name**: `x-webhook-secret`
  - **Value**: Le même secret
- Cliquez sur **Create Webhook**

**Webhook 6: Avis et livre d'or**

- **Name**: `revalidate_reviews`
- **Table**: Sélectionnez `customer_reviews`, `guestbook_entries`
- **Events**: Cochez `INSERT`, `UPDATE`, `DELETE`
- **Type**: `HTTP Request`
- **Method**: `POST`
- **URL**: `https://www.laboutiquedemorgane.com/api/revalidate`
- **HTTP Headers**:
  - **Name**: `x-webhook-secret`
  - **Value**: Le même secret
- Cliquez sur **Create Webhook**

**Webhook 7: Livraison et coupons**

- **Name**: `revalidate_shipping_coupons`
- **Table**: Sélectionnez `shipping_methods`, `delivery_batches`, `coupons`
- **Events**: Cochez `INSERT`, `UPDATE`, `DELETE`
- **Type**: `HTTP Request`
- **Method**: `POST`
- **URL**: `https://www.laboutiquedemorgane.com/api/revalidate`
- **HTTP Headers**:
  - **Name**: `x-webhook-secret`
  - **Value**: Le même secret
- Cliquez sur **Create Webhook**

## Étape 4: Tester le Webhook

### Test manuel depuis Supabase

1. Dans Supabase, allez dans **Database** → **Webhooks**
2. Trouvez un de vos webhooks créés
3. Cliquez sur les **3 points** à droite → **Test Webhook**
4. Cliquez sur **Send test request**
5. Vous devriez voir une réponse `200 OK` avec `{"revalidated": true}`

### Test en modifiant une donnée

1. Allez dans **Table Editor** dans Supabase
2. Modifiez une ligne dans une des tables surveillées (ex: `home_slides`)
3. Sauvegardez
4. Le webhook sera déclenché automatiquement
5. Allez sur https://www.laboutiquedemorgane.com
6. Faites un refresh, la modification devrait être visible immédiatement

## Vérification des logs

### Logs Vercel

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Deployments** → Cliquez sur le dernier déploiement
4. Cliquez sur **Functions** → `/api/revalidate`
5. Vous verrez les logs des webhooks reçus

### Logs Supabase

1. Dans Supabase, allez dans **Database** → **Webhooks**
2. Cliquez sur un webhook
3. Vous verrez l'historique des appels et leurs statuts

## Résultat final

Après cette configuration:

✅ **PostgREST** se recharge automatiquement via le trigger DDL (déjà fait à l'étape 1)
✅ **Cache Vercel** se vide automatiquement dès qu'une donnée change
✅ **Plus besoin de commandes manuelles**
✅ **Les utilisateurs voient toujours les données à jour**

## Dépannage

### Le webhook retourne 401 Unauthorized

- Vérifiez que le secret dans Vercel est exactement le même que dans le webhook Supabase
- Vérifiez que vous avez redéployé l'application après avoir ajouté la variable d'environnement

### Le webhook retourne 500 Internal Server Error

- Vérifiez les logs dans Vercel pour voir l'erreur exacte
- Assurez-vous que la route `/api/revalidate` est bien déployée

### Les modifications ne sont pas visibles immédiatement

- Attendez 1-2 secondes (le temps que le webhook soit traité)
- Videz le cache de votre navigateur (Ctrl+F5 ou Cmd+Shift+R)
- Vérifiez que le webhook s'est bien déclenché dans les logs Supabase

## Sécurité

- Le secret du webhook est obligatoire et vérifié à chaque requête
- Seul Supabase peut déclencher la revalidation du cache
- Les tentatives non autorisées sont loguées et rejetées avec un statut 401
