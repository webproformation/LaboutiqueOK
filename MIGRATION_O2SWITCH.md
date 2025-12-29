# Guide de Migration vers O2Switch

Ce guide vous accompagne dans la migration complète de votre application vers O2Switch.

## Architecture de l'Application

Votre application utilise 3 composants distincts :

1. **WordPress/WooCommerce** (Backend) - Base MySQL
   - Gestion des produits, catégories, commandes
   - Gestion des articles/actualités
   - Médias et images

2. **Supabase** (Base de données PostgreSQL)
   - Profils utilisateurs
   - Wishlist, panier, fidélité
   - Jeux, coupons, live streams
   - Reste hébergé chez Supabase (pas besoin de migrer)

3. **Next.js** (Frontend)
   - Application web React
   - À déployer sur Vercel ou serveur Node.js

---

## ÉTAPE 1 : Migration WordPress vers O2Switch

### 1.1 Exporter depuis Vertex

**Option A : Via cPanel Vertex**

1. Connectez-vous au cPanel Vertex
2. **PhpMyAdmin** :
   - Sélectionnez votre base WordPress
   - Onglet "Exporter"
   - Méthode : Personnalisée
   - Format : SQL
   - Options : Cochez "Ajouter DROP TABLE"
   - Cliquez "Exécuter" et téléchargez le fichier `.sql`

3. **Gestionnaire de fichiers** :
   - Naviguez vers `/public_html/` (ou le dossier WordPress)
   - Sélectionnez tous les fichiers WordPress
   - Cliquez "Compresser" → Créer une archive `.zip`
   - Téléchargez l'archive

**Option B : Via Plugin WordPress**

1. Installez le plugin **Duplicator** ou **All-in-One WP Migration**
2. Créez un package complet (fichiers + base de données)
3. Téléchargez le package

### 1.2 Importer vers O2Switch

**Méthode 1 : Import manuel**

1. **cPanel O2Switch** → **PhpMyAdmin** :
   - Créez une nouvelle base de données
   - Notez : nom_base, utilisateur, mot de passe
   - Importez le fichier `.sql` exporté

2. **Gestionnaire de fichiers O2Switch** :
   - Uploadez et décompressez l'archive WordPress
   - Placez les fichiers dans `/public_html/wp/` (ou votre dossier)

3. **Modifiez wp-config.php** :
   ```php
   define('DB_NAME', 'nouveau_nom_base');
   define('DB_USER', 'nouvel_utilisateur');
   define('DB_PASSWORD', 'nouveau_mot_de_passe');
   define('DB_HOST', 'localhost');

   // Mettez à jour les URLs
   define('WP_HOME', 'https://wp.laboutiquedemorgane.com');
   define('WP_SITEURL', 'https://wp.laboutiquedemorgane.com');
   ```

4. **Mettez à jour les URLs dans la base** :
   ```sql
   -- Via PhpMyAdmin, exécutez ces requêtes
   UPDATE wp_options
   SET option_value = 'https://wp.laboutiquedemorgane.com'
   WHERE option_name IN ('siteurl', 'home');

   UPDATE wp_posts
   SET guid = REPLACE(guid, 'ancienne-url.com', 'wp.laboutiquedemorgane.com');

   UPDATE wp_posts
   SET post_content = REPLACE(post_content, 'ancienne-url.com', 'wp.laboutiquedemorgane.com');
   ```

**Méthode 2 : Via plugin (plus simple)**

1. Sur O2Switch, installez WordPress propre
2. Installez le même plugin (Duplicator/All-in-One WP Migration)
3. Importez le package créé depuis Vertex
4. Le plugin gère automatiquement les URLs

### 1.3 Configuration SSL

1. **cPanel O2Switch** → **SSL/TLS**
2. Activez **Let's Encrypt SSL** pour `wp.laboutiquedemorgane.com`
3. Dans WordPress : **Réglages** → **Général**
   - URL WordPress : `https://wp.laboutiquedemorgane.com`
   - URL du site : `https://wp.laboutiquedemorgane.com`

### 1.4 Vérification WordPress

1. Accédez à `https://wp.laboutiquedemorgane.com/wp-admin`
2. Vérifiez :
   - ✅ Produits WooCommerce
   - ✅ Catégories
   - ✅ Articles/Actualités
   - ✅ Médias/Images
   - ✅ Réglages WooCommerce
   - ✅ Clés API WooCommerce (voir étape suivante)

---

## ÉTAPE 2 : Reconfigurer les Clés API WooCommerce

### 2.1 Créer de nouvelles clés API

1. **WordPress** → **WooCommerce** → **Réglages** → **Avancé** → **REST API**
2. Cliquez **Ajouter une clé**
3. Configuration :
   - Description : `Next.js Frontend`
   - Utilisateur : Sélectionnez un administrateur
   - Permissions : **Lecture/Écriture**
4. Cliquez **Générer la clé API**
5. **IMPORTANT** : Copiez immédiatement :
   - Consumer Key (CK)
   - Consumer Secret (CS)

### 2.2 Mettre à jour le fichier .env

Modifiez `/tmp/cc-agent/61087157/project/.env` :

```env
# WordPress O2Switch
NEXT_PUBLIC_WORDPRESS_API_URL=https://wp.laboutiquedemorgane.com/wp-json
WORDPRESS_API_URL=https://wp.laboutiquedemorgane.com/wp-json

# WooCommerce O2Switch - Nouvelles clés
WOOCOMMERCE_CONSUMER_KEY=ck_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
WOOCOMMERCE_CONSUMER_SECRET=cs_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
WOOCOMMERCE_URL=https://wp.laboutiquedemorgane.com

# Supabase (reste inchangé)
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_supabase
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role

# Autres services (restent inchangés)
```

---

## ÉTAPE 3 : Configuration DNS et Domaine

### 3.1 Domaine principal (laboutiquedemorgane.com)

Vous devez décider où héberger le frontend Next.js :

**Option A : Vercel (Recommandé)**
- Gratuit, performant, déploiement automatique
- DNS : Pointez `laboutiquedemorgane.com` vers Vercel

**Option B : O2Switch avec Node.js**
- Si O2Switch supporte Node.js
- Plus complexe à configurer

### 3.2 Configuration DNS

Dans votre registrar de domaine (OVH, Gandi, etc.) :

```
Type    Nom     Valeur
A       wp      [IP O2Switch]
CNAME   www     [Selon hébergeur frontend]
A       @       [Selon hébergeur frontend]
```

---

## ÉTAPE 4 : Déploiement Frontend Next.js

### 4.1 Déploiement sur Vercel (Recommandé)

1. **Créez un compte sur** https://vercel.com
2. **Connectez votre repository GitHub**
3. **Importez le projet** :
   - New Project → Import Git Repository
   - Sélectionnez : `webproformation/laboutiquedemorgane`

4. **Configuration Build** :
   ```
   Framework Preset: Next.js
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

5. **Variables d'environnement** :
   Ajoutez TOUTES les variables du fichier `.env` :
   - `NEXT_PUBLIC_WORDPRESS_API_URL`
   - `WORDPRESS_API_URL`
   - `WOOCOMMERCE_CONSUMER_KEY`
   - `WOOCOMMERCE_CONSUMER_SECRET`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - Etc.

6. **Déployez** : Vercel va automatiquement :
   - Installer les dépendances
   - Builder le projet
   - Déployer sur un CDN global

7. **Domaine personnalisé** :
   - Settings → Domains
   - Ajoutez `laboutiquedemorgane.com` et `www.laboutiquedemorgane.com`
   - Suivez les instructions DNS

### 4.2 Alternative : Déploiement sur O2Switch

Si O2Switch supporte Node.js (vérifiez avec leur support) :

1. **Buildez localement** :
   ```bash
   npm run build
   npm run export  # ou utilisez standalone mode
   ```

2. **Uploadez vers O2Switch** :
   - Via FTP/SFTP
   - Uploadez tous les fichiers

3. **Configurez Node.js** :
   - Créez un fichier `.htaccess` pour proxy
   - Ou configurez un processus Node.js via cPanel

**Note** : Cette méthode est plus complexe. Vercel est fortement recommandé.

---

## ÉTAPE 5 : Configuration Supabase

### 5.1 Mettre à jour les URLs autorisées

1. **Dashboard Supabase** → Votre projet → **Authentication** → **URL Configuration**

2. **Site URL** :
   ```
   https://laboutiquedemorgane.com
   ```

3. **Redirect URLs** (ajoutez) :
   ```
   https://laboutiquedemorgane.com/**
   https://www.laboutiquedemorgane.com/**
   ```

### 5.2 Mettre à jour les secrets Edge Functions

```bash
# Connectez-vous
npx supabase login

# Liez votre projet
npx supabase link --project-ref VOTRE_PROJECT_REF

# Mettez à jour les secrets
npx supabase secrets set WORDPRESS_URL=https://wp.laboutiquedemorgane.com
npx supabase secrets set WOOCOMMERCE_URL=https://wp.laboutiquedemorgane.com
npx supabase secrets set WOOCOMMERCE_CONSUMER_KEY=ck_XXXXX
npx supabase secrets set WOOCOMMERCE_CONSUMER_SECRET=cs_XXXXX
```

---

## ÉTAPE 6 : Tests Post-Migration

### 6.1 Checklist WordPress

- [ ] WordPress accessible : `https://wp.laboutiquedemorgane.com/wp-admin`
- [ ] Tous les produits visibles
- [ ] Toutes les catégories visibles
- [ ] Images/médias chargent correctement
- [ ] API REST accessible : `https://wp.laboutiquedemorgane.com/wp-json/wc/v3/products?consumer_key=XXX&consumer_secret=XXX`

### 6.2 Checklist Frontend

- [ ] Page d'accueil charge : `https://laboutiquedemorgane.com`
- [ ] Produits affichés correctement
- [ ] Recherche fonctionne
- [ ] Ajout au panier fonctionne
- [ ] Connexion/Inscription Supabase fonctionnent
- [ ] Checkout fonctionne
- [ ] Création de commande WooCommerce fonctionne

### 6.3 Checklist Fonctionnalités

- [ ] Wishlist (Supabase)
- [ ] Fidélité (Supabase)
- [ ] Jeux (Scratch, Roue)
- [ ] Live Streams
- [ ] Newsletter
- [ ] Paiements (Stripe/PayPal)
- [ ] Emails (Brevo)

---

## ÉTAPE 7 : Migration des Emails

### 7.1 Configuration Brevo

Dans WordPress O2Switch :

1. **WooCommerce** → **Réglages** → **Emails**
2. Installez le plugin **WP Mail SMTP** ou **Brevo for WooCommerce**
3. Configurez avec votre clé API Brevo
4. Testez l'envoi d'email

### 7.2 Vérification DNS

Configurez les enregistrements SPF/DKIM pour `laboutiquedemorgane.com` :

```
Type    Nom     Valeur
TXT     @       v=spf1 include:spf.brevo.com ~all
TXT     mail._domainkey     [Clé DKIM fournie par Brevo]
```

---

## ÉTAPE 8 : Optimisations O2Switch

### 8.1 Performances WordPress

1. **Cache** :
   - Installez **WP Super Cache** ou **W3 Total Cache**
   - Activez le cache navigateur et serveur

2. **CDN** :
   - Utilisez un CDN (Cloudflare, BunnyCDN)
   - Pour les images et médias

3. **Base de données** :
   - Optimisez avec **WP-Optimize**
   - Nettoyez les révisions, transients

### 8.2 Sécurité

1. **SSL** : Forcez HTTPS partout
2. **Firewall** : Activez le WAF cPanel O2Switch
3. **Backups** : Configurez des backups automatiques cPanel
4. **Updates** : Gardez WordPress, plugins, thèmes à jour

---

## ÉTAPE 9 : Basculement Final

### 9.1 Avant le basculement

1. Testez tout sur les nouvelles URLs
2. Informez les clients (email, bannière)
3. Préparez un plan de rollback

### 9.2 Basculement DNS

1. Réduisez le TTL DNS à 300 secondes (5 min) - 24h avant
2. Basculez les enregistrements DNS :
   ```
   laboutiquedemorgane.com → Nouvelle IP/CNAME
   www.laboutiquedemorgane.com → Nouvelle IP/CNAME
   ```
3. Attendez la propagation (5-60 minutes)

### 9.3 Post-basculement

1. Surveillez les logs d'erreur (WordPress, Vercel, Supabase)
2. Vérifiez les métriques (trafic, conversions)
3. Gardez l'ancien serveur Vertex 7 jours minimum

---

## ÉTAPE 10 : Désactivation Vertex

**Après 7 jours de succès** :

1. Exportez une dernière fois (backup final)
2. Résiliez l'hébergement Vertex
3. Supprimez les données sensibles

---

## Aide et Dépannage

### Problèmes courants

**"Cannot connect to database"**
- Vérifiez `wp-config.php` : host, user, password, database name
- Vérifiez que l'utilisateur MySQL a les permissions

**"API WooCommerce ne répond pas"**
- Vérifiez les clés API dans WordPress
- Testez manuellement : `https://wp.laboutiquedemorgane.com/wp-json/wc/v3/products?consumer_key=XXX&consumer_secret=XXX`
- Vérifiez les permaliens WordPress : **Réglages** → **Permaliens** → Sauvegardez

**"Images ne chargent pas"**
- Vérifiez les permissions fichiers (755 pour dossiers, 644 pour fichiers)
- Régénérez les miniatures : plugin **Regenerate Thumbnails**
- Mettez à jour les URLs dans la base de données

**"Frontend ne charge pas les produits"**
- Vérifiez les variables d'environnement Vercel
- Vérifiez les logs : Vercel Dashboard → Functions → Logs
- Testez l'API WordPress directement dans le navigateur

### Support

- **O2Switch Support** : https://www.o2switch.fr/support/
- **Vercel Documentation** : https://vercel.com/docs
- **Supabase Documentation** : https://supabase.com/docs

---

## Estimation du Temps

- Migration WordPress : 2-4 heures
- Configuration API/DNS : 1-2 heures
- Déploiement Vercel : 30 minutes
- Tests complets : 2-3 heures
- **Total : 6-10 heures**

---

## Coûts

- **O2Switch** : ~5-7€/mois (hébergement WordPress)
- **Vercel** : Gratuit (ou Pro à 20$/mois si besoin)
- **Supabase** : Gratuit (ou Pro à 25$/mois si >500MB)
- **Domaine** : ~15€/an

**Total estimé : 5-15€/mois** (selon usage)

---

Bonne migration ! N'hésitez pas si vous avez des questions.
