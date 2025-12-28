# Guide de la Barre de Progression Cadeau Surprise

## Vue d'ensemble

La barre de progression cadeau surprise permet d'offrir automatiquement un cadeau aux clientes qui atteignent un certain montant d'achat (par défaut 69€). Le système est conçu pour être cumulatif et intelligent, prenant en compte à la fois le panier actuel et les commandes précédentes liées au colis ouvert.

## Architecture

### Tables Supabase

#### `gift_thresholds`
Gère les paliers de cadeaux configurables :
- `threshold_amount` : Montant du palier (ex: 69.00€)
- `gift_name` : Nom du cadeau
- `gift_description` : Description du cadeau
- `is_active` : Actif/Inactif
- `display_message_before` : Message avant le palier
- `display_message_after` : Message après le palier

#### `order_gift_tracking`
Track le statut des cadeaux par utilisateur :
- `user_id` : Identifiant utilisateur
- `delivery_batch_id` : Lié au colis ouvert (nullable)
- `cumulative_amount` : Montant cumulé
- `gift_unlocked` : Cadeau débloqué (boolean)
- `gift_included_in_order` : Cadeau inclus dans une commande (boolean)

#### Colonnes ajoutées à `orders`
- `gift_included` : Boolean indiquant si un cadeau est inclus
- `gift_description` : Description du cadeau inclus

### Fonctions SQL

#### `calculate_cumulative_gift_amount()`
Calcule le montant cumulatif pour un utilisateur :
- Somme des commandes payées rattachées au colis ouvert
- Ajoute le montant du panier actuel

#### `check_gift_unlock()`
Vérifie si un cadeau doit être débloqué :
- Compare le montant cumulatif au palier
- Retourne le statut et les messages appropriés

## Fonctionnalités

### 1. Calcul Cumulatif Intelligent

Le système calcule automatiquement :
- **Colis Ouvert** : Somme des commandes payées + panier actuel
- **Envoi Immédiat** : Uniquement le montant du panier

### 2. Affichage Dynamique

La barre de progression s'affiche :
- Dans le panier (/cart) - Version complète
- Dans le compte client - Version compacte (à implémenter)

**Avant le palier :**
```
Plus que X.XX€ pour recevoir un cadeau surprise ! 🎁
```

**Après le palier :**
```
Félicitations ! Votre cadeau surprise est débloqué ! ✨
```

### 3. Marquage Automatique

Une fois le palier atteint :
- Le champ `gift_included` est marqué à `true` dans la commande
- Le champ `gift_description` contient la description du cadeau
- Visible dans le back-office pour la préparation

### 4. Un Seul Cadeau par Colis

Le système garantit qu'un seul cadeau est offert par colis, même si plusieurs commandes sont cumulées.

## Composants

### `GiftProgressBar`

Composant réutilisable pour afficher la progression.

**Props :**
- `cartTotal` : Montant du panier actuel
- `deliveryBatchId` : ID du colis ouvert (nullable)
- `compact` : Affichage compact (boolean)

**Utilisation :**
```tsx
import GiftProgressBar from '@/components/GiftProgressBar';

<GiftProgressBar
  cartTotal={cartTotal}
  deliveryBatchId={deliveryBatchId}
  compact={false}
/>
```

## Configuration Admin

### Page `/admin/gift-thresholds`

Permet de :
- Créer plusieurs paliers de cadeaux
- Modifier le montant du palier
- Personnaliser les messages avant/après
- Activer/désactiver un palier
- Supprimer un palier

**Seul le palier actif avec le montant le plus bas est utilisé.**

### Personnalisation des Messages

**Message avant le palier :**
Utilisez `{amount}` pour afficher le montant restant :
```
Plus que {amount}€ pour recevoir un cadeau surprise ! 🎁
```

**Message après le palier :**
Message de félicitations :
```
Félicitations ! Votre cadeau surprise est débloqué ! ✨
```

## Intégration dans le Checkout

Le système s'intègre automatiquement dans le processus de commande :

1. Lors de la création de la commande, le montant cumulatif est calculé
2. Si le palier est atteint, les champs `gift_included` et `gift_description` sont remplis
3. Ces informations sont transmises à WooCommerce pour le bon de préparation

## Cas d'Usage

### Scénario 1 : Colis Ouvert
Cliente avec un colis ouvert :
- Commande 1 : 30€ (payée)
- Commande 2 : 25€ (payée)
- Panier actuel : 20€

**Total cumulatif : 75€**
Cadeau débloqué ! (palier à 69€)

### Scénario 2 : Envoi Immédiat
Cliente sans colis ouvert :
- Panier actuel : 75€

**Total cumulatif : 75€**
Cadeau débloqué ! (palier à 69€)

### Scénario 3 : Progression
Cliente avec un colis ouvert :
- Commande 1 : 40€ (payée)
- Panier actuel : 20€

**Total cumulatif : 60€**
Message : "Plus que 9€ pour recevoir un cadeau surprise ! 🎁"

## Sécurité

- RLS activé sur toutes les tables
- Les utilisateurs ne peuvent voir que leurs propres données
- Les admins ont accès complet
- Les calculs sont effectués côté serveur

## Performance

- Fonctions SQL optimisées pour les calculs
- Index sur les colonnes clés
- Cache des résultats dans le composant

## Extensions Futures

- Support de plusieurs paliers actifs simultanément
- Historique des cadeaux reçus
- Notifications push lors du déblocage
- Personnalisation par segment de clientèle
- Statistiques admin sur les cadeaux distribués
