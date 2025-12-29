# Guide du Système de Live Streaming

## Vue d'ensemble

Votre application dispose maintenant d'un système complet de live streaming avec Next.js et Supabase, supportant plusieurs plateformes de streaming et offrant une synchronisation en temps réel des produits.

## Architecture

```
┌─────────────────────────────────────────────────┐
│        OBS Studio / Logiciel de Streaming       │
│              (Votre source vidéo)                │
└──────────────────┬──────────────────────────────┘
                   │ RTMP Stream
                   ▼
┌─────────────────────────────────────────────────┐
│         Plateforme de Streaming (Choix)         │
│  ┌──────────┬──────────┬──────────┬──────────┐ │
│  │   Mux    │  AWS IVS │ Restream │  nginx   │ │
│  │ (facile) │  (pro)   │ (multi)  │ (gratuit)│ │
│  └──────────┴──────────┴──────────┴──────────┘ │
└──────────────────┬──────────────────────────────┘
                   │ HLS/Video URL
                   ▼
┌─────────────────────────────────────────────────┐
│           Votre Application Next.js              │
│  • Player vidéo en temps réel                   │
│  • Synchronisation produits                     │
│  • Chat en direct                               │
│  • Analytics spectateurs                        │
└─────────────────────────────────────────────────┘
```

## Fonctionnalités Principales

### 1. Support Multi-Plateformes
- **Mux** (Recommandé) : Simple, fiable, excellent pour débuter
- **AWS IVS** : Solution professionnelle d'Amazon
- **Restream** : Diffusion simultanée sur plusieurs plateformes
- **nginx-rtmp** : Solution auto-hébergée gratuite
- **Custom RTMP** : Votre propre solution personnalisée

### 2. Gestion des Lives
- Création et planification de lives
- Démarrage/Arrêt en un clic
- Gestion des clés de streaming
- Analytics en temps réel (spectateurs actuels, pic, vues totales)

### 3. Produits en Temps Réel
- Ajout/Retrait de produits pendant le live
- Mise en avant d'un produit spécifique
- Synchronisation instantanée avec tous les spectateurs
- Ajout au panier directement depuis le live

### 4. Chat en Direct
- Messages en temps réel
- Affichage du nom des utilisateurs
- Modération (épinglage, suppression)
- Statistiques de participation

## Configuration

### Étape 1 : Accéder à l'Admin

1. Connectez-vous en tant qu'administrateur
2. Allez dans **Admin → Live Streams**

### Étape 2 : Configurer la Plateforme de Streaming

1. Cliquez sur l'onglet **Configuration**
2. Choisissez votre plateforme de streaming préférée
3. Entrez les clés API selon la plateforme choisie

#### Option A : Utiliser Mux (Recommandé pour débuter)

1. Créez un compte sur [Mux.com](https://mux.com)
2. Générez vos clés API (Access Token ID et Secret Key)
3. Entrez-les dans la configuration
4. Mux générera automatiquement les URLs de streaming et de lecture

#### Option B : Utiliser nginx-rtmp (Gratuit, auto-hébergé)

1. Installez nginx avec le module RTMP sur votre serveur
2. Configuration nginx exemple :

```nginx
rtmp {
    server {
        listen 1935;
        chunk_size 4096;

        application live {
            live on;
            record off;

            # HLS configuration
            hls on;
            hls_path /tmp/hls;
            hls_fragment 3;
            hls_playlist_length 60;
        }
    }
}

http {
    server {
        listen 8080;

        location /hls {
            types {
                application/vnd.apple.mpegurl m3u8;
                video/mp2t ts;
            }
            root /tmp;
            add_header Cache-Control no-cache;
            add_header Access-Control-Allow-Origin *;
        }
    }
}
```

3. Dans la configuration de l'app :
   - URL RTMP : `rtmp://votre-serveur.com/live`
   - App Name : `live`

#### Option C : Utiliser Restream (Multidiffusion)

1. Créez un compte sur [Restream.io](https://restream.io)
2. Récupérez votre clé de streaming
3. Configurez les destinations (YouTube, Facebook, etc.)
4. Entrez la clé dans la configuration

### Étape 3 : Créer un Live

1. Cliquez sur **Nouveau Live**
2. Remplissez les informations :
   - Titre du live
   - Description
   - Date et heure prévue
3. Cliquez sur **Créer le Live**
4. Une **clé de streaming** unique sera générée automatiquement

### Étape 4 : Configurer OBS Studio

1. Téléchargez [OBS Studio](https://obsproject.com)
2. Allez dans **Paramètres → Stream**
3. Service : **Custom**
4. Serveur : URL fournie par votre plateforme
   - Mux : `rtmps://global-live.mux.com:443/app`
   - nginx-rtmp : `rtmp://votre-serveur.com/live`
   - Restream : `rtmps://live.restream.io/live`
5. Clé de streaming : Copiez la clé depuis l'interface admin
6. Cliquez sur **OK**

### Étape 5 : Lancer le Live

#### Dans l'Interface Admin

1. Allez dans **Admin → Live Streams → [Votre Live] → Control**
2. Cliquez sur **Démarrer le Live**

#### Dans OBS

1. Cliquez sur **Démarrer le Streaming**
2. Le flux vidéo apparaîtra automatiquement sur votre site

### Étape 6 : Gérer les Produits Pendant le Live

1. Dans la page de contrôle du live :
2. Cliquez sur **Ajouter** dans la section "Produits du live"
3. Recherchez un produit WooCommerce
4. Cliquez sur **Ajouter** pour l'ajouter à la liste
5. Cliquez sur l'icône ⭐ pour mettre un produit en vedette
6. Le produit apparaîtra instantanément chez tous les spectateurs

## Expérience Spectateur

### Page Live (/live)

Les spectateurs verront :
- Le flux vidéo en direct
- Le badge "LIVE" animé
- Le nombre de spectateurs actuels
- Le produit mis en vedette avec un bouton "Ajouter au panier"
- La liste de tous les produits du live
- Le chat en temps réel (si authentifié)

### Interaction

- **Regarder** : Automatiquement comptabilisé dans les analytics
- **Chatter** : Les utilisateurs connectés peuvent envoyer des messages
- **Acheter** : Ajout au panier directement depuis le live
- **Temps réel** : Toutes les mises à jour sont instantanées via Supabase Realtime

## Base de Données Supabase

### Tables Créées

1. **live_stream_settings** : Configuration globale des plateformes
2. **live_streams** : Sessions de live individuelles
3. **live_stream_products** : Produits affichés pendant les lives
4. **live_stream_viewers** : Tracking des spectateurs et analytics
5. **live_stream_chat_messages** : Messages du chat

### Sécurité (RLS)

Toutes les tables ont des politiques de sécurité strictes :
- Les spectateurs peuvent voir les lives actifs
- Les utilisateurs authentifiés peuvent chatter
- Les admins ont accès complet à la gestion
- Les analytics sont protégées

## API Routes

### Streams
- `GET /api/live/streams` - Liste des lives
- `POST /api/live/streams` - Créer un live
- `GET /api/live/streams/[id]` - Détails d'un live
- `PUT /api/live/streams/[id]` - Mettre à jour un live
- `DELETE /api/live/streams/[id]` - Supprimer un live
- `POST /api/live/streams/[id]/start` - Démarrer un live
- `POST /api/live/streams/[id]/end` - Terminer un live

### Produits
- `GET /api/live/streams/[id]/products` - Liste des produits d'un live
- `POST /api/live/streams/[id]/products` - Ajouter/Mettre à jour un produit

### Viewers & Chat
- `POST /api/live/viewers` - Enregistrer un spectateur
- `PUT /api/live/viewers` - Spectateur quitte
- `GET /api/live/chat` - Récupérer les messages
- `POST /api/live/chat` - Envoyer un message

### Configuration
- `GET /api/live/settings` - Récupérer la configuration
- `PUT /api/live/settings` - Mettre à jour la configuration

## Analytics

### En Direct
- **Spectateurs actuels** : Nombre de personnes regardant maintenant
- **Pic de spectateurs** : Maximum de spectateurs simultanés
- **Vues totales** : Nombre total de connexions

### Produits
- Clics sur les produits
- Ajouts au panier
- Revenus générés (future fonctionnalité)

### Chat
- Messages envoyés
- Engagement des utilisateurs

## Dépannage

### Le stream ne démarre pas
1. Vérifiez la clé de streaming dans OBS
2. Vérifiez l'URL du serveur RTMP
3. Testez votre connexion internet (upload minimum 5 Mbps)
4. Vérifiez les logs de votre plateforme de streaming

### Les produits ne s'affichent pas
1. Vérifiez que le produit a bien été ajouté dans l'interface de contrôle
2. Actualisez la page du spectateur
3. Vérifiez les permissions Supabase RLS

### Le chat ne fonctionne pas
1. L'utilisateur doit être connecté pour chatter
2. Vérifiez que le chat est activé dans les paramètres
3. Vérifiez les permissions Supabase pour les messages

## Recommandations

### Qualité du Stream
- **Résolution** : 1920x1080 (1080p) ou 1280x720 (720p)
- **Bitrate** : 4500-6000 kbps pour 1080p, 2500-4000 kbps pour 720p
- **Framerate** : 30 fps (ou 60 fps si bonne connexion)
- **Encodeur** : x264, preset "veryfast" ou "fast"

### Préparation du Live
1. Testez votre setup 30 minutes avant
2. Préparez vos produits à l'avance
3. Ayez une liste de points à couvrir
4. Préparez des visuels/images de qualité

### Engagement
1. Répondez aux messages du chat
2. Changez régulièrement le produit en vedette
3. Mentionnez les offres spéciales
4. Encouragez les questions

## Prochaines Étapes

### Améliorations Possibles
1. Enregistrement automatique des lives
2. Replay des lives terminés
3. Alertes de début de live (email, notifications)
4. Statistiques avancées et graphiques
5. Intégration avec les notifications push
6. Sondages en direct
7. Partage sur réseaux sociaux
8. Promo codes exclusifs pendant le live

## Support

Pour toute question ou problème :
1. Consultez les logs dans la console du navigateur (F12)
2. Vérifiez les erreurs Supabase dans l'interface admin
3. Testez d'abord avec une plateforme simple comme Mux
4. Assurez-vous que toutes les variables d'environnement sont configurées

---

**Bon streaming ! 🎥**
