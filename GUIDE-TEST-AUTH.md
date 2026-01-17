# Guide de Test : Authentification API

**Date :** 15 janvier 2026
**Objectif :** Vérifier que l'API `/api/games/claim-reward` fonctionne correctement après corrections

---

## Corrections Appliquées

### 1. Middleware Créé ✅
- **Fichier :** `middleware.ts` (racine)
- **Fonction :** Rafraîchit automatiquement les tokens de session
- **Impact :** Évite les erreurs "Invalid Refresh Token"

### 2. API Route Optimisée ✅
- **Fichier :** `app/api/games/claim-reward/route.ts`
- **Changements :**
  - Suppression des try/catch silencieux qui masquaient les erreurs
  - Ajout de logs détaillés pour le débogage
  - Meilleure gestion des erreurs de session

### 3. Logs de Débogage Ajoutés ✅

L'API affiche maintenant dans la console :
```javascript
[claim-reward] Auth check: {
  hasSession: true/false,
  hasError: true/false,
  userId: "uuid",
  cookies: ["sb-access-token", "sb-refresh-token", ...]
}
```

---

## Tests à Effectuer

### Test 1 : Vérifier les Cookies

**Dans le navigateur :**
1. Ouvrir DevTools (F12)
2. Aller dans l'onglet **Application** > **Cookies**
3. Vérifier que ces cookies existent :
   - `sb-qcqbtmvbvipsxwjlgjvk-auth-token`
   - `sb-qcqbtmvbvipsxwjlgjvk-auth-token-code-verifier`

Si les cookies ne sont **pas** présents :
- ✅ Se connecter à nouveau
- ✅ Vider le cache et recharger la page

---

### Test 2 : Tester l'API Directement

**Ouvrir la console du navigateur (F12) et exécuter :**

```javascript
const response = await fetch('/api/games/claim-reward', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    game_type: 'card_flip',
    game_id: crypto.randomUUID(),
    coupon_code: 'WIN10',
    has_won: true
  })
});

const data = await response.json();
console.log('Statut:', response.status);
console.log('Réponse:', data);
```

**Résultats attendus :**

#### Si connecté ✅
```javascript
Statut: 200
Réponse: {
  success: true,
  message: "Coupon attribué avec succès",
  coupon: { ... }
}
```

#### Si non connecté ❌
```javascript
Statut: 401
Réponse: {
  error: "Non authentifié - Veuillez vous reconnecter"
}
```

---

### Test 3 : Tester via le Jeu Card Flip

**Étapes :**
1. Se connecter sur le site
2. Aller sur `/admin/card-flip`
3. **IMPORTANT :** Vérifier qu'un coupon est configuré
   - Si aucun coupon n'est sélectionné, en choisir un (WIN10 ou WIN5)
   - Sauvegarder
4. Cliquer sur "Prévisualiser"
5. Jouer et gagner

**Résultat attendu :**
- ✅ Message de succès
- ✅ Coupon ajouté au compte
- ✅ Visible dans `/account/coupons`

---

### Test 4 : Vérifier les Logs Serveur

**Si vous avez accès aux logs serveur (console de dev) :**

**Après un appel API réussi :**
```
[claim-reward] Auth check: {
  hasSession: true,
  hasError: false,
  userId: "a1b2c3d4-...",
  cookies: [
    "sb-qcqbtmvbvipsxwjlgjvk-auth-token",
    "sb-qcqbtmvbvipsxwjlgjvk-auth-token-code-verifier"
  ]
}
```

**Si erreur 401 :**
```
[claim-reward] Auth check: {
  hasSession: false,
  hasError: false,
  userId: undefined,
  cookies: []
}
[claim-reward] No session found
```

---

## Scénarios de Débogage

### Problème : Erreur 401 même connecté

**Causes possibles :**

1. **Les cookies Supabase ne sont pas envoyés**
   - Vérifier dans DevTools > Network > Headers
   - Les cookies doivent apparaître dans `Cookie: sb-...`

2. **Le middleware ne s'exécute pas**
   - Vérifier que `middleware.ts` existe à la racine
   - Redémarrer le serveur de dev : `npm run dev`

3. **Session expirée**
   - Se déconnecter
   - Vider les cookies
   - Se reconnecter

4. **Mauvaise configuration .env**
   - Vérifier que `.env` contient bien :
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://qcqbtmvbvipsxwjlgjvk.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...Yn0c
     ```

---

### Problème : "Coupon type not found"

**Cause :** Le coupon `WIN10` n'existe pas dans `coupon_types`

**Solution :**
1. Aller sur `/admin/coupons`
2. Créer un coupon avec :
   - Code : `WIN10`
   - Type : `percentage` ou `fixed`
   - Valeur : `10` (10% ou 10€)
3. Sauvegarder
4. Retester

---

### Problème : Le jeu ne distribue rien

**Cause :** Le jeu Card Flip n'a pas de coupon configuré

**Solution :**
1. Aller sur `/admin/card-flip`
2. Éditer "Jeu de cartes d'accueil"
3. Sélectionner un coupon dans le menu déroulant
4. Sauvegarder
5. Retester

---

## Vérifications Finales

### Checklist de Vérification

| Élément | Statut | Action |
|---------|--------|--------|
| **Middleware existe** | ⬜ | Vérifier `middleware.ts` à la racine |
| **API optimisée** | ✅ | `app/api/games/claim-reward/route.ts` |
| **Build passe** | ✅ | `npm run build` |
| **Utilisateur connecté** | ⬜ | Se connecter sur le site |
| **Cookies présents** | ⬜ | DevTools > Application > Cookies |
| **Coupon WIN10 existe** | ⬜ | Table `coupon_types` |
| **Jeu a un coupon** | ⬜ | `/admin/card-flip` |

---

## Commandes Utiles

### Vérifier le middleware
```bash
ls -lh middleware.ts
cat middleware.ts
```

### Vérifier l'API route
```bash
grep -n "createServerClient" app/api/games/claim-reward/route.ts
```

### Redémarrer le serveur
```bash
# Ctrl+C pour arrêter
npm run dev
```

### Vérifier les variables d'environnement
```bash
grep NEXT_PUBLIC_SUPABASE_URL .env
```

---

## Architecture Complète

```
┌──────────────┐
│  Utilisateur │
│  (Browser)   │
└──────┬───────┘
       │
       │ 1. POST /api/games/claim-reward
       │    (cookies envoyés automatiquement)
       │
       ▼
┌──────────────────────────────┐
│  Middleware (middleware.ts)  │
│  - Intercepte la requête     │
│  - Rafraîchit le token       │
│  - Met à jour les cookies    │
└──────┬───────────────────────┘
       │
       │ 2. Cookies à jour
       │
       ▼
┌─────────────────────────────────────┐
│  API Route (claim-reward/route.ts)  │
│  - Crée createServerClient          │
│  - Lit cookies()                    │
│  - Vérifie getSession()             │
│  - Log l'état d'auth                │
└──────┬──────────────────────────────┘
       │
       │ 3. Si session OK
       │
       ▼
┌─────────────────────────────┐
│  Base de données            │
│  - Vérifie coupon_type      │
│  - Insère user_coupon       │
│  - Retourne succès          │
└─────────────────────────────┘
```

---

## Résolution des Erreurs Courantes

### Erreur : "Non authentifié - Veuillez vous reconnecter"

**Diagnostic :**
```javascript
// Dans les logs serveur :
[claim-reward] No session found
```

**Solutions :**
1. Se reconnecter
2. Vérifier les cookies dans DevTools
3. Vérifier que le middleware est bien déployé
4. Redémarrer le serveur de dev

---

### Erreur : "Type de coupon introuvable"

**Diagnostic :**
```javascript
// Réponse API :
{
  error: "Type de coupon introuvable",
  coupon_code: "WIN10",
  message: "Le type de coupon doit être configuré..."
}
```

**Solutions :**
1. Créer le coupon dans `/admin/coupons`
2. Vérifier le code exact (WIN10, pas win10)
3. Vérifier que le coupon est actif

---

### Erreur : "Invalid Refresh Token" (dans les logs)

**Cause :** Le middleware n'est pas actif

**Solutions :**
1. Vérifier que `middleware.ts` existe à la racine
2. Redémarrer complètement le serveur
3. Vider les cookies et se reconnecter

---

## Prochaines Étapes

Si tout fonctionne :
1. ✅ Configurer tous les jeux avec des coupons
2. ✅ Créer les catégories manquantes
3. ✅ Tester en conditions réelles avec plusieurs utilisateurs
4. ✅ Déployer en production

---

## Support

**Fichiers de référence :**
- `CORRECTION-API-AUTH-COOKIES.md` - Documentation technique
- `RAPPORT-MIDDLEWARE-AUTH.md` - Rapport de création du middleware
- `.bolt/AI-INSTRUCTIONS.md` - Instructions pour l'IA

**Logs utiles :**
- Console navigateur (F12) - Erreurs frontend
- Terminal serveur - Logs backend avec `[claim-reward]`
- DevTools Network - Requêtes/réponses HTTP

---

**Auteur :** Assistant IA
**Date :** 15 janvier 2026
**Version :** 1.0
