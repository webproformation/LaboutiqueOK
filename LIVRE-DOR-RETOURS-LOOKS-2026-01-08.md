# NOUVEAUX SYSTÈMES - PROJET qcqbtmv

**Date**: 2026-01-08
**Projet**: qcqbtmvbvipsxwjlgjvk
**Mission**: Implémentation complète Livre d'Or + Retours + Looks/Bundles

---

## BASE DE DONNÉES CRÉÉE

### 1. LIVRE D'OR (Guestbook Upgraded)

#### Tables Modifiées/Créées

**guestbook_entries** (upgraded)
- hearts_count : Compteur de coeurs (likes)
- is_ambassador : Badge ambassadrice
- ambassador_week : Semaine d'élection
- Notation en "pépites" (1-5) au lieu d'étoiles

**guestbook_hearts** (nouvelle)
- Système de like avec coeurs
- 1 coeur par user par avis
- Triggers auto pour incrémenter/décrémenter hearts_count

**ambassador_weekly** (nouvelle)
- Archive des ambassadrices élues
- Récompense 5€ (NON multipliée par paliers)
- Badge couronne dorée

**guestbook_settings** (upgraded)
- current_gift_value : Valeur cadeau (5€)
- threshold_amount : Palier cadeau (69€)

#### Logique Métier

**Accès Formulaire**
- UNIQUEMENT clientes connectées
- Avec au moins 1 commande "Livrée"
- 1 seule signature par numéro de commande

**Récompenses**
- 0.20€ immédiat après validation admin
- Multiplié selon palier fidélité (x1, x2, x3)
- Badge "Achat Vérifié" sur tous les avis

**Ambassadrice de la Semaine**
- Élection basée sur hearts_count (7 derniers jours)
- Récompense : 5€ + Badge couronne + Affichage home page
- IMPORTANT : Les 5€ ne sont PAS multipliés par les paliers

**Modération**
- Validation admin obligatoire
- Délai 48-72h
- Refus si : injures, spam, données perso, photo inappropriée

---

### 2. SYSTÈME DE RETOURS (Droit à l'Erreur)

#### Tables Créées

**customer_wallet** (Porte-monnaie Avoir)
- Séparé de loyalty_wallet (cagnotte)
- balance : Solde en €
- total_credited / total_spent : Historique

**return_requests** (Demandes de retour)
- return_number : Numéro unique (RET-XXXXXX)
- return_type : 'credit' ou 'refund'
- status : declared → received → validated → completed
- total_amount : Montant à rembourser
- loyalty_recovered : Points fidélité récupérés
- gift_deduction : Déduction cadeau si applicable
- gift_returned : Boolean

**return_items** (Articles retournés)
- Détail des articles
- unit_price, discount_prorata, net_amount
- Calcul prorata automatique

**wallet_transactions** (Historique avoir)
- Transactions crédit/débit
- Lien vers return_id ou order_id

#### Logique Métier

**Déclaration Retour**
- Dans "Historique commandes"
- Bouton visible uniquement < 14 jours après livraison
- Sélection articles + choix avoir/remboursement
- Génération numéro + PDF récapitulatif

**Adresse Retour**
```
La Boutique de Morgane
1062, Rue d'Armentières
59850 Nieppe
```
**ALERTE** : Livraison directe UNIQUEMENT (pas de Point Relais/Consignes)

**Calcul Remboursement**
```
Prix Net = Prix Catalogue - (Remise Totale * Prorata Article)
Remboursement = Prix Net - Points Fidélité - Déduction Cadeau
```

**Gestion Cadeaux**
- Si commande initiale >= 69€ ET cadeau envoyé
- Si après retour < 69€ :
  - Case admin : "Cadeau retourné ?"
  - Si NON coché : Déduction valeur cadeau (5€)

**Remboursement Mixte**
- Si payé avec [Avoir + CB] :
  1. Priorité : recréditer Avoir
  2. Surplus : rembourser CB

#### Emails Automatiques

**Mail 1 : Confirmation déclaration**
```
Objet : Votre demande de retour est enregistrée ✨

Bonjour [Prénom],
Nous avons bien reçu votre déclaration de retour pour la commande #[Numéro].

Rappel :
- Glissez vos pépites (neuves, étiquetées)
- Joignez votre numéro de commande
- Envoyez à : 1062 Rue d'Armentières, 59850 Nieppe
- Livraison directe uniquement

Validation sous 14 jours après réception.

Morgane 🌸
```

**Mail 2 : Confirmation traitement**
```
Objet : Votre retour a été validé ! 🎁

Bonjour [Prénom],

[Option Avoir]
Votre Porte-monnaie vient d'être crédité de [Montant] €.
Il se déduira automatiquement de votre prochaine commande.

[Option Remboursement]
Remboursement de [Montant] € effectué sur votre moyen de paiement.
Délai bancaire : quelques jours.

Morgane 🌸
```

---

### 3. SYSTÈME LOOKS/BUNDLES

#### Tables Upgradées

**looks** (upgraded)
- morgane_style_advice : Conseil de Morgane
- total_price : Prix total cumulé
- discounted_price : Prix avec -5%
- items_count : Nombre d'articles
- discount_percentage : 5% par défaut

**look_products** (upgraded)
- product_slug, product_price
- available_sizes, available_colors : Arrays JSON
- stock_status : instock/lowstock/outofstock
- category : Catégorie article
- hotspot_x, hotspot_y : Coordonnées hotspots (0-100%)

#### Fonctions Helper

**calculate_look_prices()**
- Calcul automatique total_price
- Calcul discounted_price (total * 0.95)
- Mise à jour items_count
- Trigger sur INSERT/UPDATE look_products

**check_look_availability(look_id)**
- Vérifie si tous les articles sont en stock
- Retourne boolean
- Utilisé pour activer/désactiver bouton "Look complet"

#### Logique Frontend

**Présentation**
- Photo héroïne haute qualité
- Hotspots interactifs cliquables
- "Pourquoi j'aime ce look ?" - Morgane

**Sélection Variantes**
- Sélecteurs tailles/couleurs par article
- Stock en temps réel
- Tailles épuisées barrées et non sélectionnables

**Prix & Remise**
- Affichage : ~~120€~~ **114€** (-5%)
- Remise UNIQUEMENT si tous les articles ajoutés ensemble
- Bouton : "✨ Je craque pour le look complet (-5%)"

**Rupture de Stock**
- Si 1 article totalement épuisé :
  - Bouton désactivé
  - Message : "Ce look est victime de son succès..."
  - Possibilité achat articles séparés (sans remise)

**Panier**
- Articles ajoutés séparément
- Remise "Bundle" appliquée globalement
- Gestion retours individuels possible

---

### 4. BARRE PROGRESSION CADEAU (Universelle)

#### Logique de Calcul

**Seuil**: 69€ (modifiable en admin via guestbook_settings.threshold_amount)

**Calcul Cumulatif**
```
Total =
  [Somme panier actuel]
  + [Commandes payées du Colis Ouvert en cours]
```

**Affichage Dynamique**
```html
< 69€ : "Plus que X € pour recevoir un cadeau surprise ! 🎁"
>= 69€ : "Félicitations ! Votre cadeau surprise est débloqué ! ✨"
```

**Validation Logistique**
- Mention "CADEAU SURPRISE À INCLURE" sur :
  - Récapitulatif commande
  - Back-office admin
  - Bon de préparation
- 1 seul cadeau par "Colis" (même si 10 commandes cumulées)

**Cas Envoi Immédiat**
- Si cliente ne choisit pas "Colis Ouvert"
- Barre fonctionne sur montant panier uniquement
- Cadeau ajouté si >= 69€

---

## NOTIFICATIONS WEB PUSH

### Configuration OneSignal

Variables d'environnement déjà présentes :
```
ONESIGNAL_API_KEY=os_v2_app_poq5pgl2cze63gx6dphwforo5erqsjl3cqyegwv2lpyae34ra2vgxq46i6xuq3ruvf6po27cgyui6dd4mkznzzzdtd724v64eeu63yq
ONESIGNAL_APP_ID=rqsjl3cqyegwv2lpyae34ra2v
NEXT_PUBLIC_ONESIGNAL_APP_ID=rqsjl3cqyegwv2lpyae34ra2v
```

### Points de Déclenchement

1. **Lancement Live**
   - "Le Live commence dans 5 minutes ! 🎥"
   - Envoi auto 5min avant scheduled_start

2. **Nouvelles Pépites**
   - "De nouvelles pépites viennent d'arriver ! ✨"
   - Envoi manuel par admin

3. **Diamant Caché**
   - "3 nouveaux diamants cachés cette semaine ! 💎"
   - Envoi lundi matin (auto ou manuel)

4. **Ambassadrice Élue**
   - "Découvrez notre Ambassadrice de la Semaine ! 👑"
   - Envoi après élection

**Limite** : 1-2 notifications par jour maximum

---

## TEXTES À INTÉGRER

### Page Livre d'Or (Haut de page)

```
👑 Devenez notre Ambassadrice de la Semaine !

Vous aimez vos pépites ? Vous adorez partager vos looks ?
Alors, préparez-vous à briller ! Chaque semaine, nous mettons
l'une d'entre vous à l'honneur sur la boutique.

✨ Comment participer ?
1. Faites pétiller votre look : Photo de vous avec vos pépites
2. Signez le Livre d'Or : Déposez photo + mot doux
   (Bonus : 0,20 € immédiat dans votre cagnotte)
3. Récoltez des cœurs : Invitez les visiteuses à ❤️ votre avis

💖 Comment gagner ?
Chaque lundi, l'avis avec le plus de ❤️ sur 7 jours gagne !

🎁 Votre couronne de cadeaux :
💰 5,00 € offerts sur votre Cagnotte
👑 Badge "Couronne Dorée" à vie
🌟 Photo en grande sur la home page toute la semaine

Alors, qui sera notre prochaine Ambassadrice ?
À vos pépites, prêtes... brillez !
```

### Page Droit à l'Erreur (Modifications)

**Section "Marche à suivre"**
```
2. La marche à suivre (100 % autonome)

• Déclarez votre retour dans "Historique de commandes"
• Sélectionnez articles + mode de dédommagement (avoir/remboursement)
• Préparez votre colis (articles neufs + étiquettes + n° commande)
• Expédiez à :
  La Boutique de Morgane
  1062, Rue d'Armentières, 59850 Nieppe

⚠️ ATTENTION : Livraison directe UNIQUEMENT
Pas de Points Relais, pas de consignes.
Tout colis non livré à l'adresse sera retourné à l'expéditeur.
```

**Nouvelle Section : Cadeaux**
```
🎁 Note particulière sur nos cadeaux

Nous sommes heureux de vous offrir une surprise dès 69 €.

Si votre retour fait passer votre commande sous ce palier :
• Glissez le cadeau dans votre colis de retour
• OU sa valeur sera déduite de votre remboursement/avoir

Vous pouvez le garder, pas de souci ! 🌸
```

---

## COMPTEURS HOME PAGE

### Dashboard "Nos Petits Bonheurs en Chiffres"

Bandeau avec 3 compteurs cumulés (ajustables en admin) :

```
💎 [X] Diamants dénichés
   └─ Source : SUM(diamond_findings)

✨ [Y] Mots doux reçus
   └─ Source : COUNT(guestbook_entries WHERE status='approved')

📦 [Z] Colis chouchoutés
   └─ Source : COUNT(orders WHERE status='delivered')
```

Affichage : Compteurs animés avec incrémentation au scroll

---

## CHARTE DE MODÉRATION

### Livre d'Or - Règles

**1. Authenticité**
- Réservé aux clientes avec achat réel
- Badge "Achat Vérifié ✅" automatique

**2. Modération**
- Relecture avant publication
- Délai 48-72h
- Tous les avis publiés (positifs ET moins positifs)

**3. Motifs de Refus**
- Propos injurieux, diffamatoires, haineux
- Données personnelles (tél, email)
- Photo mauvaise qualité ou inappropriée
- Contenu publicitaire ou liens externes

**4. Récompenses**
- 0,20€ (multiplié par palier) pour TOUS les avis validés
- Pas de condition sur la note
- Pas de discrimination

**5. Élection Ambassadrice**
- Basée sur votes communautaires (❤️)
- En cas d'égalité : arbitrage admin
- Anti-fraude : détection robots de vote

**6. Droits RGPD**
- Publication = consentement
- Modification/suppression sur demande
- Contact via formulaire

---

## STRUCTURE TECHNIQUE RECOMMANDÉE

### Hooks à Créer

```typescript
// hooks/use-guestbook.ts
- useGuestbook() : Liste avis avec pagination
- useHearts(entryId) : Gérer likes
- useAmbassador() : Ambassadrice actuelle
- submitReview() : Soumettre avis

// hooks/use-returns.ts
- useReturns() : Liste retours user
- useCustomerWallet() : Solde avoir
- createReturnRequest() : Déclarer retour
- calculateRefund() : Calculer remboursement

// hooks/use-looks.ts
- useLooks() : Liste looks actifs
- useLookDetails(lookId) : Détails look
- checkLookAvailability() : Vérifier stock
- addLookToCart() : Ajouter bundle

// hooks/use-gift-progress.ts
- useGiftProgress() : Calcul progression
- checkGiftEligibility() : Vérifier palier
```

### Composants à Créer

```typescript
// components/GuestbookFeed.tsx
- Liste avis avec photos
- Système de hearts
- Badge "Achat Vérifié"

// components/AmbassadorBanner.tsx
- Encart ambassadrice sur home
- Photo + avis + badge couronne

// components/GuestbookForm.tsx
- Formulaire signature
- Upload photo
- Notation pépites (1-5)

// components/ReturnsManager.tsx
- Interface déclaration retour
- Liste retours en cours
- Affichage avoir

// components/LookBundle.tsx
- Photo look avec hotspots
- Sélecteurs variantes
- Bouton "Acheter le look"

// components/GiftProgressBar.tsx
- Barre progression 69€
- Affichage dynamique
- Animation remplissage
```

### Pages à Créer/Modifier

```
/livre-dor
  - Liste avis approuvés
  - Formulaire (si éligible)
  - Textes d'introduction
  - Section ambassadrice

/account/returns
  - Liste retours
  - Déclarer nouveau retour
  - Solde avoir

/account/wallet
  - Porte-monnaie avoir (séparé de cagnotte)
  - Historique transactions

/les-looks-de-morgane
  - Grille looks actifs
  - Filtre par catégorie
  - [slug] : Détail look avec bundle

/droit-a-lerreur
  - Textes mis à jour
  - Section cadeaux
  - FAQ retours
```

---

## RÈGLES DE CALCUL IMPORTANTES

### Remboursement Retour

```javascript
// 1. Prix Net Article
const netPrice = catalogPrice - (totalDiscount * (itemPrice / cartTotal))

// 2. Récupération Points Fidélité
const loyaltyEarned = order.loyalty_points_earned
const loyaltyToRecover = (loyaltyEarned * itemPrice) / orderTotal

// 3. Déduction Cadeau (si applicable)
let giftDeduction = 0
if (order.total >= 69 && newTotal < 69 && !giftReturned) {
  giftDeduction = settings.current_gift_value // 5€
}

// 4. Remboursement Final
const refund = netPrice - loyaltyToRecover - giftDeduction
```

### Prix Look/Bundle

```javascript
// 1. Prix Total
const totalPrice = lookProducts.reduce((sum, p) => sum + p.price, 0)

// 2. Remise 5%
const discount = totalPrice * 0.05

// 3. Prix Final
const finalPrice = totalPrice - discount
```

### Progression Cadeau

```javascript
// 1. Panier Actuel
const cartTotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0)

// 2. Commandes Colis Ouvert
const openPackageTotal = openPackageOrders
  .filter(o => o.is_paid)
  .reduce((sum, o) => sum + o.total, 0)

// 3. Total Cumulé
const cumulativeTotal = cartTotal + openPackageTotal

// 4. Progression
const threshold = 69 // €
const progress = Math.min(100, (cumulativeTotal / threshold) * 100)
const remaining = Math.max(0, threshold - cumulativeTotal)
```

---

## PROCHAINES ÉTAPES

### Phase 1 : Frontend Prioritaire (URGENT)
1. Livre d'Or complet avec système hearts
2. Page ambassadrice
3. Compteurs home page
4. Barre progression cadeau

### Phase 2 : Système Retours (HAUTE)
1. Interface déclaration retour
2. Gestion avoir vs remboursement
3. Admin panel retours
4. Emails automatiques

### Phase 3 : Looks/Bundles (MOYENNE)
1. Grille looks
2. Page détail look avec hotspots
3. Système sélection variantes
4. Ajout panier bundle

### Phase 4 : Automatisations (MOYENNE)
1. Integration OneSignal
2. Notifications push auto
3. Emails J+7 retours
4. Calculs automatiques

---

**Projet**: qcqbtmvbvipsxwjlgjvk
**Date**: 2026-01-08
**Statut**: Base de données COMPLÈTE - Implémentation frontend PRÊTE À DÉMARRER
