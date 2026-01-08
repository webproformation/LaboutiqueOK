# 🎯 INSTRUCTIONS : Reconnexion Admin - Projet qcqbtmv

**URGENT** : Le fichier `.env` pointait vers l'ancien projet **mcstv**. Il a été corrigé pour pointer vers **qcqbtmv**.

Vous devez maintenant **forcer la déconnexion** et **vider le cache** pour que les changements prennent effet.

---

## 🚨 CORRECTION EFFECTUÉE

### Avant (MAUVAIS)
```env
NEXT_PUBLIC_SUPABASE_URL=https://mcstvpdcfvhsgnhdfeee.supabase.co
```

### Après (CORRIGÉ)
```env
NEXT_PUBLIC_SUPABASE_URL=https://qcqbtmvbvipsxwjlgjvk.supabase.co
```

---

## 📋 PROCÉDURE DE RECONNEXION (3 méthodes)

### ⚡ MÉTHODE 1 : Page de Nettoyage Automatique (RECOMMANDÉE)

1. **Ouvrir la page de nettoyage** :
   ```
   http://localhost:3000/clear-cache.html
   ```

2. **Cliquer sur le bouton** :
   ```
   🗑️ Vider le Cache et Déconnecter
   ```

3. **Attendre le rechargement automatique**

4. **Se reconnecter** :
   - Email : `contact@webproformation.fr`
   - Mot de passe : `[votre mot de passe admin]`

---

### 🖥️ MÉTHODE 2 : Console Navigateur (Manuel)

1. **Ouvrir la console** :
   - Windows/Linux : `F12` ou `Ctrl + Shift + I`
   - Mac : `Cmd + Option + I`

2. **Aller dans l'onglet "Console"**

3. **Copier/coller cette commande** :
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   console.log('✅ Cache vidé');
   location.href = '/auth/login';
   ```

4. **Appuyer sur Entrée**

5. **Se reconnecter** avec `contact@webproformation.fr`

---

### 🌐 MÉTHODE 3 : Incognito + Reconnexion

1. **Ouvrir une fenêtre de navigation privée** :
   - Chrome : `Ctrl + Shift + N`
   - Firefox : `Ctrl + Shift + P`
   - Safari : `Cmd + Shift + N`

2. **Aller sur** :
   ```
   http://localhost:3000/auth/login
   ```

3. **Se connecter** :
   - Email : `contact@webproformation.fr`
   - Mot de passe : `[votre mot de passe admin]`

---

## ✅ VÉRIFICATIONS APRÈS RECONNEXION

### 1. Bandeau Admin Visible

Après connexion, vous devez voir en haut de la page :

```
🛡️ SESSION ADMINISTRATEUR : WEBPRO
(contact@webproformation.fr)
```

**Si le bandeau n'apparaît pas** :
- Vider à nouveau le cache (MÉTHODE 1 ou 2)
- Vérifier que vous êtes bien connecté avec `contact@webproformation.fr`
- Ouvrir la console (F12) et vérifier les erreurs

---

### 2. Console Sans Erreurs

**Ouvrir la console (F12)** et vérifier :

✅ **Attendu (PAS d'erreurs)** :
```
✅ Projet verrouillé sur qcqbtmvbvipsxwjlgjvk
```

❌ **Si vous voyez ces erreurs** :
```
❌ Error 400 Bad Request sur /profiles
❌ RLS policy violation
```

**Solution** : Recommencer la MÉTHODE 1 ou 2

---

### 3. Accès Admin Fonctionnel

Testez l'accès aux pages admin :

| Page | URL | Status Attendu |
|------|-----|----------------|
| Tableau de bord | `/admin` | ✅ Accessible |
| Home Categories | `/admin/home-categories` | ✅ Accessible |
| Actualités | `/admin/actualites` | ✅ Accessible |
| Produits | `/admin/products` | ✅ Accessible |

**Si vous avez un "403 Forbidden"** :
- Vérifier que `is_admin = true` en base de données
- Forcer la déconnexion et se reconnecter

---

## 🔍 DIAGNOSTIC RAPIDE

### Vérifier le Projet Actif

**Console (F12)** :
```javascript
// Vérifier quelle base de données est utilisée
console.log(window.location.origin);

// Devrait afficher: http://localhost:3000
// Avec connexion à qcqbtmvbvipsxwjlgjvk
```

### Vérifier le Profil Chargé

**Console (F12)** :
```javascript
// Vérifier le profil admin
const { data: session } = await supabase.auth.getSession();
console.log('User ID:', session.session?.user.id);

const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', session.session?.user.id)
  .maybeSingle();

console.log('Profile:', profile);
console.log('is_admin:', profile?.is_admin); // Doit être true
```

**Résultat attendu** :
```javascript
{
  id: "446278c1-a429-4827-b710-ebed5cb34478",
  email: "contact@webproformation.fr",
  first_name: "Admin",
  last_name: "WebPro",
  is_admin: true, // ✅ DOIT ÊTRE TRUE
  blocked: false
}
```

---

## 🎯 RÉSUMÉ RAPIDE

**3 étapes simples** :

1. **Nettoyage** :
   ```
   → http://localhost:3000/clear-cache.html
   → Cliquer sur "Vider le Cache et Déconnecter"
   ```

2. **Reconnexion** :
   ```
   → Email: contact@webproformation.fr
   → Mot de passe: [votre mot de passe]
   ```

3. **Vérification** :
   ```
   → Bandeau "SESSION ADMINISTRATEUR : WEBPRO" visible
   → Accès à /admin/home-categories fonctionnel
   → Console sans erreur 400 ou 403
   ```

---

## 🛡️ SÉCURITÉ

### Verrouillage Anti-Revert

Le projet est maintenant **verrouillé** sur `qcqbtmvbvipsxwjlgjvk`.

**Script de vérification** :
```bash
bash .bolt/verify-qcqbtmv.sh
```

**Résultat attendu** :
```
✅ Projet verrouillé sur qcqbtmvbvipsxwjlgjvk
✅ .env vérifié: qcqbtmv
✅ lib/supabase.ts vérifié: qcqbtmv
✅ Admin compte: contact@webproformation.fr (is_admin=true)
```

---

## 📞 SUPPORT

### Si le bandeau admin ne s'affiche toujours pas :

1. **Vérifier la base de données** :
   ```sql
   SELECT email, is_admin
   FROM profiles
   WHERE email = 'contact@webproformation.fr';
   ```
   → `is_admin` doit être `true`

2. **Vérifier le fichier .env** :
   ```bash
   cat .env | grep SUPABASE_URL
   ```
   → Doit contenir `qcqbtmvbvipsxwjlgjvk`

3. **Redémarrer le serveur** :
   ```bash
   # Arrêter le serveur (Ctrl+C)
   npm run dev
   ```

4. **Forcer un nouveau build** :
   ```bash
   npm run build
   npm run dev
   ```

---

## ✅ CONFIRMATION FINALE

Après avoir suivi cette procédure, vous devriez avoir :

```
✅ Cache navigateur vidé
✅ Nouvelle connexion avec contact@webproformation.fr
✅ Bandeau "SESSION ADMINISTRATEUR : WEBPRO" visible
✅ Accès complet à toutes les pages /admin/*
✅ Aucune erreur 400 ou 403 dans la console
✅ Projet verrouillé sur qcqbtmvbvipsxwjlgjvk
```

**Le système est maintenant prêt pour une utilisation administrative complète.**
