# Migration O2Switch - Guide Rapide

## Vue d'ensemble

Votre application utilise **3 composants** :
- **WordPress/WooCommerce** (MySQL) → À migrer de Vertex vers O2Switch ✅
- **Supabase** (PostgreSQL) → Reste chez Supabase (pas de migration) ✅
- **Frontend Next.js** → À déployer sur Vercel ✅

---

## Étapes Essentielles (6-8 heures)

### 1️⃣ Migration WordPress (2-3h)

**Chez Vertex :**
1. Exportez la base MySQL (PhpMyAdmin)
2. Téléchargez les fichiers WordPress (cPanel)

**Chez O2Switch :**
1. Créez une base MySQL
2. Importez la base exportée
3. Uploadez les fichiers WordPress
4. Modifiez `wp-config.php` :
   ```php
   define('DB_NAME', 'nouvelle_base');
   define('DB_USER', 'nouvel_user');
   define('DB_PASSWORD', 'nouveau_mdp');
   define('WP_HOME', 'https://wp.laboutiquedemorgane.com');
   define('WP_SITEURL', 'https://wp.laboutiquedemorgane.com');
   ```

5. Mettez à jour les URLs dans la base :
   ```sql
   UPDATE wp_options SET option_value = 'https://wp.laboutiquedemorgane.com'
   WHERE option_name IN ('siteurl', 'home');
   ```

6. Activez SSL (Let's Encrypt)
7. Testez : https://wp.laboutiquedemorgane.com/wp-admin

### 2️⃣ Régénération des Clés API WooCommerce (15 min)

1. WordPress → WooCommerce → Réglages → Avancé → REST API
2. Créez une nouvelle clé API (Lecture/Écriture)
3. Copiez Consumer Key et Consumer Secret

### 3️⃣ Mise à jour du Code Frontend (30 min)

**Option A : Script automatique**
```bash
chmod +x scripts-migration-o2switch.sh
./scripts-migration-o2switch.sh
```

**Option B : Manuelle**
Mettez à jour `.env` :
```env
NEXT_PUBLIC_WORDPRESS_API_URL=https://wp.laboutiquedemorgane.com/graphql
WORDPRESS_URL=https://wp.laboutiquedemorgane.com
WOOCOMMERCE_CONSUMER_KEY=ck_NOUVELLE_CLE
WOOCOMMERCE_CONSUMER_SECRET=cs_NOUVEAU_SECRET
WC_CONSUMER_KEY=ck_NOUVELLE_CLE
WC_CONSUMER_SECRET=cs_NOUVEAU_SECRET
```

### 4️⃣ Test Local (1h)

```bash
npm install
npm run build
npm run dev
```

Vérifiez :
- ✅ Produits affichés
- ✅ Recherche fonctionne
- ✅ Ajout au panier
- ✅ Connexion Supabase
- ✅ Checkout

### 5️⃣ Mise à jour Supabase (15 min)

**A. URLs autorisées**
Dashboard Supabase → Authentication → URL Configuration :
```
Site URL: https://laboutiquedemorgane.com
Redirect URLs: https://laboutiquedemorgane.com/**
```

**B. Secrets Edge Functions**
```bash
npx supabase login
npx supabase link --project-ref mifghuypxbtmkabjvwrm

npx supabase secrets set WORDPRESS_URL=https://wp.laboutiquedemorgane.com
npx supabase secrets set WOOCOMMERCE_URL=https://wp.laboutiquedemorgane.com
npx supabase secrets set WOOCOMMERCE_CONSUMER_KEY=ck_NOUVELLE_CLE
npx supabase secrets set WOOCOMMERCE_CONSUMER_SECRET=cs_NOUVEAU_SECRET
```

### 6️⃣ Déploiement Vercel (1h)

1. Créez un compte sur https://vercel.com
2. Connectez votre repository GitHub
3. Importez le projet `webproformation/laboutiquedemorgane`
4. Ajoutez **TOUTES** les variables d'environnement :
   ```
   NEXT_PUBLIC_WORDPRESS_API_URL=https://wp.laboutiquedemorgane.com/graphql
   WORDPRESS_URL=https://wp.laboutiquedemorgane.com
   WOOCOMMERCE_CONSUMER_KEY=...
   WOOCOMMERCE_CONSUMER_SECRET=...
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   PAYPAL_CLIENT_ID=...
   PAYPAL_CLIENT_SECRET=...
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=...
   BREVO_API_KEY=... (nouvelle clé!)
   STRIPE_SECRET_KEY=...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
   ONESIGNAL_API_KEY=...
   ONESIGNAL_APP_ID=...
   ```

5. Déployez
6. Ajoutez le domaine personnalisé :
   - Settings → Domains
   - Ajoutez `laboutiquedemorgane.com`
   - Suivez les instructions DNS

### 7️⃣ Configuration DNS (Propagation 5-60 min)

Chez votre registrar de domaine :

```
Type    Nom     Valeur                  TTL
A       wp      [IP serveur O2Switch]   300
CNAME   @       cname.vercel-dns.com    300
CNAME   www     cname.vercel-dns.com    300
```

### 8️⃣ Tests Production (2h)

Checklist complète :
- [ ] https://laboutiquedemorgane.com charge
- [ ] https://wp.laboutiquedemorgane.com/wp-admin accessible
- [ ] Produits affichés sur le frontend
- [ ] Recherche fonctionne
- [ ] Ajout au panier
- [ ] Wishlist (Supabase)
- [ ] Connexion/Inscription
- [ ] Checkout complet
- [ ] Création commande WooCommerce
- [ ] Email de confirmation (Brevo)
- [ ] Paiement Stripe
- [ ] Paiement PayPal
- [ ] Live Streams
- [ ] Jeux (Scratch, Roue)
- [ ] Newsletter
- [ ] Livre d'or

---

## Checklist Pré-Migration

- [ ] Backup complet Vertex (base + fichiers)
- [ ] Exporté la base MySQL
- [ ] Téléchargé les fichiers WordPress
- [ ] Testé les backups (import sur environnement test)
- [ ] Créé compte O2Switch
- [ ] Créé compte Vercel
- [ ] Informé les clients (optionnel)

---

## Checklist Post-Migration

- [ ] WordPress accessible sur nouvelle URL
- [ ] Tous les produits visibles
- [ ] API WooCommerce fonctionne
- [ ] Frontend Vercel déployé
- [ ] Domaine configuré et accessible
- [ ] SSL actif partout (cadenas vert)
- [ ] Tous les tests passent
- [ ] Monitoring actif (Vercel Analytics, logs)
- [ ] Backup configuré sur O2Switch
- [ ] Gardez Vertex actif 7 jours minimum

---

## En cas de Problème

### WordPress ne démarre pas
```bash
# Vérifiez wp-config.php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
# Regardez wp-content/debug.log
```

### API WooCommerce ne répond pas
1. WordPress → Réglages → Permaliens → Sauvegardez
2. Testez : `https://wp.laboutiquedemorgane.com/wp-json/wc/v3/products?consumer_key=XXX&consumer_secret=XXX`
3. Vérifiez les clés API dans WooCommerce

### Frontend ne charge pas les produits
1. Vercel → Deployments → Logs
2. Vérifiez les variables d'environnement
3. Redéployez : `git commit --allow-empty -m "redeploy" && git push`

### Images ne chargent pas
```bash
# SSH O2Switch
find /home/user/public_html/wp -type d -exec chmod 755 {} \;
find /home/user/public_html/wp -type f -exec chmod 644 {} \;
```

---

## Rollback d'Urgence

Si tout échoue :

1. **DNS** : Remettez les anciennes valeurs (propagation 5-60 min)
2. **Vercel** : Désactivez le domaine custom
3. **Vertex** : Réactivez l'ancien site
4. **Analysez** : Logs, erreurs, puis recommencez

---

## Support

- O2Switch : https://www.o2switch.fr/support/
- Vercel : https://vercel.com/docs
- Supabase : https://supabase.com/docs

---

## Coûts Mensuels

- O2Switch : ~6€/mois
- Vercel : Gratuit (ou 20$/mois Pro)
- Supabase : Gratuit (ou 25$/mois Pro)

**Total : 6-15€/mois**

---

Bonne migration ! 🚀
