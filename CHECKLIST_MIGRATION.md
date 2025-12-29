# ✅ Checklist Migration O2Switch

## 📋 Avant de Commencer

- [ ] J'ai lu `MIGRATION_O2SWITCH.md` ou `MIGRATION_RAPIDE.md`
- [ ] J'ai compris que Supabase reste chez Supabase (pas de migration)
- [ ] J'ai prévu 6-10 heures pour la migration complète
- [ ] J'ai fait un backup complet de Vertex
- [ ] J'ai un compte O2Switch actif
- [ ] J'ai un compte Vercel (gratuit)

---

## 🗄️ PHASE 1 : Migration WordPress (2-3h)

### Export depuis Vertex
- [ ] Exporté la base MySQL via PhpMyAdmin (fichier .sql)
- [ ] Téléchargé tous les fichiers WordPress (via cPanel ou FTP)
- [ ] Vérifié que l'archive est complète

### Import vers O2Switch
- [ ] Créé une nouvelle base MySQL sur O2Switch
- [ ] Noté : nom_base, utilisateur, mot_de_passe
- [ ] Importé le fichier .sql dans la nouvelle base
- [ ] Uploadé les fichiers WordPress
- [ ] Modifié `wp-config.php` avec les nouvelles infos
- [ ] Activé SSL (Let's Encrypt)
- [ ] Testé l'accès : https://wp.laboutiquedemorgane.com/wp-admin

### Mise à jour des URLs
- [ ] Exécuté les requêtes SQL pour remplacer les anciennes URLs
- [ ] WordPress → Réglages → Permaliens → Sauvegardé
- [ ] Vérifié que tous les produits sont visibles
- [ ] Vérifié que toutes les catégories sont visibles
- [ ] Vérifié que les images chargent correctement

---

## 🔑 PHASE 2 : Clés API WooCommerce (15 min)

- [ ] WordPress → WooCommerce → Réglages → Avancé → REST API
- [ ] Créé une nouvelle clé API (Lecture/Écriture)
- [ ] Copié Consumer Key : `ck_...`
- [ ] Copié Consumer Secret : `cs_...`
- [ ] Testé l'API manuellement dans le navigateur :
  ```
  https://wp.laboutiquedemorgane.com/wp-json/wc/v3/products?consumer_key=XXX&consumer_secret=XXX
  ```

---

## 🔧 PHASE 3 : Mise à Jour du Code (30 min)

### Automatique
- [ ] Exécuté le script : `./scripts-migration-o2switch.sh`
- [ ] Vérifié les fichiers modifiés

### Manuel (si le script n'a pas fonctionné)
- [ ] Mis à jour `.env` avec les nouvelles URLs
- [ ] Mis à jour les nouvelles clés WooCommerce dans `.env`
- [ ] Vérifié tous les fichiers listés dans `grep -r "webprocreation"`

---

## 🧪 PHASE 4 : Tests Locaux (1h)

- [ ] Exécuté `npm install`
- [ ] Exécuté `npm run build` (vérifié : 0 erreur)
- [ ] Exécuté `npm run dev`
- [ ] Testé page d'accueil : http://localhost:3000
- [ ] Testé affichage des produits
- [ ] Testé recherche produits
- [ ] Testé ajout au panier
- [ ] Testé connexion Supabase
- [ ] Testé wishlist
- [ ] Testé checkout complet
- [ ] Testé création de commande

---

## ☁️ PHASE 5 : Configuration Supabase (15 min)

### URLs autorisées
- [ ] Dashboard Supabase → Authentication → URL Configuration
- [ ] Site URL : `https://laboutiquedemorgane.com`
- [ ] Redirect URLs : `https://laboutiquedemorgane.com/**`
- [ ] Sauvegardé

### Secrets Edge Functions
- [ ] `npx supabase login`
- [ ] `npx supabase link --project-ref mifghuypxbtmkabjvwrm`
- [ ] Défini `WORDPRESS_URL`
- [ ] Défini `WOOCOMMERCE_URL`
- [ ] Défini `WOOCOMMERCE_CONSUMER_KEY`
- [ ] Défini `WOOCOMMERCE_CONSUMER_SECRET`

---

## 🚀 PHASE 6 : Déploiement Vercel (1h)

### Setup Vercel
- [ ] Créé compte sur https://vercel.com
- [ ] Connecté à GitHub
- [ ] Importé le projet `webproformation/laboutiquedemorgane`
- [ ] Configuré Build Settings :
  - Framework: Next.js
  - Build Command: `npm run build`
  - Install Command: `npm install`

### Variables d'Environnement
- [ ] `NEXT_PUBLIC_WORDPRESS_API_URL`
- [ ] `WORDPRESS_URL`
- [ ] `WOOCOMMERCE_CONSUMER_KEY`
- [ ] `WOOCOMMERCE_CONSUMER_SECRET`
- [ ] `WC_CONSUMER_KEY`
- [ ] `WC_CONSUMER_SECRET`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `PAYPAL_CLIENT_ID`
- [ ] `PAYPAL_CLIENT_SECRET`
- [ ] `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
- [ ] `BREVO_API_KEY` (NOUVELLE CLÉ après révocation)
- [ ] `STRIPE_SECRET_KEY`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- [ ] `ONESIGNAL_API_KEY`
- [ ] `ONESIGNAL_APP_ID`

### Premier Déploiement
- [ ] Cliqué "Deploy"
- [ ] Attendu la fin du build
- [ ] Vérifié : déploiement réussi
- [ ] Testé l'URL Vercel : `https://votre-projet.vercel.app`

### Domaine Personnalisé
- [ ] Settings → Domains
- [ ] Ajouté `laboutiquedemorgane.com`
- [ ] Ajouté `www.laboutiquedemorgane.com`
- [ ] Copié les instructions DNS

---

## 🌐 PHASE 7 : Configuration DNS (5-60 min)

### Chez le Registrar
- [ ] Réduit TTL à 300 secondes (5 min)
- [ ] Attendu 24h (optionnel mais recommandé)
- [ ] Configuré les enregistrements :
  ```
  Type    Nom     Valeur
  A       wp      [IP O2Switch]
  CNAME   @       cname.vercel-dns.com
  CNAME   www     cname.vercel-dns.com
  ```
- [ ] Sauvegardé
- [ ] Attendu propagation (5-60 min)

### Vérification
- [ ] `https://laboutiquedemorgane.com` charge
- [ ] `https://www.laboutiquedemorgane.com` charge
- [ ] `https://wp.laboutiquedemorgane.com` charge
- [ ] Tous affichent le cadenas SSL vert 🔒

---

## ✅ PHASE 8 : Tests Production (2h)

### Frontend
- [ ] Page d'accueil charge
- [ ] Produits affichés
- [ ] Filtres fonctionnent
- [ ] Recherche fonctionne
- [ ] Images chargent
- [ ] Vitesse acceptable (< 3s)

### Panier & Checkout
- [ ] Ajout produit au panier
- [ ] Modification quantité
- [ ] Suppression produit
- [ ] Checkout affiche les options
- [ ] Sélection Mondial Relay
- [ ] Application d'un coupon

### Paiements
- [ ] Test paiement Stripe (mode test)
- [ ] Test paiement PayPal (mode sandbox)
- [ ] Réception email confirmation
- [ ] Commande créée dans WooCommerce
- [ ] Commande visible dans Supabase

### Compte Utilisateur
- [ ] Inscription nouveau compte
- [ ] Connexion existant
- [ ] Réinitialisation mot de passe
- [ ] Modification profil
- [ ] Upload photo de profil

### Fonctionnalités Avancées
- [ ] Wishlist (ajout/suppression)
- [ ] Programme fidélité (points)
- [ ] Jeu Scratch Card
- [ ] Jeu Roue de la Fortune
- [ ] Live Streams (si actif)
- [ ] Newsletter (inscription)
- [ ] Livre d'or (ajout message)
- [ ] Recherche de produits
- [ ] Filtres de catégories
- [ ] Tri par prix/popularité

### Administration
- [ ] Accès admin WordPress
- [ ] Accès admin Supabase
- [ ] Dashboard Next.js admin
- [ ] Gestion produits
- [ ] Gestion commandes
- [ ] Gestion clients
- [ ] Statistiques/Analytics

---

## 📧 PHASE 9 : Configuration Email (30 min)

### Brevo (Sendinblue)
- [ ] Vérifié que la nouvelle clé API est active
- [ ] Configuré le domaine sender
- [ ] Testé envoi email depuis WooCommerce
- [ ] Testé email de commande
- [ ] Testé email de facture

### DNS Email
- [ ] Configuré SPF : `v=spf1 include:spf.brevo.com ~all`
- [ ] Configuré DKIM (fourni par Brevo)
- [ ] Vérifié dans Brevo que le domaine est validé

---

## 🔒 PHASE 10 : Sécurité (30 min)

### WordPress
- [ ] Changé tous les mots de passe admin
- [ ] Activé authentification 2FA (plugin recommandé)
- [ ] Installé plugin de sécurité (Wordfence ou similaire)
- [ ] Configuré sauvegardes automatiques
- [ ] Vérifié permissions fichiers (755/644)

### O2Switch
- [ ] Activé le firewall WAF
- [ ] Configuré backups automatiques (cPanel)
- [ ] Noté les informations d'accès dans un coffre-fort

### Vercel
- [ ] Activé Vercel Authentication (optionnel)
- [ ] Configuré les logs et alertes
- [ ] Vérifié les quotas/limites

---

## 📊 PHASE 11 : Monitoring (30 min)

- [ ] Activé Vercel Analytics
- [ ] Configuré Google Analytics (si utilisé)
- [ ] Configuré suivi erreurs (Sentry ou similaire)
- [ ] Testé les logs Supabase
- [ ] Testé les logs WordPress (wp-content/debug.log)
- [ ] Configuré alertes (emails, Slack, etc.)

---

## 🧹 PHASE 12 : Nettoyage (Après 7 jours)

- [ ] Tous les tests passent depuis 7 jours
- [ ] Aucune erreur signalée
- [ ] Trafic normal/stable
- [ ] Export backup final depuis Vertex
- [ ] Résiliation hébergement Vertex
- [ ] Suppression données Vertex (RGPD)
- [ ] Mise à jour documentation interne
- [ ] Informé l'équipe de la nouvelle infrastructure

---

## 🆘 En Cas de Problème

### Rollback d'Urgence
1. [ ] Restauré DNS vers Vertex
2. [ ] Désactivé domaine custom Vercel
3. [ ] Vérifié que l'ancien site fonctionne
4. [ ] Analysé les logs/erreurs
5. [ ] Contacté support si nécessaire

### Contacts Support
- **O2Switch** : https://www.o2switch.fr/support/
- **Vercel** : https://vercel.com/support
- **Supabase** : https://supabase.com/support

---

## 🎉 Migration Terminée !

- [ ] Toutes les phases sont complétées
- [ ] Tous les tests sont validés
- [ ] La documentation est à jour
- [ ] L'équipe est informée
- [ ] Les clients sont satisfaits

**Bravo ! Votre application est maintenant hébergée chez O2Switch ! 🚀**

---

## 📈 Métriques de Succès

- ✅ Temps de chargement < 3 secondes
- ✅ Disponibilité > 99.9%
- ✅ 0 erreur en production
- ✅ Tous les paiements fonctionnent
- ✅ Tous les emails sont envoyés
- ✅ Taux de conversion maintenu ou amélioré

---

**Date de migration** : _______________
**Durée totale** : _______________
**Problèmes rencontrés** : _______________
