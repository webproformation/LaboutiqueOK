# Configuration o2switch pour La Boutique de Morgane

## Prérequis
1. Avoir buildé l'application en local avec `npm run build`
2. Avoir uploadé tous les fichiers sur o2switch via FTP
3. Avoir installé les dépendances avec `npm install` en SSH

## Configuration du formulaire o2switch

### 1. Node.js version
**Choisir : 18.20.8 ou 20.19.4** (recommandé)

### 2. Application mode
**Choisir : Production**

### 3. Application root
**Chemin complet vers votre application**
```
/home/votrecompte/laboutiquedemorgane.com
```
ou
```
/home/votrecompte/public_html
```

Pour trouver le bon chemin :
- Connectez-vous en SSH
- Naviguez dans le dossier de votre application
- Tapez `pwd` pour afficher le chemin complet

### 4. Application URL
**Laisser : laboutiquedemorgane.com**
(ou ajouter https:// si demandé : `https://laboutiquedemorgane.com`)

### 5. Application startup file
**Mettre : server.js**

## Variables d'environnement à ajouter

Cliquez sur **ADD VARIABLE** et ajoutez ces variables une par une :

### Variables obligatoires

```bash
NODE_ENV=production
```

### Supabase (obligatoire)
```bash
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_supabase
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role
```

### WordPress/WooCommerce (obligatoire)
```bash
WORDPRESS_API_URL=https://votre-wordpress.com/wp-json
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxx
```

### Stripe (si utilisé)
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxxxx
STRIPE_SECRET_KEY=sk_xxxxx
```

### PayPal (si utilisé)
```bash
NEXT_PUBLIC_PAYPAL_CLIENT_ID=xxxxx
PAYPAL_CLIENT_SECRET=xxxxx
```

### Brevo (si utilisé)
```bash
BREVO_API_KEY=xxxxx
```

### Mondial Relay (si utilisé)
```bash
MONDIAL_RELAY_SHOP_ID=xxxxx
MONDIAL_RELAY_API_KEY=xxxxx
```

### OneSignal (si utilisé)
```bash
NEXT_PUBLIC_ONESIGNAL_APP_ID=xxxxx
```

### Google Maps (si utilisé)
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=xxxxx
```

## Étapes de déploiement

### 1. En local (avant upload)
```bash
# Installer les dépendances
npm install

# Vérifier qu'il n'y a pas d'erreurs TypeScript
npm run typecheck

# Builder l'application
npm run build
```

### 2. Upload sur o2switch (via FTP)
Transférez tous les fichiers SAUF :
- `node_modules/` (sera installé sur le serveur)
- `.next/` (sera généré sur le serveur)
- `.env.local` (variables à mettre dans l'interface o2switch)

Fichiers importants à transférer :
- `server.js` ✓
- `package.json` ✓
- `package-lock.json` ✓
- `next.config.js` ✓
- Tous les dossiers : `app/`, `components/`, `lib/`, etc.
- Le dossier `.next/` généré par le build

### 3. Sur le serveur (via SSH)
```bash
# Se connecter en SSH
ssh votrecompte@votreserveur.o2switch.net

# Aller dans le dossier de l'application
cd laboutiquedemorgane.com  # ou votre dossier

# Installer les dépendances
npm install --production

# Builder l'application sur le serveur
npm run build
```

### 4. Créer l'application Node.js dans cPanel
- Aller dans cPanel > Setup Node.js App
- Remplir le formulaire avec les informations ci-dessus
- Cliquer sur CREATE

### 5. Démarrer l'application
Une fois l'application créée, o2switch va automatiquement :
- Installer les dépendances si nécessaire
- Démarrer l'application avec `npm start` (qui exécute `node server.js`)

## Vérification

Après le démarrage, visitez `https://laboutiquedemorgane.com`

Si l'application ne démarre pas, consultez les logs :
- Dans cPanel > Setup Node.js App > Votre application > View log

## Troubleshooting

### Erreur "Module not found"
```bash
# Réinstaller les dépendances
npm install --production
```

### Erreur de port
Vérifier que le `server.js` utilise bien `process.env.PORT`

### Erreur 502 Bad Gateway
- Vérifier les logs de l'application
- Vérifier que le build s'est bien déroulé
- Vérifier les variables d'environnement

### Application qui ne démarre pas
1. Vérifier que `server.js` existe
2. Vérifier que `npm run build` a été exécuté
3. Vérifier les permissions des fichiers
4. Vérifier les logs d'erreur

## Commandes utiles en SSH

```bash
# Voir les processus Node.js en cours
ps aux | grep node

# Redémarrer l'application (depuis cPanel)
# ou via SSH si vous avez PM2
pm2 restart laboutiquedemorgane

# Voir les logs en temps réel
tail -f logs/nodejs_app.log
```

## Notes importantes

1. **Le fichier .next/ est nécessaire** : Assurez-vous que le dossier `.next/` généré par `npm run build` est bien uploadé sur le serveur

2. **Variables d'environnement** : Toutes les variables doivent être ajoutées dans l'interface o2switch, pas dans un fichier .env

3. **Redémarrage automatique** : o2switch redémarre automatiquement l'application en cas de crash

4. **Mises à jour** : Pour mettre à jour l'application :
   - Builder en local : `npm run build`
   - Uploader les fichiers modifiés via FTP
   - Redémarrer l'application depuis cPanel

5. **Base de données** : Votre base de données Supabase est accessible via les variables d'environnement configurées
