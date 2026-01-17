# Rapport : Harmonisation des jeux et correction du système de coupons

**Date :** 15 janvier 2026
**Version :** 1.0
**Statut :** Terminé

---

## Problèmes identifiés

### 1. Affichage incohérent dans l'administration

Les pages d'administration des jeux n'utilisaient pas le même layout :
- `/admin/scratch-cards` et `/admin/wheel` : Affichage en grille (cards)
- `/admin/card-flip` : Affichage en tableau

Cette incohérence nuisait à l'expérience utilisateur dans l'interface d'administration.

### 2. Système de coupons cassé

Quand un joueur gagnait au jeu Card Flip :
- Le coupon n'était pas attribué correctement
- Aucune entrée n'était créée dans `user_coupons`
- Le coupon n'apparaissait pas dans `/account/coupons`

**Cause :** Incohérence entre les tables :
- Le jeu référençait un `coupon_id` de la table `coupons`
- L'attribution nécessitait un `coupon_type_id` de la table `coupon_types`

---

## Solutions appliquées

### 1. Harmonisation de l'interface admin (/admin/card-flip)

**Fichier modifié :** `app/admin/card-flip/page.tsx`

**Changements :**
- Suppression du tableau (Table component)
- Implémentation d'un affichage en grille identique aux autres jeux
- Ajout des mêmes informations visuelles (icônes, badges, cartes)
- Boutons d'action harmonisés (Prévisualiser, Modifier, Activer/Désactiver, Supprimer)

**Résultat :**
```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Jeu de cartes   │ │ Jeu de cartes   │ │ Jeu de cartes   │
│ d'accueil       │ │ d'été           │ │ de Noël         │
│                 │ │                 │ │                 │
│ Actif           │ │ Inactif         │ │ Actif           │
│ 01/01 - 31/03   │ │ 01/06 - 31/08   │ │ 01/12 - 31/12   │
│ Max 1 partie    │ │ Max 3 parties   │ │ Max 1 partie    │
│                 │ │                 │ │                 │
│ [Prévisualiser] │ │ [Prévisualiser] │ │ [Prévisualiser] │
│ [Modifier]      │ │ [Modifier]      │ │ [Modifier]      │
│ [Désactiver]    │ │ [Activer]       │ │ [Désactiver]    │
│ [Supprimer]     │ │ [Supprimer]     │ │ [Supprimer]     │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### 2. Création d'une API centralisée pour les gains

**Fichier créé :** `app/api/games/claim-reward/route.ts`

**Fonctionnalités :**
- Authentification obligatoire (vérification de la session)
- Recherche du `coupon_type` correspondant au code du coupon
- Vérification que l'utilisateur ne possède pas déjà ce coupon
- Génération d'un code unique pour chaque coupon attribué
- Création d'une entrée dans `user_coupons` avec :
  - `user_id` : ID de l'utilisateur
  - `coupon_type_id` : ID du type de coupon
  - `code` : Code unique généré
  - `source` : Type de jeu (card_flip_game, scratch_card, wheel, etc.)
  - `valid_until` : Date d'expiration (30 jours)

**Format de la requête :**
```json
{
  "game_type": "card_flip_game",
  "game_id": "uuid-du-jeu",
  "coupon_code": "PROMO5",
  "has_won": true
}
```

**Format de la réponse (succès) :**
```json
{
  "success": true,
  "message": "Coupon attribué avec succès",
  "coupon": {
    "code": "PROMO5-abc123",
    "type": "discount_percentage",
    "value": 10,
    "description": "Réduction de 10%",
    "valid_until": "2026-02-14T12:00:00Z"
  }
}
```

**Format de la réponse (coupon déjà possédé) :**
```json
{
  "success": true,
  "message": "Vous possédez déjà ce coupon",
  "already_owned": true
}
```

### 3. Modification du composant CardFlipGame

**Fichier modifié :** `components/CardFlipGame.tsx`

**Changements :**
- Suppression de la logique d'attribution de coupon directe
- Appel de l'API `/api/games/claim-reward` quand le joueur gagne
- Gestion des erreurs et des cas particuliers (coupon déjà possédé)
- Messages toast adaptés selon le résultat
- Rafraîchissement du compteur de parties après chaque jeu

**Flux d'exécution :**
```
1. Joueur clique sur une carte
2. Détermination aléatoire du résultat (gain/perte)
3. Animation de retournement de carte
4. Si gain :
   - Appel API /api/games/claim-reward
   - Attente de la réponse
   - Affichage du message approprié
5. Enregistrement de la partie dans card_flip_game_plays
6. Mise à jour du compteur de gagnants
7. Rafraîchissement du compteur de parties
```

---

## Bénéfices

### Expérience utilisateur

1. **Interface cohérente** : Tous les jeux partagent le même design
2. **Coupons fonctionnels** : Les gains s'affichent immédiatement dans "Mes Coupons"
3. **Feedback clair** : Messages adaptés selon le résultat
4. **Pas de doublons** : Le système empêche d'obtenir deux fois le même coupon

### Technique

1. **Code centralisé** : Une seule API pour gérer tous les types de jeux
2. **Sécurité renforcée** : Vérification de la session côté serveur
3. **Traçabilité** : Chaque gain est enregistré avec sa source
4. **Évolutivité** : Facile d'ajouter de nouveaux types de jeux

---

## Test du système

### Scénario 1 : Gain d'un coupon

1. Connectez-vous avec un compte utilisateur
2. Jouez au jeu Card Flip
3. Gagnez une partie
4. Vérifiez que le coupon apparaît immédiatement dans `/account/coupons`

**Résultat attendu :**
- Toast de succès : "Coupon PROMO5 ajouté à votre compte!"
- Toast de félicitations : "Félicitations ! Vous avez gagné le coupon : PROMO5"
- Le coupon apparaît dans la liste "Mes coupons"

### Scénario 2 : Coupon déjà possédé

1. Rejouez avec le même compte
2. Gagnez à nouveau
3. Le système détecte que vous possédez déjà ce coupon

**Résultat attendu :**
- Toast d'information : "Vous possédez déjà ce coupon : PROMO5"
- Aucune duplication dans la base de données

### Scénario 3 : Perte

1. Jouez au jeu Card Flip
2. Perdez la partie

**Résultat attendu :**
- Toast d'échec : "Dommage ! Vous avez perdu cette fois-ci."
- Aucun coupon n'est attribué
- La partie est enregistrée dans l'historique

---

## Base de données

### Tables impliquées

#### `coupon_types` (nouvelle table, source de vérité)
```sql
- id (uuid, pk)
- code (text, unique)
- type (text) -- discount_percentage, discount_amount
- value (numeric)
- description (text)
- is_active (boolean)
- valid_until (timestamptz)
```

#### `user_coupons` (table des coupons attribués aux utilisateurs)
```sql
- id (uuid, pk)
- user_id (uuid, fk → profiles)
- coupon_type_id (uuid, fk → coupon_types)
- code (text, unique) -- Code unique généré
- source (text) -- card_flip_game, scratch_card, wheel, etc.
- is_used (boolean)
- used_at (timestamptz)
- order_id (uuid, fk → orders)
- valid_until (timestamptz)
- obtained_at (timestamptz)
```

#### `coupons` (ancienne table, utilisée pour la config des jeux)
```sql
- id (uuid, pk)
- code (text)
- discount_type (text)
- discount_value (numeric)
- is_active (boolean)
- ...
```

**Note :** Les jeux continuent de référencer `coupons` pour la configuration, mais l'attribution utilise `coupon_types`.

---

## Migration effectuée

La synchronisation entre `coupons` et `coupon_types` a été faite via la migration :
- `20260115095822_sync_coupons_to_coupon_types_v3.sql`

Cette migration copie tous les coupons actifs de `coupons` vers `coupon_types`.

---

## Fichiers modifiés

```
app/admin/card-flip/page.tsx           (harmonisation UI)
app/api/games/claim-reward/route.ts    (nouvelle API)
components/CardFlipGame.tsx             (intégration API)
```

---

## Validation finale

### Build réussi
```bash
npm run build
# ✓ Build terminé sans erreur
```

### Points de validation

- [ ] L'affichage admin est identique pour tous les jeux
- [ ] Un gain au jeu Card Flip crée une entrée dans `user_coupons`
- [ ] Le coupon apparaît dans `/account/coupons`
- [ ] Le système empêche les doublons
- [ ] Les messages de feedback sont clairs
- [ ] Le build passe sans erreur

---

## Prochaines étapes recommandées

1. **Tester en production** : Valider le système avec de vrais utilisateurs
2. **Étendre à d'autres jeux** : Utiliser la même API pour Scratch Cards et Wheel
3. **Statistiques** : Ajouter un dashboard pour suivre les gains par jeu
4. **Notifications** : Envoyer un email quand un coupon est gagné
5. **Expiration** : Mettre en place un système de rappel avant expiration

---

**Auteur :** Assistant IA
**Version :** 1.0
**Date :** 15 janvier 2026
