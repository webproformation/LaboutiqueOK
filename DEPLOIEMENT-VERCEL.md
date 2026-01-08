# 🚀 Guide de Déploiement Vercel

## ✅ CORRECTIF APPLIQUÉ (07/01/2026)

Le script de vérification `prebuild` a été rendu optionnel pour permettre le déploiement sur Vercel.
Le build ne sera plus bloqué par le script de vérification manquant.

## Configuration des Variables d'Environnement

Votre projet est verrouillé sur la base de données Supabase `qcqbtmvbvipsxwjlgjvk`.

### Étapes de Configuration sur Vercel

1. **Aller dans les Paramètres du Projet**
   - Ouvrez votre projet sur [vercel.com](https://vercel.com)
   - Cliquez sur **Settings** → **Environment Variables**

2. **Ajouter les Variables Obligatoires**

   Copiez-collez ces variables exactement comme indiqué :

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://qcqbtmvbvipsxwjlgjvk.supabase.co
   ```

   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   ```
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

3. **Variables WordPress/WooCommerce (Optionnelles)**

   Si vous utilisez l'intégration WooCommerce :

   ```
   WORDPRESS_URL=https://wp.laboutiquedemorgane.com
   WORDPRESS_USERNAME=your_wordpress_username
   WORDPRESS_APP_PASSWORD=your_wordpress_app_password
   WP_APPLICATION_PASSWORD=your_wordpress_app_password
   WP_ADMIN_USERNAME=your_wordpress_username
   WOOCOMMERCE_CONSUMER_KEY=your_woocommerce_consumer_key
   WOOCOMMERCE_CONSUMER_SECRET=your_woocommerce_consumer_secret
   NEXT_PUBLIC_WORDPRESS_API_URL=https://wp.laboutiquedemorgane.com/graphql
   WC_CONSUMER_KEY=your_woocommerce_consumer_key
   WC_CONSUMER_SECRET=your_woocommerce_consumer_secret
   ```

4. **Variables de Paiement (Production)**

   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   BREVO_API_KEY=your_brevo_api_key
   PAYPAL_CLIENT_ID=your_paypal_client_id
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_CLIENT_SECRET=your_paypal_client_secret
   STRIPE_SECRET_KEY=your_stripe_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ONESIGNAL_API_KEY=your_onesignal_api_key
   ONESIGNAL_APP_ID=your_onesignal_app_id
   NEXT_PUBLIC_ONESIGNAL_APP_ID=your_onesignal_app_id
   ```

5. **Appliquer à tous les environnements**
   - Cochez **Production**, **Preview**, et **Development**
   - Cliquez sur **Save**

6. **Redéployer**
   - Allez dans **Deployments**
   - Cliquez sur les 3 points du dernier déploiement
   - Sélectionnez **Redeploy**

## Vérification

Une fois déployé, votre site devrait :
- ✅ Se connecter à la base Supabase qcqbtmvbvipsxwjlgjvk
- ✅ Afficher les 118 produits correctement catégorisés
- ✅ Afficher les 62 catégories

## Troubleshooting

**Erreur : "Cannot read properties of undefined"**
→ Variables d'environnement manquantes sur Vercel

**Erreur : "Failed to fetch"**
→ Vérifier NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY

**Build qui échoue**
→ Le script de vérification détecte automatiquement Vercel et ne bloque pas
