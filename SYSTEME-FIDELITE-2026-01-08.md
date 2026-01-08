# SYSTÈME DE FIDÉLITÉ COMPLET - Projet qcqbtmv

**Date**: 2026-01-08
**Projet**: qcqbtmvbvipsxwjlgjvk
**Mission**: Implémentation système de fidélité complet avec gamification

---

## BASE DE DONNÉES CRÉÉE

### Tables Créées

1. **loyalty_wallet** : Cagnotte en euros
   - balance (numeric) : Solde en €
   - current_level (1-3) : Palier actuel
   - total_earned/total_spent : Historique
   - last_daily_visit : Dernière connexion récompensée

2. **loyalty_transactions_v2** : Historique gains/dépenses
   - amount (numeric) : Montant en €
   - type : daily_visit, live_attendance, purchase, diamond, review, referral, spent
   - multiplier (1/2/3) : Selon le palier

3. **daily_visits** : Tracker connexions quotidiennes
   - 0.10€ par jour (multiplié selon palier)
   - Limite 1x par jour

4. **live_attendance** : Présence en live
   - 0.20€ après 10 minutes (multiplié selon palier)
   - Tracking durée présence

5. **hidden_diamonds** : Diamants cachés (3/semaine)
   - Liés à des produits
   - 0.10€ par diamant trouvé
   - Expiration hebdomadaire

6. **diamond_findings** : Diamants trouvés par utilisateur
   - Unique par user/diamond
   - Tracking récompenses

7. **referral_codes** : Codes parrainage
   - 1 code unique par utilisateur
   - Tracking utilisations

8. **referral_rewards** : Récompenses parrainage
   - 5€ parrain + 5€ parrainé
   - Unique par parrainé

9. **cross_platform_coupons** : Coupons site/live
   - 2€ pour 10€ min
   - Croisés (site→live, live→site)
   - Valable 4 jours

10. **review_rewards** : Récompenses avis
    - 0.20€ par avis approuvé
    - Lié à order_id

11. **review_email_queue** : Emails automatiques J+7
    - Envoi auto 7 jours après commande
    - Template personnalisé

---

## SYSTÈME DE PALIERS

### Palier 1 (0-5€)
- Gains normaux (x1)
- 0.10€ / connexion
- 0.20€ / live (10min)
- 2% / achat
- 0.10€ / diamant

### Palier 2 (5-15€)
- Gains DOUBLÉS (x2)
- 0.20€ / connexion
- 0.40€ / live
- 4% / achat
- 0.20€ / diamant

### Palier 3 (15-30€)
- Gains TRIPLÉS (x3)
- 0.30€ / connexion
- 0.60€ / live
- 6% / achat
- 0.30€ / diamant

**Fonction** : `get_loyalty_multiplier(user_id)` calcule le multiplicateur

---

## MESSAGES PERSONNALISÉS

### Connexion Quotidienne
"Coucou, ravie de te revoir ! Ta cagnotte vient de grimper de X €."

### Présence Live (10min+)
"Bravo, grâce à ta présence en live, tu viens de faire grimper ta cagnotte de X €."

### Achat Validé
"Félicitations, grâce à ta commande, tu viens de faire grimper ta cagnotte de X € ! Merci pour ta fidélité."

### Diamant Trouvé
"Super, tu as trouvé un diamant qui te rapporte X € à ta cagnotte."
+ Pop-up avec confettis

### Parrainage
**Parrain** : "Bravo ! Ton amie a utilisé ton code, tu gagnes 5€ !"
**Parrainé** : "Bienvenue ! Grâce au parrainage, tu commences avec 5€ !"

### Avis Client
"Merci pour ton avis ! Ta cagnotte vient de grimper de 0.20€."

---

## COUPONS CROISÉS

### Site → Live/Replay
- Client achète sur le site
- Reçoit coupon 2€ pour 10€ min
- Utilisable uniquement en live/replay
- Valable 4 jours

### Live/Replay → Site
- Client achète en live/replay
- Reçoit coupon 2€ pour 10€ min
- Utilisable uniquement sur le site
- Valable 4 jours

**Règles** :
- NON cumulables entre eux
- NON cumulables avec cagnotte fidélité
- Code unique auto-généré

---

## EMAIL AUTOMATIQUE J+7

### Déclencheur
7 jours après commande validée

### Template
```
Objet : Déjà reçues ? Partage ton bonheur ! ✨

"Coucou [Prénom],
Tes pépites de la semaine sont arrivées ! Je suis impatiente de savoir si l'ouverture du colis a été un moment magique pour toi.

Puisque nos collections s'envolent à la vitesse de l'éclair, ton avis sur la qualité et mon service est le plus beau cadeau que tu puisses me faire. Cela aide les nouvelles amies à rejoindre l'aventure en toute confiance !

Dépose ton petit mot doux ici et hop... ta cagnotte grimpe de quelques euros de complicité ! 🎁"

À bientôt sur le Live,
L'équipe Morgane 🥰
```

---

## FONCTIONNALITÉS FRONTEND À IMPLÉMENTER

### Page d'Accueil
1. **Pépites du Moment**
   - Ajouter icône pépite (💎)
   - Texte : "Ces pièces que vous adorez... et que nous aussi !"

2. **Section Vidéos Courtes** (nouvelle)
   - Titre : "Plonge dans l'univers de Morgane"
   - Texte : "Inspiration, conseils et coulisses en vidéo"
   - Entre pépites et avis clients
   - Vidéos replay/courtes

### Compte Client (/account)
1. **Message Bienvenue**
   - "Bonjour Sophie, ravie de te revoir"
   - Personnalisé avec prénom

2. **Photo de Profil**
   - Upload image
   - Affichage dans compte + lives
   - Améliore convivialité

3. **Page Parrainage** (/account/referral)
   - Mon code parrainage unique
   - Nombre d'utilisations
   - Total € gagnés
   - Liste des parrainages réussis

4. **Page Cagnotte** (/account/wallet)
   - Solde actuel en €
   - Palier actuel (1/2/3)
   - Barre de progression
   - Historique transactions
   - Utiliser cagnotte au checkout

### Checkout
- Appliquer code parrainage (nouveau client)
- Utiliser cagnotte fidélité
- Appliquer coupon (non cumulable)
- Génération auto coupon croisé après paiement

### Livre d'Or (/livre-dor)
- Liste de tous les avis approuvés
- Formulaire pour laisser avis
- Photo optionnelle
- Récompense 0.20€ après approbation

### Chasse aux Diamants
- 3 diamants cachés par semaine
- Sur produits nouveautés
- Icône 💎 cliquable
- Pop-up + confettis à la découverte
- +0.10€ (multiplié selon palier)

---

## STRUCTURE TECHNIQUE

### Hooks Personnalisés

```typescript
// hooks/use-loyalty-wallet.ts
- useWallet() : balance, level, multiplier
- addTransaction(type, amount)
- spendBalance(amount)

// hooks/use-daily-visit.ts
- checkAndRewardDailyVisit()

// hooks/use-referral.ts
- useReferralCode()
- applyReferralCode(code)
- getReferralStats()

// hooks/use-diamonds.ts
- getActiveDiamonds()
- findDiamond(diamondId)
- getUserFindings()
```

### Composants

```typescript
// components/LoyaltyProgressBar.tsx
- Affiche palier + progression
- Animation remplissage
- Indicateurs paliers

// components/WelcomeMessage.tsx
- Message personnalisé
- Photo profil
- Prénom utilisateur

// components/VideoShortsSection.tsx
- Section vidéos courtes
- Carousel/grid
- Liens vers replays

// components/ReferralCodeDisplay.tsx
- Code parrainage
- Bouton copier
- Stats

// components/DiamondHunt.tsx
- Icône diamant sur produits
- Pop-up découverte
- Animation confettis

// components/BookOfGold.tsx
- Livre d'or complet
- Formulaire avis
- Liste avis approuvés
```

---

## PROCHAINES ÉTAPES

### Phase 1 : Frontend Visible (Priorité HAUTE)
1. Page d'accueil : icône + texte pépites
2. Section vidéos courtes
3. Message bienvenue compte client
4. Photo de profil

### Phase 2 : Gamification (Priorité HAUTE)
1. Page parrainage
2. Barre progression paliers
3. Composant cagnotte
4. Diamants cachés

### Phase 3 : Automatisations (Priorité MOYENNE)
1. Gains connexion quotidienne
2. Gains présence live
3. Gains achats (2%)
4. Coupons croisés auto

### Phase 4 : Avis & Emails (Priorité MOYENNE)
1. Livre d'or complet
2. Récompense avis
3. Queue emails J+7
4. Template personnalisé

---

## SÉCURITÉ & RÈGLES

### RLS Activé
- Toutes les tables ont RLS
- Policies user-specific
- Admins ont accès complet

### Règles Métier
- 1 visite quotidienne max
- 10 minutes minimum en live
- 2% sur montant HT (sans frais port)
- 3 diamants max par semaine
- 1 code parrainage par user
- 1 récompense parrainage par parrainé
- Coupons NON cumulables

---

**Projet**: qcqbtmvbvipsxwjlgjvk
**Date**: 2026-01-08
**Statut**: Base de données PRÊTE - Implémentation frontend EN COURS
