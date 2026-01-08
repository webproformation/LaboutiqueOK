# Guide d'intégration des services de livraison

Ce document détaille les étapes nécessaires pour intégrer les services de livraison Mondial Relay, Chronopost et GLS sur le projet qcqbtmv.

## État actuel

✅ **Déjà implémenté :**
- Composant `RelayPointSelector` pour afficher l'interface de sélection
- API routes pour chaque fournisseur (`/api/mondial-relay/search`, `/api/chronopost/search`, `/api/gls/search`)
- Intégration Google Maps pour afficher les points sur une carte
- Popup de coordonnées bancaires avec les vraies informations (IBAN, BIC, etc.)
- Gestion des assurances dans le tunnel d'achat
- Page admin pour gérer les expéditions

## Credentials nécessaires

### 1. Mondial Relay

**Documentation officielle :** https://www.mondialrelay.fr/media/108937/wsi4-solutions-informatiques.pdf

**Variables d'environnement à ajouter dans `.env` :**
```env
MONDIAL_RELAY_ID=VOTRE_ENSEIGNE_ID
MONDIAL_RELAY_KEY=VOTRE_CLE_PRIVEE
```

**Comment obtenir les credentials :**
1. Créer un compte professionnel sur https://www.mondialrelay.fr
2. Accéder à l'espace API/WebServices
3. Récupérer votre "Code Enseigne" (8 caractères)
4. Générer une clé privée pour l'API

**API utilisée :**
- Endpoint: `https://api.mondialrelay.com/Web_Services.asmx`
- Méthode: `WSI4_PointRelais_Recherche` (SOAP)
- Format: XML/SOAP

### 2. Chronopost

**Documentation officielle :** https://www.chronopost.fr/fr/services-boutique-en-ligne

**Variables d'environnement à ajouter dans `.env` :**
```env
CHRONOPOST_ACCOUNT_NUMBER=VOTRE_NUMERO_COMPTE
CHRONOPOST_PASSWORD=VOTRE_MOT_DE_PASSE
```

**Comment obtenir les credentials :**
1. Ouvrir un compte expéditeur Chronopost professionnel
2. Contacter le service client Chronopost pour activer l'accès API
3. Récupérer votre numéro de compte (8 chiffres)
4. Obtenir le mot de passe API (différent du mot de passe web)

**API utilisée :**
- Endpoint: `https://ws.chronopost.fr/recherchebt-ws-cxf/PointRelaisServiceWS?wsdl`
- Méthode: `recherchePointRelais` (SOAP)
- Format: XML/SOAP

### 3. GLS (General Logistics Systems)

**Documentation officielle :** https://gls-group.eu/FR/fr/expedier-avec-gls/solutions-it

**Variables d'environnement à ajouter dans `.env` :**
```env
GLS_USERNAME=VOTRE_USERNAME
GLS_PASSWORD=VOTRE_PASSWORD
```

**Comment obtenir les credentials :**
1. Devenir client GLS France (https://gls-group.eu/FR/fr/contact)
2. Souscrire au service "GLS ParcelShop"
3. Demander l'activation de l'API REST
4. Récupérer vos identifiants API (username/password)

**API utilisée :**
- Endpoint: `https://api.gls-group.eu/public/v1/parcelshops`
- Méthode: REST API (GET)
- Format: JSON
- Authentification: Basic Auth

## Installation et configuration

### Étape 1 : Ajouter les variables d'environnement

Ajouter dans votre fichier `.env` :

```env
# Mondial Relay
MONDIAL_RELAY_ID=BDTEST13
MONDIAL_RELAY_KEY=PrivateK

# Chronopost
CHRONOPOST_ACCOUNT_NUMBER=12345678
CHRONOPOST_PASSWORD=MotDePasse123

# GLS
GLS_USERNAME=votre_username
GLS_PASSWORD=votre_password
```

### Étape 2 : Installer les dépendances XML (si nécessaire)

Pour parser les réponses SOAP de Mondial Relay et Chronopost :

```bash
npm install fast-xml-parser
```

### Étape 3 : Mettre à jour les méthodes de livraison dans Supabase

Connectez-vous à votre console Supabase et ajoutez/modifiez les méthodes de livraison :

```sql
-- Mondial Relay
INSERT INTO shipping_methods (name, code, description, cost, is_relay, is_active, delivery_time, type, sort_order)
VALUES (
  'Mondial Relay',
  'mondial-relay',
  'Retrait en point relais Mondial Relay',
  4.90,
  true,
  true,
  '3-5 jours ouvrés',
  'relay',
  2
);

-- Chronopost
INSERT INTO shipping_methods (name, code, description, cost, is_relay, is_active, delivery_time, type, sort_order)
VALUES (
  'Chronopost Relais',
  'chronopost',
  'Retrait en bureau Chronopost',
  5.90,
  true,
  true,
  '1-2 jours ouvrés',
  'relay',
  3
);

-- GLS Relais
INSERT INTO shipping_methods (name, code, description, cost, is_relay, is_active, delivery_time, type, sort_order)
VALUES (
  'GLS Relais Colis',
  'gls',
  'Retrait en point GLS',
  4.50,
  true,
  true,
  '2-4 jours ouvrés',
  'relay',
  4
);
```

### Étape 4 : Intégrer le composant dans le checkout

Le composant `RelayPointSelector` est déjà créé. Pour l'utiliser dans la page checkout :

```tsx
import { RelayPointSelector } from '@/components/RelayPointSelector';

// Dans votre composant checkout
{selectedShippingMethod?.is_relay && (
  <RelayPointSelector
    provider={selectedShippingMethod.code as 'mondial-relay' | 'chronopost' | 'gls'}
    onSelect={(point) => {
      setRelayPointData(point);
    }}
    selectedPoint={relayPointData}
    customerAddress={{
      postalCode: selectedAddress?.postal_code || '',
      city: selectedAddress?.city || ''
    }}
  />
)}
```

## Mode démo / développement

En attendant d'avoir les vrais credentials, les API routes retournent des données de démonstration si les credentials ne sont pas configurés. Cela permet de tester l'interface sans bloquer le développement.

## Tests

Pour tester chaque intégration :

1. **Mode démo** : Laissez les variables d'environnement vides, des données fictives seront retournées
2. **Mode production** : Ajoutez les vrais credentials et testez avec de vraies adresses

## Parser les réponses SOAP

Pour améliorer le parsing des réponses XML de Mondial Relay et Chronopost, installez `fast-xml-parser` :

```bash
npm install fast-xml-parser
```

Puis mettez à jour les fonctions de parsing dans les API routes :

```typescript
import { XMLParser } from 'fast-xml-parser';

function parseWorldRelayResponse(xml: string): any[] {
  const parser = new XMLParser();
  const result = parser.parse(xml);

  // Extraire les points relais du XML
  const points = result?.['soap:Envelope']?.['soap:Body']?.PointsRelais || [];

  return points.map((point: any) => ({
    id: point.Num,
    name: point.LgAdr1,
    address: point.LgAdr3,
    city: point.Ville,
    postalCode: point.CP,
    latitude: point.Latitude,
    longitude: point.Longitude,
    distance: point.Distance,
    provider: 'mondial-relay'
  }));
}
```

## Support et documentation

- **Mondial Relay** : support@mondialrelay.fr
- **Chronopost** : https://www.chronopost.fr/fr/contact
- **GLS** : https://gls-group.eu/FR/fr/contact

## Prochaines étapes

1. Obtenir les credentials pour chaque service
2. Tester les intégrations en environnement de développement
3. Implémenter le parsing XML pour Mondial Relay et Chronopost
4. Afficher les points sur Google Maps avec des marqueurs
5. Gérer les erreurs et les cas limites
6. Ajouter des logs pour le debug
7. Tester en production

## Notes importantes

- Les APIs Mondial Relay et Chronopost utilisent SOAP/XML (format ancien mais toujours en service)
- L'API GLS utilise REST/JSON (plus moderne)
- Toutes ces APIs nécessitent un compte professionnel actif
- Les coûts peuvent varier selon votre volume d'expéditions
- Pensez à gérer les timeouts et les erreurs réseau
