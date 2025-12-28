# Guide Complet : Déploiement sur Vercel - Étapes Détaillées

## Architecture Finale

```
┌─────────────────────────────────────────────┐
│  laboutiquedemorgane.com (Vercel)          │
│  Frontend Next.js + CDN Mondial            │
└──────────┬──────────────────────────────────┘
           │
           │ API REST
           │
           ├──────────────────┐
           │                  │
           ▼                  ▼
┌──────────────────┐  ┌─────────────────┐
│  o2switch        │  │   Supabase      │
│  WordPress       │  │   PostgreSQL    │
│  WooCommerce     │  │   Auth, Panier  │
│  MySQL           │  │   Fidélité, etc │
└──────────────────┘  └─────────────────┘
```

---

## ÉTAPE 1 : Supprimer l'ancien projet Vercel

### Option A : Supprimer juste les domaines (Recommandé)

1. Allez sur **https://vercel.com/dashboard**
2. Cliquez sur votre projet
3. **Settings** (menu de gauche)
4. **Domains**
5. Pour chaque domaine (`laboutiquedemorgane.com` et `www.laboutiquedemorgane.com`) :
   - Cliquez sur les **3 points** (⋮)
   - **Remove**
   - Confirmez

### Option B : Supprimer complètement le projet

1. **Settings** → **General**
2. Descendez tout en bas
3. Section **Delete Project**
4. Tapez le nom du projet pour confirmer
5. **Delete**

**Attendez 5 minutes** que Vercel libère complètement les domaines.

---

## ÉTAPE 2 : Vérifier votre code local

### 2.1 Assurez-vous que le code est à jour

```bash
cd /tmp/cc-agent/61087157/project

# Vérifiez que tout build correctement (déjà fait ✓)
npm run build
```

### 2.2 Vérifiez que Git est configuré

```bash
# Initialisez Git si ce n'est pas déjà fait
git init

# Ajoutez tous les fichiers
git add .

# Commitez
git commit -m "Prêt pour déploiement Vercel"
```

### 2.3 Créez un dépôt GitHub (si pas déjà fait)

1. Allez sur **https://github.com/new**
2. Nom du repo : `laboutiquedemorgane`
3. **Private** (recommandé)
4. **Create repository**

### 2.4 Pushez vers GitHub

```bash
# Liez votre repo local à GitHub
git remote add origin https://github.com/VOTRE_USERNAME/laboutiquedemorgane.git

# Pushez
git branch -M main
git push -u origin main
```

---

## ÉTAPE 3 : Déployer sur Vercel

### 3.1 Connectez-vous à Vercel

1. Allez sur **https://vercel.com**
2. **Sign Up** ou **Log In**
3. Connectez votre compte GitHub si ce n'est pas déjà fait

### 3.2 Créez un nouveau projet

1. Cliquez sur **Add New...** → **Project**
2. **Import Git Repository**
3. Trouvez votre repo `laboutiquedemorgane`
4. Cliquez sur **Import**

### 3.3 Configurez le projet

Vercel détecte automatiquement Next.js. Vérifiez ces paramètres :

```
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build (ou next build)
Output Directory: .next
Install Command: npm install
Node.js Version: 18.x
```

**NE CLIQUEZ PAS ENCORE SUR "DEPLOY"** - Il faut d'abord ajouter les variables d'environnement.

---

## ÉTAPE 4 : Configurer les Variables d'Environnement

### 4.1 Dans Vercel, avant le déploiement

1. Dépliez la section **Environment Variables**
2. Ajoutez TOUTES ces variables une par une :

```env
# WordPress/WooCommerce O2Switch
NEXT_PUBLIC_WORDPRESS_API_URL=https://wp.laboutiquedemorgane.com/wp-json
WORDPRESS_API_URL=https://wp.laboutiquedemorgane.com/wp-json
WOOCOMMERCE_URL=https://wp.laboutiquedemorgane.com
WOOCOMMERCE_CONSUMER_KEY=ck_VOTRE_CLE_ICI
WOOCOMMERCE_CONSUMER_SECRET=cs_VOTRE_SECRET_ICI

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://VOTRE_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key

# Stripe (si configuré)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_XXXXX
STRIPE_SECRET_KEY=sk_live_XXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXX

# PayPal (si configuré)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=votre_client_id
PAYPAL_CLIENT_SECRET=votre_secret

# Brevo (emails)
BREVO_API_KEY=xkeysib-XXXXX
BREVO_SENDER_EMAIL=contact@laboutiquedemorgane.com
BREVO_SENDER_NAME=La Boutique de Morgane

# OneSignal (notifications push)
NEXT_PUBLIC_ONESIGNAL_APP_ID=votre_app_id

# Google Maps (si utilisé)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=votre_api_key
```

**Important** : Pour chaque variable, sélectionnez **Production, Preview, Development**

### 4.2 Comment trouver vos valeurs ?

Regardez votre fichier `.env` local :

```bash
cat /tmp/cc-agent/61087157/project/.env
```

Copiez EXACTEMENT les valeurs de votre `.env` local.

### 4.3 Déployez

Une fois toutes les variables ajoutées, cliquez sur **Deploy**.

Vercel va :
- Installer les dépendances (2-3 min)
- Builder le projet (3-5 min)
- Déployer sur le CDN (1 min)

**Temps total : 5-10 minutes**

---

## ÉTAPE 5 : Ajouter votre Domaine Personnalisé

### 5.1 Une fois le déploiement terminé

1. Dans votre projet Vercel, allez dans **Settings**
2. **Domains** (menu de gauche)
3. Ajoutez ces 2 domaines :

```
laboutiquedemorgane.com
www.laboutiquedemorgane.com
```

### 5.2 Vercel vous donnera les instructions DNS

Vercel affichera quelque chose comme :

```
Pour laboutiquedemorgane.com :
Type    Name    Value
A       @       76.76.21.21

Pour www.laboutiquedemorgane.com :
Type    Name    Value
CNAME   www     cname.vercel-dns.com
```

**Notez ces valeurs** - vous en aurez besoin pour l'étape suivante.

---

## ÉTAPE 6 : Configurer le DNS

### 6.1 Où modifier le DNS ?

Allez chez votre **registrar de domaine** (là où vous avez acheté `laboutiquedemorgane.com`) :
- OVH
- Gandi
- Namecheap
- Google Domains
- Etc.

### 6.2 Modifiez les enregistrements DNS

**Supprimez** les anciens enregistrements pour `@` et `www`, puis **ajoutez** :

```
Type    Nom     Valeur                      TTL
A       @       76.76.21.21                 300
CNAME   www     cname.vercel-dns.com        300
```

**Laissez intact** :
```
A       wp      109.234.166.44              300  (o2switch)
```

### 6.3 Configuration complète recommandée

```
Type    Nom                 Valeur                              TTL
A       @                   76.76.21.21                         300
CNAME   www                 cname.vercel-dns.com                300
A       wp                  109.234.166.44                      300
TXT     @                   v=spf1 include:spf.brevo.com ~all   3600
```

### 6.4 Attendez la propagation DNS

- **Minimum** : 5-10 minutes
- **Maximum** : 48 heures (rare)
- **En général** : 30 minutes

---

## ÉTAPE 7 : Vérification et Tests

### 7.1 Vérifiez le déploiement Vercel

1. Dans Vercel Dashboard → **Deployments**
2. Le dernier déploiement doit avoir le statut **Ready**
3. Cliquez dessus pour voir les logs

### 7.2 Testez l'URL Vercel temporaire

Vercel vous donne une URL comme :
```
https://laboutiquedemorgane-XXXXX.vercel.app
```

Testez cette URL :
- La page d'accueil charge ? ✓
- Les produits s'affichent ? ✓
- Les images chargent ? ✓

### 7.3 Vérifiez la propagation DNS

```bash
# Dans votre terminal
nslookup laboutiquedemorgane.com
```

Vous devriez voir l'IP de Vercel (76.76.21.21).

### 7.4 Testez votre domaine

Allez sur **https://laboutiquedemorgane.com**

Checklist :
- [ ] Page d'accueil charge
- [ ] SSL (cadenas vert)
- [ ] Produits affichés
- [ ] Images chargent
- [ ] Recherche fonctionne
- [ ] Ajout au panier fonctionne
- [ ] Connexion/Inscription fonctionnent
- [ ] Checkout fonctionne

---

## ÉTAPE 8 : Configuration Post-Déploiement

### 8.1 Mettez à jour Supabase

1. **Dashboard Supabase** → Authentication → URL Configuration
2. **Site URL** : `https://laboutiquedemorgane.com`
3. **Redirect URLs** (ajoutez) :
   ```
   https://laboutiquedemorgane.com/**
   https://www.laboutiquedemorgane.com/**
   https://laboutiquedemorgane-*.vercel.app/**
   ```

### 8.2 Mettez à jour les Secrets Supabase Edge Functions

Si vous utilisez des Edge Functions Supabase :

```bash
npx supabase login
npx supabase link --project-ref VOTRE_PROJECT_REF

npx supabase secrets set WORDPRESS_URL=https://wp.laboutiquedemorgane.com
npx supabase secrets set WOOCOMMERCE_URL=https://wp.laboutiquedemorgane.com
npx supabase secrets set WOOCOMMERCE_CONSUMER_KEY=ck_XXXXX
npx supabase secrets set WOOCOMMERCE_CONSUMER_SECRET=cs_XXXXX
```

### 8.3 Configurez les Webhooks

**Stripe Webhooks** (si applicable) :
1. Dashboard Stripe → Developers → Webhooks
2. Ajoutez : `https://laboutiquedemorgane.com/api/webhooks/stripe`

**PayPal Webhooks** (si applicable) :
1. Dashboard PayPal → Webhooks
2. Ajoutez : `https://laboutiquedemorgane.com/api/webhooks/paypal`

---

## ÉTAPE 9 : Optimisations Vercel (Optionnel)

### 9.1 Analytics

1. **Analytics** (menu Vercel)
2. **Enable Analytics** (gratuit jusqu'à 100k vues/mois)

### 9.2 Speed Insights

1. **Speed Insights**
2. **Enable Speed Insights**
3. Surveillez les performances

### 9.3 Logs et Monitoring

1. **Logs** (menu Vercel)
2. **Real-time logs** pour débugger

---

## Dépannage

### Problème : "Le site ne charge pas"

1. Vérifiez que le déploiement Vercel est **Ready**
2. Testez l'URL Vercel temporaire (*.vercel.app)
3. Si elle fonctionne, c'est un problème DNS → Attendez

### Problème : "Les produits ne chargent pas"

1. Vérifiez les variables d'environnement Vercel
2. **Settings** → **Environment Variables**
3. Vérifiez `WOOCOMMERCE_CONSUMER_KEY` et `WOOCOMMERCE_CONSUMER_SECRET`
4. Testez l'API WordPress : `https://wp.laboutiquedemorgane.com/wp-json/wc/v3/products`

### Problème : "Erreur 500 sur certaines pages"

1. Vercel → **Deployments** → Cliquez sur le dernier
2. **Functions** → Regardez les logs
3. Les erreurs vous diront ce qui manque (variable d'env, API, etc.)

### Problème : "Images ne chargent pas"

Vérifiez `next.config.js` - les domaines d'images doivent être autorisés :

```javascript
images: {
  domains: ['wp.laboutiquedemorgane.com'],
}
```

---

## Déploiements Futurs

### Déploiement Automatique

Chaque fois que vous pushez sur GitHub :

```bash
git add .
git commit -m "Mise à jour"
git push
```

Vercel déploie automatiquement en 3-5 minutes.

### Déploiement Manuel

```bash
# Installez Vercel CLI
npm i -g vercel

# Déployez
vercel --prod
```

---

## Coûts Vercel

**Plan Hobby (Gratuit)** :
- 100 GB de bande passante/mois
- Builds illimités
- Domaines personnalisés illimités
- SSL automatique

**Plan Pro (20$/mois)** si vous dépassez :
- 1 TB de bande passante
- Déploiements prioritaires
- Support avancé

---

## Support

- **Vercel Documentation** : https://vercel.com/docs
- **Vercel Support** : https://vercel.com/support
- **Next.js Documentation** : https://nextjs.org/docs

---

Vous êtes prêt ! Suivez ces étapes une par une et votre site sera en ligne sur Vercel avec votre domaine personnalisé.
