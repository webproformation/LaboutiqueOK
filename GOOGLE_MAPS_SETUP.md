# Configuration Google Maps pour Mondial Relay

Le sélecteur de points relais et lockers Mondial Relay utilise Google Maps pour afficher les emplacements sur une carte interactive.

## Obtenir une clé API Google Maps

### 1. Créer un compte Google Cloud Platform

Si vous n'avez pas encore de compte :
- Rendez-vous sur [Google Cloud Console](https://console.cloud.google.com/)
- Connectez-vous avec votre compte Google
- Acceptez les conditions d'utilisation

### 2. Créer un nouveau projet

1. Cliquez sur le sélecteur de projet en haut de la page
2. Cliquez sur "Nouveau projet"
3. Donnez un nom à votre projet (ex: "La Boutique de Morgane")
4. Cliquez sur "Créer"

### 3. Activer l'API Maps JavaScript

1. Dans le menu de navigation, allez dans "APIs & Services" > "Library"
2. Recherchez "Maps JavaScript API"
3. Cliquez sur "Maps JavaScript API"
4. Cliquez sur le bouton "ENABLE"

### 4. Créer une clé API

1. Allez dans "APIs & Services" > "Credentials"
2. Cliquez sur "CREATE CREDENTIALS" > "API key"
3. Votre clé API sera créée et affichée
4. **Important**: Cliquez sur "RESTRICT KEY" pour sécuriser votre clé

### 5. Restreindre la clé API (Recommandé)

Pour éviter une utilisation non autorisée :

1. Dans les restrictions d'application :
   - Sélectionnez "HTTP referrers (websites)"
   - Ajoutez vos domaines autorisés :
     - `http://localhost:3000/*` (pour le développement)
     - `https://votredomaine.com/*` (pour la production)

2. Dans les restrictions d'API :
   - Sélectionnez "Restrict key"
   - Cochez uniquement "Maps JavaScript API"

3. Cliquez sur "SAVE"

## Configuration dans votre projet

Ajoutez la clé API dans votre fichier `.env` :

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=votre_cle_api_ici
```

**Important**: La variable doit commencer par `NEXT_PUBLIC_` pour être accessible côté client.

## Redémarrer le serveur de développement

Après avoir ajouté la clé API, redémarrez votre serveur :

```bash
npm run dev
```

## Fonctionnalités de la carte

Une fois configurée, la carte affichera :
- Tous les points relais ou lockers trouvés
- Des marqueurs rouges pour les points relais (mode 24R)
- Des marqueurs bleus pour les lockers 24/7 (mode 24L)
- Une info-bulle au clic sur chaque marqueur avec les détails du point
- Un zoom automatique pour afficher tous les points trouvés

## Tarification

Google Maps offre un crédit mensuel gratuit de 200$ qui couvre :
- Environ 28 000 chargements de carte par mois
- Pour la plupart des sites e-commerce, cela reste dans la limite gratuite

Pour plus d'informations : [Tarification Google Maps Platform](https://mapsplatform.google.com/pricing/)

## Dépannage

### La carte ne s'affiche pas

1. Vérifiez que la clé API est bien dans le fichier `.env`
2. Vérifiez que la variable commence par `NEXT_PUBLIC_`
3. Vérifiez que le serveur a été redémarré après l'ajout de la clé
4. Vérifiez dans la console du navigateur s'il y a des erreurs

### Erreur "This API project is not authorized"

Vérifiez que :
1. L'API Maps JavaScript est bien activée dans votre projet Google Cloud
2. Les restrictions de la clé API incluent votre domaine
3. La clé API n'est pas expirée

### La carte reste en "Chargement..."

Vérifiez votre connexion internet et que l'URL de l'API Google Maps est accessible.
