# ✅ TEST FINAL : API Claim Reward avec Auth Hybride

**Date :** 15 janvier 2026
**Statut :** READY FOR PRODUCTION

---

## État Actuel

### 1. Fichier API ✅
**Fichier :** `app/api/games/claim-reward/route.ts`
**Statut :** Présent et configuré avec authentification hybride

### 2. Build ✅
**Commande :** `npm run build`
**Statut :** Succès
**Route API :** `/api/games/claim-reward` (λ Server-side)

### 3. Frontend ✅
**Fichier :** `components/CardFlipGame.tsx`
**Lignes 124-131 :** Envoi du token Bearer
**Statut :** Configuré

---

## Authentification Hybride Implémentée

### Backend (route.ts)
```typescript
// TENTATIVE 1 : Cookie (Standard)
const { data: userDataCookie } = await supabase.auth.getUser();
user = userDataCookie.user;

// TENTATIVE 2 : Token Bearer (Fallback)
if (!user) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    const { data: userDataToken } = await supabase.auth.getUser(token);
    user = userDataToken.user;
  }
}
```

### Frontend (CardFlipGame.tsx)
```typescript
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

const response = await fetch('/api/games/claim-reward', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  },
  body: JSON.stringify({ /* ... */ }),
});
```

---

## Tests à Effectuer en Production

### Test 1 : Vérifier le Token (Console Navigateur)

```javascript
// F12 → Console
const { data: { session } } = await window.supabase.auth.getSession();
console.log('Session:', !!session);
console.log('Token:', session?.access_token ? 'Présent ✅' : 'Absent ❌');
```

**Attendu :** Token présent si connecté

---

### Test 2 : Jouer au Card Flip Game

1. Se connecter au site
2. Accéder à un jeu de Card Flip actif
3. Jouer et gagner
4. Vérifier la notification

**Attendu :**
- ✅ Notification de succès
- ✅ Coupon ajouté dans "Mon compte → Mes coupons"
- ✅ Pas d'erreur 401 ou 404

---

### Test 3 : Vérifier les Logs Serveur

**Console serveur (Vercel/Netlify) :**

```
[claim-reward] Auth via Cookie        → Cookie fonctionne
[claim-reward] Auth via Token Bearer  → Token fonctionne (Fallback)
```

---

### Test 4 : Vérifier les Headers (DevTools)

1. F12 → Network
2. Jouer au jeu
3. Filtrer par "claim-reward"
4. Onglet Headers → Request Headers

**Vérifier :**
```
Authorization: Bearer eyJhbGc...
Content-Type: application/json
Cookie: sb-qcqbtmvbvipsxwjlgjvk-auth-token=...
```

---

## Scénarios de Test

### ✅ Scénario 1 : Utilisateur Connecté - Première Victoire
**Action :** Jouer et gagner
**Attendu :**
- Status 200
- `{ success: true, message: 'Coupon attribué avec succès', coupon: {...} }`
- Coupon visible dans "Mon compte"

---

### ✅ Scénario 2 : Utilisateur Connecté - Coupon Déjà Possédé
**Action :** Jouer et gagner (même coupon)
**Attendu :**
- Status 200
- `{ success: true, message: 'Vous possédez déjà ce coupon', already_owned: true }`
- Toast info "Vous possédez déjà ce coupon"

---

### ✅ Scénario 3 : Utilisateur Connecté - Défaite
**Action :** Jouer et perdre
**Attendu :**
- Status 200
- `{ success: true, message: 'Partie enregistrée', has_won: false }`
- Toast erreur "Dommage..."

---

### ❌ Scénario 4 : Utilisateur Non Connecté
**Action :** Essayer de jouer
**Attendu :**
- Blocage côté frontend
- Message "Connectez-vous pour jouer"
- Pas d'appel API

---

### ❌ Scénario 5 : Token Invalide
**Action :** Token expiré ou corrompu
**Attendu :**
- Status 401
- `{ error: 'Non authentifié - Echec Cookie ET Token' }`

---

## Checklist de Validation

### Avant le Test
- [x] Fichier API existe (`app/api/games/claim-reward/route.ts`)
- [x] Build réussi (`npm run build`)
- [x] Frontend envoie le token (`CardFlipGame.tsx` ligne 131)
- [x] Auth hybride implémentée (Cookie + Token Bearer)

### Pendant le Test
- [ ] Utilisateur peut se connecter
- [ ] Token est présent dans la session
- [ ] Card Flip Game s'affiche
- [ ] Jeu fonctionne (cartes se retournent)
- [ ] Aucune erreur 404 sur `/api/games/claim-reward`
- [ ] Aucune erreur 401 "Auth session missing"

### Après Victoire
- [ ] Notification de succès affichée
- [ ] Coupon visible dans "Mon compte → Mes coupons"
- [ ] Code unique généré (ex: `WIN5-lkj3m2n1`)
- [ ] `valid_until` = 30 jours dans le futur
- [ ] Entrée dans `user_coupons` avec `is_used = false`

---

## Débogage

### Problème : Erreur 404
**Cause :** Build incomplet ou route mal configurée
**Solution :**
```bash
rm -rf .next
npm run build
npm run start
```

---

### Problème : Erreur 401 "Auth session missing"
**Cause :** Cookie échoue ET Token Bearer n'est pas envoyé
**Solution :**
1. Vérifier que le token est envoyé dans le header `Authorization`
2. Vérifier les logs serveur pour voir quelle méthode échoue
3. Se reconnecter et vider le cache

---

### Problème : Erreur 500
**Cause :** Erreur base de données ou logique métier
**Solution :**
1. Vérifier les logs serveur (console.error)
2. Vérifier que `coupon_types` contient le coupon
3. Vérifier que l'utilisateur existe dans `profiles`

---

### Problème : Token Absent
**Cause :** Session non disponible
**Solution :**
```javascript
// Console navigateur
const { data: { session }, error } = await window.supabase.auth.getSession();
if (error) console.error('Erreur session:', error);
if (!session) console.log('Pas de session → Reconnectez-vous');
```

---

## Commandes Utiles

### Vérifier le Build
```bash
npm run build
# Chercher : "λ /api/games/claim-reward"
```

### Redémarrer le Serveur
```bash
npm run start
```

### Vérifier les Logs Production (Vercel)
```bash
vercel logs <deployment-url>
```

### Vérifier la Structure de l'API
```bash
ls -la app/api/games/claim-reward/
# Doit afficher : route.ts
```

---

## Résumé Technique

| Composant | Fichier | Statut | Description |
|-----------|---------|--------|-------------|
| API Route | `app/api/games/claim-reward/route.ts` | ✅ | Auth Hybride (Cookie + Token) |
| Frontend | `components/CardFlipGame.tsx` | ✅ | Envoie Token Bearer |
| Build | `.next/` | ✅ | Compilé avec succès |
| Auth | Cookie + Token | ✅ | Fallback automatique |

---

## Prochaines Étapes

1. **Redémarrer le serveur** : `npm run start` (si en local)
2. **Tester en production** : Jouer au Card Flip Game
3. **Vérifier les logs** : Console serveur pour voir `[claim-reward] Auth via...`
4. **Valider les coupons** : "Mon compte → Mes coupons"

---

## Conclusion

L'authentification hybride est implémentée et le build est réussi. Le système est prêt pour les tests en production.

**Fichiers modifiés :**
- ✅ `app/api/games/claim-reward/route.ts` (Auth Hybride)
- ✅ `components/CardFlipGame.tsx` (Envoi Token Bearer)
- ✅ Build complet

**Le problème 404 devrait être résolu après redémarrage du serveur.**

---

**Auteur :** Assistant IA
**Date :** 15 janvier 2026
**Version :** Production Ready
