# 🚀 Guide de Déploiement Vercel

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
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzIzNjAsImV4cCI6MjA4MjUwODM2MH0.q-4uGaHsuojj3ejo5IG4V-z2fx-ER9grHsRzYNkYn0c
   ```

   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkzMjM2MCwiZXhwIjoyMDgyNTA4MzYwfQ.mFJHZV-VdueE_okBTqkVh18tRvee94a5Z-k5TM4FQxM
   ```

3. **Variables WordPress/WooCommerce (Optionnelles)**

   Si vous utilisez l'intégration WooCommerce :

   ```
   WORDPRESS_URL=https://wp.laboutiquedemorgane.com
   WORDPRESS_USERNAME=webproformation.fr
   WORDPRESS_APP_PASSWORD=1ZENOcErQzBZFqaF5TtsQzGC
   WP_APPLICATION_PASSWORD=1ZENOcErQzBZFqaF5TtsQzGC
   WP_ADMIN_USERNAME=webproformation.fr
   WOOCOMMERCE_CONSUMER_KEY=ck_d620ae1f9fcd1832bdb2c31fe3ad8362a9de8b28
   WOOCOMMERCE_CONSUMER_SECRET=cs_f452fc79440e83b64d6c3a0c712d51c91c8dd5a4
   NEXT_PUBLIC_WORDPRESS_API_URL=https://wp.laboutiquedemorgane.com/graphql
   WC_CONSUMER_KEY=ck_d620ae1f9fcd1832bdb2c31fe3ad8362a9de8b28
   WC_CONSUMER_SECRET=cs_f452fc79440e83b64d6c3a0c712d51c91c8dd5a4
   ```

4. **Variables de Paiement (Production)**

   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCaMpoky_a5DGD5Hs1cA9OBLw2pUkqjTRU
   BREVO_API_KEY=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
   PAYPAL_CLIENT_ID=BAACikVdtpOx8gP2eh1n7xQdrCE3SAVWfIQsB17pSzkU5U5LREXOGvtLvKSc2lBnxdZYIN-sR5ZsLAnPxc
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=BAACikVdtpOx8gP2eh1n7xQdrCE3SAVWfIQsB17pSzkU5U5LREXOGvtLvKSc2lBnxdZYIN-sR5ZsLAnPxc
   PAYPAL_CLIENT_SECRET=ELjeY6wp47qSK8e74Hwch-ro8fgVcCxVWtIyk2D8croc61LHRwqrdLsuO8-n0xjUO0QVwmrxLXZYtYUw
   STRIPE_SECRET_KEY=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
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51SUr5xPQtkhTJgDoeFzyQrFv6cvrNFNjLxuOSInaHwkexIosi7DtfEEGM7W9AWCLfV5OKhpjf8ypdAbIuZm9e46g00ih7qoWoG
   ONESIGNAL_API_KEY=os_v2_app_poq5pgl2cze63gx6dphwforo5erqsjl3cqyegwv2lpyae34ra2vgxq46i6xuq3ruvf6po27cgyui6dd4mkznzzzdtd724v64eeu63yq
   ONESIGNAL_APP_ID=rqsjl3cqyegwv2lpyae34ra2v
   NEXT_PUBLIC_ONESIGNAL_APP_ID=rqsjl3cqyegwv2lpyae34ra2v
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
