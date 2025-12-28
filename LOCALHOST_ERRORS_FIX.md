# Guide de Résolution des Erreurs Localhost

## Erreurs Corrigées

### ✅ 1. Invalid Refresh Token (Supabase)

**Erreur** : `AuthApiError: Invalid Refresh Token: Refresh Token Not Found`

**Cause** : Token d'authentification expiré ou corrompu dans le localStorage

**Solution implémentée** :
- Détection automatique des erreurs d'authentification
- Nettoyage automatique du localStorage
- Déconnexion propre en cas d'erreur

**Actions manuelles si le problème persiste** :

1. **Option A : Page de nettoyage automatique**
   - Accédez à : http://localhost:3000/clear-auth
   - Cliquez sur "Nettoyer et déconnecter"
   - Reconnectez-vous

2. **Option B : Console du navigateur**
   ```javascript
   // Ouvrez la console (F12) et exécutez :
   for (let i = 0; i < localStorage.length; i++) {
     const key = localStorage.key(i);
     if (key && key.startsWith('sb-')) {
       localStorage.removeItem(key);
     }
   }
   location.reload();
   ```

3. **Option C : Effacer toutes les données du site**
   - Chrome/Edge : F12 → Application → Storage → Clear site data
   - Firefox : F12 → Storage → Effacer tout

---

### ✅ 2. OneSignal AppID doesn't match

**Erreur** : `AppID doesn't match existing apps`

**Cause** :
- AppID codé en dur ne correspondait pas à l'AppID dans les variables d'environnement
- Variables d'environnement mal formatées dans .env

**Solution implémentée** :
- Utilisation de `NEXT_PUBLIC_ONESIGNAL_APP_ID` depuis les variables d'environnement
- Correction du fichier .env (les clés étaient collées ensemble)
- Ajout de vérifications pour éviter l'erreur si AppID non configuré

**Vérification** :
```bash
# Vérifiez que votre .env contient :
ONESIGNAL_API_KEY=os_v2_app_...
ONESIGNAL_APP_ID=lyw37xkvbuyieuz6uhondc5co
NEXT_PUBLIC_ONESIGNAL_APP_ID=lyw37xkvbuyieuz6uhondc5co
```

---

### ✅ 3. OneSignal SDK already initialized

**Erreur** : `SDK already initialized`

**Cause** :
- React en mode développement monte/démonte les composants (StrictMode)
- Le SDK OneSignal était initialisé plusieurs fois

**Solution implémentée** :
- Utilisation de `useRef` pour éviter les initialisations multiples
- Vérification si le script est déjà chargé
- Vérification si OneSignal est déjà initialisé
- Désactivation du prompt en localhost
- Gestion d'erreur avec try/catch

---

## Vérification Complète

### 1. Vérifier le fichier .env

```bash
cat .env | grep -E "(SUPABASE|ONESIGNAL|STRIPE)"
```

Résultat attendu :
```
NEXT_PUBLIC_SUPABASE_URL=https://ftgclacfleknkqbfbsbs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0Z2NsYWNmbGVrbmtxYmZic2JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMzA3NjUsImV4cCI6MjA4MDYwNjc2NX0.fZ_yi8opM3kQ4T-hCagMebTvM7spx7tIMZvaTBPBSe8
ONESIGNAL_API_KEY=os_v2_app_...
ONESIGNAL_APP_ID=rqsjl3cqyegwv2lpyae34ra2v
NEXT_PUBLIC_ONESIGNAL_APP_ID=rqsjl3cqyegwv2lpyae34ra2v
STRIPE_SECRET_KEY=rk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 2. Redémarrer le serveur de développement

```bash
# Arrêtez le serveur (Ctrl+C) puis :
npm run dev
```

### 3. Tester dans un navigateur propre

```bash
# Chrome (mode incognito)
# Ou effacez le cache/localStorage
```

### 4. Vérifier la console

Ouvrez la console du navigateur (F12) et vérifiez qu'il n'y a plus :
- ❌ `Invalid Refresh Token`
- ❌ `AppID doesn't match`
- ❌ `SDK already initialized`

Vous devriez voir :
- ✅ Aucune erreur Supabase
- ✅ `OneSignal: APP_ID not configured` (en localhost, c'est normal si vous n'utilisez pas les notifications)
- ✅ Ou `OneSignal already initialized` (une seule fois, c'est OK)

---

## Nouveaux Fichiers Créés

### 1. `/lib/auth-cleanup.ts`
Utilitaires pour nettoyer l'authentification :
- `clearSupabaseAuth()` : Supprime tous les tokens Supabase du localStorage
- `isAuthError()` : Détecte si une erreur est liée à l'authentification

### 2. `/app/clear-auth/page.tsx`
Page de nettoyage manuel accessible à :
- http://localhost:3000/clear-auth

### 3. Modifications du fichier `.env`
- Correction de la ligne 23 qui contenait deux clés collées
- Ajout de `NEXT_PUBLIC_ONESIGNAL_APP_ID`

### 4. Modifications de `OneSignalProvider.tsx`
- Utilisation de `useRef` pour éviter les double initialisations
- Lecture de l'AppID depuis les variables d'environnement
- Désactivation du prompt en localhost
- Meilleure gestion des erreurs

### 5. Modifications de `AuthContext.tsx`
- Import de `clearSupabaseAuth` et `isAuthError`
- Détection automatique des erreurs de token
- Nettoyage automatique en cas d'erreur
- Gestion de l'événement `TOKEN_REFRESH_ERROR`

---

## Tests Post-Correction

### Test 1 : Supabase Auth
```bash
# 1. Ouvrez http://localhost:3000
# 2. Essayez de vous connecter
# 3. Vérifiez qu'il n'y a pas d'erreur de token dans la console
```

### Test 2 : OneSignal
```bash
# 1. Ouvrez la console du navigateur (F12)
# 2. Vérifiez qu'il n'y a qu'un seul message OneSignal
# 3. Rafraîchissez la page (F5)
# 4. Vérifiez qu'il n'y a pas de "SDK already initialized"
```

### Test 3 : Navigation
```bash
# 1. Naviguez entre plusieurs pages
# 2. Vérifiez qu'il n'y a pas d'erreurs dans la console
# 3. Testez le panier, la wishlist, etc.
```

---

## Si les Erreurs Persistent

### 1. Vérifiez les variables d'environnement

```bash
# Arrêtez le serveur
# Vérifiez le .env
cat .env

# Assurez-vous qu'il n'y a pas de lignes cassées
# Chaque variable doit être sur une seule ligne
```

### 2. Supprimez le cache Next.js

```bash
rm -rf .next
npm run dev
```

### 3. Réinstallez les dépendances

```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### 4. Testez en mode production

```bash
npm run build
npm run start
```

### 5. Vérifiez les versions

```bash
npx next info
```

Versions attendues :
- Next.js : 16.0.7
- React : 19.2.1
- Node : 18+ ou 20+

---

## Logs Utiles pour le Débogage

### Console navigateur (F12)

Vous devriez voir en cas de succès :
```
Token refreshed successfully
```

En cas de problème :
```
Session error: [détails]
Auth error detected, clearing localStorage
Cleared X Supabase auth items from localStorage
```

### Console serveur (terminal)

Aucun message d'erreur lié à Supabase ou OneSignal ne devrait apparaître.

---

## Prévention Future

### 1. Ne jamais modifier manuellement le localStorage

Le localStorage Supabase est géré automatiquement. Ne le modifiez jamais manuellement.

### 2. Déconnectez-vous proprement

Utilisez toujours le bouton "Déconnexion" au lieu de fermer l'onglet.

### 3. Mettez à jour régulièrement

```bash
npm update @supabase/supabase-js
npm update next
```

### 4. Utilisez la page de nettoyage

En cas de doute, allez sur http://localhost:3000/clear-auth

---

## Contact Support

Si les problèmes persistent :

1. **Supabase** : https://supabase.com/support
2. **OneSignal** : https://onesignal.com/support
3. **Next.js** : https://nextjs.org/docs

---

## Résumé des Corrections

| Erreur | Fichier Modifié | Action |
|--------|-----------------|---------|
| Invalid Refresh Token | `context/AuthContext.tsx` | Détection et nettoyage auto |
| Invalid Refresh Token | `lib/auth-cleanup.ts` | Nouveau fichier utilitaire |
| Invalid Refresh Token | `app/clear-auth/page.tsx` | Page de nettoyage manuel |
| AppID doesn't match | `.env` | Correction du format |
| AppID doesn't match | `components/OneSignalProvider.tsx` | Lecture depuis env vars |
| SDK already initialized | `components/OneSignalProvider.tsx` | Utilisation de useRef |

---

**Les 3 erreurs sont maintenant corrigées et ne devraient plus apparaître.**

Si vous voyez encore des erreurs, suivez les étapes de ce guide ou accédez à `/clear-auth` pour un nettoyage rapide.
