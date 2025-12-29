# Guide du Nouveau Système de Fidélité en Euros

## Vue d'ensemble

Le nouveau système de fidélité est basé sur des euros au lieu de points, avec un système de paliers qui multiplie les récompenses.

## Paliers et Multiplicateurs

### Palier 1 (0 € - 5 €)
- Multiplicateur : **x1**
- Niveau de départ pour tous les nouveaux clients

### Palier 2 (5 € - 15 €)
- Multiplicateur : **x2**
- Toutes les récompenses sont doublées

### Palier 3 (15 € - 30 €)
- Multiplicateur : **x3**
- Toutes les récompenses sont triplées

## Comment Gagner des Euros

### 1. Connexion Quotidienne (0,10 €)
- **Montant de base :** 0,10 €
- **Avec multiplicateur :** 0,10 € à 0,30 € selon le palier
- **Automatique :** Le bonus est attribué automatiquement à la première connexion de la journée
- **Message :** "Coucou, ravie de te revoir ! Ta cagnotte vient de grimper de X €."

### 2. Présence en Live (0,20 €)
- **Montant de base :** 0,20 €
- **Avec multiplicateur :** 0,20 € à 0,60 € selon le palier
- **Condition :** Rester au moins 10 minutes sur un live
- **Automatique :** Le bonus est attribué automatiquement après 10 minutes
- **Message :** "Bravo, grâce à ta présence en live, tu viens de faire grimper ta cagnotte de X €."

### 3. Récompense Commande (2% du total)
- **Montant de base :** 2% du montant de la commande (hors frais de port)
- **Avec multiplicateur :** 2% à 6% selon le palier
- **Automatique :** Ajouté lors de la validation de la commande
- **Message :** "Félicitations, grâce à ta commande, tu viens de faire grimper ta cagnotte de X € ! Merci pour ta fidélité."

### 4. Chasse aux Diamants (0,10 € par diamant)
- **Montant fixe :** 0,10 € par diamant trouvé
- **Pas de multiplicateur :** Montant fixe
- **Fréquence :** 3 diamants cachés par semaine sur le site
- **Unique :** Chaque utilisateur peut trouver chaque diamant une seule fois
- **Message :** "Super, tu as trouvé un diamant qui te rapporte 0,10 € à ta cagnotte."

### 5. Avis Produit (0,20 €)
- **Montant fixe :** 0,20 € par avis validé
- **Condition :** Avoir reçu une commande
- **Message :** Inclus dans le système d'avis existant

## Coupons de Promotion Croisée

### Coupon Live → Site (2 € minimum 10 €)
- **Déclencheur :** Commande passée et payée en live
- **Montant :** 2 € de réduction
- **Minimum d'achat :** 10 €
- **Utilisation :** Uniquement sur le site web (hors live et replay)
- **Validité :** 4 jours
- **Code :** LIVE2SITE-XXXXXXXX

### Coupon Site → Live (2 € minimum 10 €)
- **Déclencheur :** Commande passée et payée sur le site (hors live/replay)
- **Montant :** 2 € de réduction
- **Minimum d'achat :** 10 €
- **Utilisation :** Uniquement en live ou replay
- **Validité :** 4 jours
- **Code :** SITE2LIVE-XXXXXXXX

## Interface Utilisateur

### Barre de Progression
- **Emplacement :** En haut de chaque page (sous le header)
- **Informations affichées :**
  - Solde actuel de la cagnotte
  - Palier actuel et multiplicateur
  - Progression vers le palier suivant
  - Lien vers les détails

### Page Cagnotte (/account/cagnotte)
- **Solde total** avec palier et multiplicateur
- **Explication des paliers** avec progression visuelle
- **Comment gagner** : Liste de toutes les façons de gagner
- **Historique des gains** : Toutes les transactions avec détails
- **Bouton "Bonus du jour"** : Pour réclamer manuellement le bonus quotidien

## Interface Admin

### Gestion des Diamants (/admin/hidden-diamonds)
- **Créer de nouveaux diamants** avec :
  - Nom du diamant
  - URL de la page où il se trouve
  - Sélecteur CSS pour le positionnement
  - Montant de la récompense
  - Date de début et de fin (période hebdomadaire)
  - Statut actif/inactif
- **Modifier les diamants existants**
- **Activer/Désactiver** les diamants
- **Supprimer** les diamants

### Visualisation des Coupons
- Les coupons de promotion croisée sont visibles dans la table `cross_promotion_coupons`
- Accessibles via l'interface admin

## Implémentation Technique

### Tables de Base de Données

1. **loyalty_transactions** : Historique de tous les gains
2. **daily_connection_rewards** : Suivi des bonus quotidiens
3. **live_presence_rewards** : Suivi des bonus de présence en live
4. **hidden_diamonds** : Configuration des diamants cachés
5. **diamond_finds** : Suivi des diamants trouvés par utilisateur
6. **cross_promotion_coupons** : Coupons de promotion croisée

### Fonctions SQL Disponibles

- `get_loyalty_balance(user_id)` : Obtenir le solde d'un utilisateur
- `get_loyalty_tier(user_id)` : Obtenir le palier et les infos d'un utilisateur
- `award_daily_connection_bonus(user_id)` : Attribuer le bonus quotidien
- `award_live_presence_bonus(user_id, stream_id, duration)` : Attribuer le bonus live
- `award_order_loyalty_reward(user_id, order_id, total)` : Attribuer la récompense commande
- `award_diamond_find_bonus(user_id, diamond_id)` : Attribuer le bonus diamant
- `create_cross_promotion_coupon(user_id, order_id, source)` : Créer un coupon croisé

### Composants React

- `EuroLoyaltyProgressBar` : Barre de progression en haut de page
- `DailyConnectionReward` : Attribution automatique du bonus quotidien
- `LivePresenceTracker` : Suivi du temps de présence en live
- `HiddenDiamond` : Composant diamant caché à intégrer dans les pages

## Email BREVO (à implémenter)

### Email d'invitation après commande live
**Objet :** "Une petite surprise t'attend sur le site ! 🎁"
**Contenu :** Notification du coupon LIVE2SITE avec lien direct

### Email d'invitation après commande site
**Objet :** "Rejoins-nous en live pour ta prochaine commande ! ✨"
**Contenu :** Notification du coupon SITE2LIVE avec date du prochain live

### Configuration BREVO
1. Créer les templates d'email dans BREVO
2. Configurer la clé API BREVO dans les variables d'environnement
3. Créer une edge function pour l'envoi automatique
4. Configurer les triggers après validation de commande

## Prochaines Étapes

### À faire immédiatement
1. ✅ Tester le système de gains quotidiens
2. ✅ Créer 3 diamants cachés pour la semaine
3. ✅ Vérifier que les coupons croisés se créent bien après commande

### À faire avec BREVO
1. Configurer la clé API BREVO
2. Créer les templates d'emails
3. Implémenter l'envoi automatique des emails
4. Tester le flux complet

## Notes Importantes

- Les gains avec multiplicateur affichent le calcul : "0,10 € × 2 = 0,20 €"
- Les diamants sont visibles uniquement pour les utilisateurs connectés
- Un utilisateur ne peut trouver qu'une seule fois chaque diamant
- Les coupons croisés expirent après 4 jours
- Le bonus quotidien ne peut être réclamé qu'une fois par jour
- Le bonus live ne peut être réclamé qu'une fois par stream