# Configuration des Variables d'Environnement sur Vercel

## Problème Identifié

L'API `/api/woocommerce/categories` retourne un tableau vide car les **variables d'environnement WooCommerce ne sont pas configurées sur Vercel**.

## Comment Vérifier

1. Ouvrez votre navigateur
2. Allez sur : `https://www.laboutiquedemorgane.com/api/woocommerce/categories?action=list&debug=true`
3. Vous devriez voir un message d'erreur JSON indiquant quelles variables manquent

## Variables à Configurer sur Vercel

Vous devez ajouter ces variables d'environnement dans votre projet Vercel :

### 1. Variables WordPress/WooCommerce (OBLIGATOIRE)

```
WORDPRESS_URL=https://wp.laboutiquedemorgane.com
WC_CONSUMER_KEY=ck_d620ae1f9fcd1832bdb2c31fe3ad8362a9de8b28
WC_CONSUMER_SECRET=cs_f452fc79440e83b64d6c3a0c712d51c91c8dd5a4
```

### 2. Variables Supabase (Déjà configurées normalement)

```
NEXT_PUBLIC_SUPABASE_URL=https://qcqbtmvbvipsxwjlgjvk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Variables Optionnelles (Paiements, Email, etc.)

```
STRIPE_SECRET_KEY=rk_live_...
PAYPAL_CLIENT_ID=BAACikVdtpOx...
PAYPAL_CLIENT_SECRET=ELjeY6wp47qSK8e74...
BREVO_API_KEY=xkeysib-...
ONESIGNAL_API_KEY=os_v2_app_...
```

## Comment Ajouter les Variables sur Vercel

### Méthode 1 : Via le Dashboard Vercel

1. Allez sur [https://vercel.com](https://vercel.com)
2. Connectez-vous à votre compte
3. Sélectionnez votre projet "laboutiquedemorgane"
4. Allez dans **Settings** > **Environment Variables**
5. Pour chaque variable :
   - Cliquez sur "Add New"
   - Nom : `WORDPRESS_URL` (par exemple)
   - Valeur : `https://wp.laboutiquedemorgane.com`
   - Environnement : Cochez **Production**, **Preview**, et **Development**
   - Cliquez sur "Save"

6. Répétez pour toutes les variables ci-dessus

### Méthode 2 : Via le CLI Vercel

Si vous avez le CLI Vercel installé :

```bash
vercel env add WORDPRESS_URL production
# Entrez la valeur quand demandé

vercel env add WC_CONSUMER_KEY production
# Entrez la valeur quand demandé

vercel env add WC_CONSUMER_SECRET production
# Entrez la valeur quand demandé
```

## Redéploiement

Après avoir ajouté les variables d'environnement :

1. Retournez sur le dashboard Vercel
2. Allez dans l'onglet **Deployments**
3. Cliquez sur les 3 points (...) du dernier déploiement
4. Sélectionnez **Redeploy**
5. Cochez **Use existing Build Cache** (optionnel, pour aller plus vite)
6. Cliquez sur **Redeploy**

OU simplement faites un nouveau commit et push sur votre repo Git, et Vercel redéploiera automatiquement.

## Vérification Finale

Une fois redéployé :

1. Attendez que le déploiement soit terminé (environ 2-3 minutes)
2. Testez l'API : `https://www.laboutiquedemorgane.com/api/woocommerce/categories?action=list`
3. Vous devriez voir un JSON avec vos 68 catégories WordPress

## Test de la Page Admin

Une fois les catégories chargées, testez la page admin :

1. Allez sur `https://www.laboutiquedemorgane.com/admin/home-categories`
2. Cliquez sur "Synchroniser avec WordPress" ou "Rafraîchir"
3. Vous devriez voir vos 68 catégories apparaître

## Troubleshooting

### Si ça ne fonctionne toujours pas

1. Vérifiez les logs Vercel :
   - Dashboard Vercel > Votre projet > Functions
   - Cliquez sur une fonction récente
   - Regardez les logs d'erreur

2. Testez avec le mode debug :
   - `https://www.laboutiquedemorgane.com/api/woocommerce/categories?action=list&debug=true`
   - Ça devrait montrer exactement quelle variable manque

3. Vérifiez que les credentials WooCommerce sont valides :
   - Allez sur votre WordPress : `https://wp.laboutiquedemorgane.com/wp-admin`
   - WooCommerce > Réglages > Avancé > API REST
   - Vérifiez que les clés existent et ont les permissions "Read/Write"

### Si les catégories s'affichent mais sont vides

C'est peut-être un problème de cache PostgREST. Essayez :

1. Allez sur `/admin/force-postgrest-cache-reload`
2. Cliquez sur "Recharger le cache"
3. Attendez quelques secondes
4. Retestez `/admin/home-categories`

## Contact

Si le problème persiste après avoir suivi toutes ces étapes, vérifiez :
- Que WordPress est bien accessible depuis l'extérieur
- Que WooCommerce est à jour
- Que les clés API WooCommerce sont actives et valides
