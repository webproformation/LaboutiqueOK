# Configuration Brevo SMS - Notification de Connexion

## Vue d'ensemble

Un SMS est automatiquement envoyé aux clients lorsqu'ils se connectent à leur espace client. Le message est personnalisé avec leur prénom et nom.

## Message SMS

```
Bonjour [Prénom] [Nom], Tu viens de te connecter à ton espace LA BOUTIQUE DE MORGANE, c'est super !!! L'envoi d'SMS fonctionne aussi !
```

## Configuration Requise

### 1. Activer les SMS dans Brevo

1. Se connecter au dashboard [Brevo](https://www.brevo.com)
2. Aller dans **Transactional** → **SMS**
3. Activer le service SMS (peut nécessiter validation du compte)
4. Configurer le nom d'expéditeur : **LBDM** (11 caractères max)

### 2. Crédits SMS

- Les SMS sont payants chez Brevo
- Vérifier le solde des crédits SMS dans le dashboard
- Recharger si nécessaire : **Transactional** → **SMS** → **Purchase SMS credits**

### 3. Format du Numéro de Téléphone

**Conversion Automatique pour la France**

Les numéros de téléphone français sont automatiquement convertis au format international :
- Format saisi par l'utilisateur : `07 59 51 00 00` ou `0759510000`
- Format envoyé à Brevo : `+33759510000`

La conversion se fait automatiquement dans l'edge function :
1. Suppression des espaces
2. Si le numéro commence par `0`, il est remplacé par `+33`
3. Si le numéro ne commence pas par `+`, `+33` est ajouté automatiquement

**Autres formats acceptés :**
- Belgique : `+32471234567`
- Autre : `+[code pays][numéro]`

**Important :** Les clients français peuvent saisir leur numéro au format local habituel (avec ou sans espaces), le système s'occupe de la conversion.

### 4. Déployer la Edge Function

La fonction `send-login-sms` doit être déployée dans Supabase :

1. Aller dans le dashboard Supabase
2. Sélectionner le projet
3. Aller dans **Edge Functions**
4. La fonction devrait apparaître dans la liste

Ou via l'interface d'administration de l'application.

### 5. Variables d'Environnement

La clé API Brevo est déjà configurée dans `.env` :
```
BREVO_API_KEY=xkeysib-...
```

Cette clé doit aussi être configurée dans Supabase :
1. Dashboard Supabase → **Settings** → **Edge Functions** → **Secrets**
2. Ajouter : `BREVO_API_KEY` avec la même valeur

## Fonctionnement

### Déclenchement Automatique

L'envoi de SMS se fait automatiquement à chaque connexion client :

1. Le client entre son email et mot de passe
2. L'authentification Supabase valide les identifiants
3. Le profil utilisateur est chargé (prénom, nom, téléphone)
4. Si le numéro de téléphone est renseigné, un SMS est envoyé
5. Le processus de connexion continue normalement

### Conditions d'Envoi

Le SMS est envoyé uniquement si :
- La connexion est réussie
- Le profil utilisateur contient un numéro de téléphone
- Le numéro n'est pas vide

### Conversion Automatique des Numéros

Le système convertit automatiquement les numéros français au format international :

**Étapes de conversion :**
1. **Suppression des espaces** : `07 59 51 00 00` → `0759510000`
2. **Détection du format français** : Si le numéro commence par `0`
3. **Conversion** : `0759510000` → `+33759510000`
4. **Envoi à Brevo** avec le format international

**Exemples de conversion :**
- `06 12 34 56 78` → `+33612345678`
- `07 59 51 00 00` → `+33759510000`
- `0612345678` → `+33612345678`
- `+33612345678` → `+33612345678` (déjà au bon format)

Cela permet aux clients français de saisir leur numéro dans le format habituel sans se soucier du format international.

### Gestion des Erreurs

Si l'envoi échoue :
- L'erreur est loggée dans la console
- La connexion continue normalement
- L'utilisateur n'est pas informé de l'échec

## Code Concerné

### Edge Function : `supabase/functions/send-login-sms/index.ts`

Fonction Supabase qui appelle l'API Brevo pour envoyer le SMS.

**Logique de conversion des numéros :**
```typescript
let cleanedPhoneNumber = phoneNumber.replace(/\s+/g, '');

if (cleanedPhoneNumber.startsWith('0')) {
  cleanedPhoneNumber = '+33' + cleanedPhoneNumber.substring(1);
} else if (!cleanedPhoneNumber.startsWith('+')) {
  cleanedPhoneNumber = '+33' + cleanedPhoneNumber;
}
```

Cette logique :
- Supprime tous les espaces du numéro
- Si le numéro commence par `0`, remplace le `0` par `+33`
- Si le numéro ne commence ni par `0` ni par `+`, ajoute `+33` devant

### AuthContext : `context/AuthContext.tsx`

La fonction `signIn()` a été modifiée pour appeler l'edge function après une connexion réussie. Elle récupère les informations du profil (prénom, nom, téléphone) et envoie une requête à l'edge function si un numéro est renseigné.

## Test de la Fonctionnalité

### 1. Prérequis

- Avoir un compte client avec un numéro de téléphone renseigné
- Le numéro peut être au format français (ex: 07 59 51 00 00) ou international
- Avoir des crédits SMS dans Brevo

### 2. Test Simple

1. Se déconnecter si connecté
2. Aller sur `/auth/login`
3. Se connecter avec un compte ayant un numéro de téléphone
4. Vérifier la réception du SMS

### 3. Vérification dans Brevo

1. Dashboard Brevo → **Transactional** → **SMS**
2. Onglet **Statistics** pour voir les SMS envoyés
3. Vérifier le statut : `sent`, `delivered`, ou `failed`

### 4. Vérification des Logs

Dans Supabase :
1. **Edge Functions** → `send-login-sms` → **Logs**
2. Voir les appels réussis et les erreurs éventuelles

## Dépannage

### Le SMS n'est pas envoyé

**Vérifier le numéro de téléphone :**
- Aller dans `/account`
- Vérifier que le numéro est renseigné (format français ou international accepté)
- Pour la France, les formats acceptés : `07 59 51 00 00`, `0759510000`, ou `+33759510000`

**Vérifier les crédits Brevo :**
- Dashboard Brevo → Voir le solde SMS
- Recharger si nécessaire

**Vérifier la clé API :**
- Supabase → Settings → Edge Functions → Secrets
- Vérifier que `BREVO_API_KEY` est bien configurée

**Vérifier les logs :**
```bash
# Dans la console navigateur (F12)
# Chercher : "Erreur lors de l'envoi du SMS de connexion"
```

### Le SMS arrive en retard

- Les SMS Brevo peuvent avoir un délai de 1-30 secondes
- Vérifier l'état dans le dashboard Brevo

### Erreur "Invalid recipient"

- Le numéro peut être invalide ou mal formaté
- Pour les numéros français, vérifier qu'il commence bien par 06, 07, ou 09
- Pour les numéros étrangers, s'assurer qu'ils sont au format international complet
- Demander au client de mettre à jour son numéro si nécessaire

### Erreur "Insufficient credits"

- Recharger les crédits SMS dans Brevo
- Temporairement désactiver l'envoi si nécessaire

## Désactivation Temporaire

Pour désactiver l'envoi de SMS sans modifier le code :

**Option 1 : Supprimer la clé API dans Supabase**
1. Dashboard Supabase → Edge Functions → Secrets
2. Supprimer `BREVO_API_KEY`

**Option 2 : Modifier le code**
Commenter l'appel dans `context/AuthContext.tsx` :

```typescript
// if (userProfile?.phone && userProfile.phone.trim() !== '') {
//   try {
//     await fetch(...)
//   } catch (smsError) {
//     console.error('Erreur lors de l\'envoi du SMS de connexion:', smsError);
//   }
// }
```

## Coûts

Les coûts SMS dépendent du pays de destination :
- France : ~0.04€ par SMS
- Belgique : ~0.05€ par SMS
- Autres pays : variable

Consulter la grille tarifaire Brevo pour les prix exacts.

## Limitations

- Maximum 160 caractères par SMS (le message actuel en utilise ~130)
- Pas de caractères spéciaux dans le nom d'expéditeur
- Débit limité (consulter Brevo pour les limites)
- Nécessite des crédits SMS prépayés

## Évolutions Possibles

### Personnalisation

Modifier le message dans `supabase/functions/send-login-sms/index.ts` :

```typescript
const message = `Bonjour ${firstName} ${lastName}, Tu viens de te connecter à ton espace LA BOUTIQUE DE MORGANE, c'est super !!! L'envoi d'SMS fonctionne aussi !`;
```

### Envoi Conditionnel

Ajouter une option dans le profil utilisateur pour permettre de désactiver les SMS.

### Autres Notifications SMS

Utiliser la même edge function pour d'autres notifications :
- Confirmation de commande
- Suivi de livraison
- Promotions personnalisées

## Support

- Documentation Brevo SMS : https://developers.brevo.com/reference/sendtransacsms
- Support Brevo : support@brevo.com
- Logs Supabase : Dashboard → Edge Functions → Logs
