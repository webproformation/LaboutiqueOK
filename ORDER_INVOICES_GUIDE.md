# Guide du Système de Bons de Commande

## Vue d'ensemble

Le système de bons de commande génère automatiquement des documents PDF professionnels pour chaque commande passée en statut "En traitement" et les envoie par email au client.

## Fonctionnalités

### 1. Génération Automatique
- **Déclenchement** : Lorsqu'une commande passe en statut "En traitement" (processing)
- **Numérotation** : Format `FACT-YYYY-NNNNN` (ex: FACT-2025-00001)
- **Contenu** :
  - Informations de la boutique (La Boutique de Morgane)
  - Détails de facturation et de livraison
  - Liste des articles avec quantités et prix
  - Sous-total, frais de port, TVA et total TTC
  - Mode de paiement
  - Mentions légales complètes

### 2. Envoi par Email
- **Automatique** : Email envoyé automatiquement lors de la génération
- **Contenu** : Email HTML professionnel avec le bon de commande intégré
- **Service** : Utilise Brevo pour l'envoi
- **Traçabilité** : Date d'envoi enregistrée dans la base de données

### 3. Interface Admin (/admin/orders)
Pour chaque commande en statut "En traitement" :
- **Voir le bon de commande** : Ouvre le document dans un nouvel onglet
- **Télécharger** : Télécharge le bon de commande en HTML
- **Renvoyer au client** : Renvoie le bon de commande par email
- **Indicateur d'envoi** : Affiche la date du dernier envoi

### 4. Interface Client (/account/orders)
Pour chaque commande en statut "En traitement" :
- **Voir le bon de commande** : Consulte le document
- **Télécharger** : Télécharge le bon de commande

## Architecture Technique

### Base de Données
Table `order_invoices` :
- `id` : Identifiant unique
- `order_number` : Numéro de commande WooCommerce
- `woocommerce_order_id` : ID WooCommerce
- `pdf_url` : URL du document stocké
- `invoice_number` : Numéro de facture unique
- `customer_email` : Email du client
- `sent_at` : Date d'envoi par email
- `generated_at` : Date de génération

### Edge Functions

#### generate-order-invoice
- **Route** : `/functions/v1/generate-order-invoice`
- **Méthode** : POST
- **Paramètres** :
  - `orderId` : ID de la commande WooCommerce
  - `orderData` : Données complètes de la commande
- **Retour** : Objet invoice avec URL et numéro

#### send-order-invoice-email
- **Route** : `/functions/v1/send-order-invoice-email`
- **Méthode** : POST
- **Paramètres** :
  - `invoiceId` : ID de la facture
  - `resend` : Boolean pour renvoyer
- **Retour** : Confirmation d'envoi

### API Routes

#### /api/invoices/generate
- Génère un nouveau bon de commande
- Optionnel : envoi automatique par email

#### /api/invoices/send
- Envoie ou renvoie un bon de commande par email

#### /api/invoices
- Récupère les bons de commande
- Filtres : par orderId ou orderNumber

## Stockage

Les bons de commande sont stockés dans Supabase Storage :
- **Bucket** : `order-documents`
- **Format** : JSON contenant le HTML
- **Chemin** : `invoices/FACT-YYYY-NNNNN.json`

## Personnalisation

### Informations de l'entreprise
Pour mettre à jour les informations de la boutique dans les bons de commande, modifiez la fonction `generateInvoiceHTML` dans :
```
supabase/functions/generate-order-invoice/index.ts
```

Remplacez les placeholders :
- `[Adresse de l'entreprise]`
- `[Numéro SIRET]`
- `[Numéro TVA]`
- `[Numéro de téléphone]`

### Design du PDF
Le design est entièrement personnalisable via le HTML/CSS dans la fonction `generateInvoiceHTML`.

## Mentions Légales Incluses

Chaque bon de commande inclut :
- Conditions générales de vente
- Droit de rétractation (14 jours)
- Garanties légales
- Protection des données (RGPD)
- Règlement des litiges

## Flux de Travail

1. **Admin** change le statut d'une commande à "En traitement"
2. Le système génère automatiquement un bon de commande
3. Un numéro unique est attribué
4. Le document est créé et stocké
5. Un email est envoyé automatiquement au client
6. Le client reçoit l'email avec le bon de commande
7. Le client peut consulter et télécharger le document depuis son compte

## Sécurité

- **RLS activé** : Accès contrôlé par Row Level Security
- **Admin** : Accès complet à tous les bons de commande
- **Clients** : Accès uniquement à leurs propres bons de commande
- **Authentification** : Requise pour toutes les opérations

## Dépannage

### Le bon de commande n'est pas généré
- Vérifiez que toutes les données de commande sont complètes
- Vérifiez les logs de l'edge function `generate-order-invoice`

### L'email n'est pas envoyé
- Vérifiez la configuration Brevo
- Vérifiez que `BREVO_API_KEY` est configurée
- Consultez les logs de l'edge function `send-order-invoice-email`

### Erreur lors de l'affichage
- Vérifiez que le bucket `order-documents` existe dans Supabase Storage
- Vérifiez les permissions du bucket

## Prochaines Améliorations Possibles

1. Export en PDF natif (actuellement en HTML)
2. Personnalisation du design par l'admin
3. Envoi de rappels automatiques
4. Archive des anciens bons de commande
5. Statistiques et rapports
