# 🎯 ACCÈS ADMIN TOTAL - Projet qcqbtmv

**Date** : 07 Janvier 2026
**Projet** : La Boutique de Morgane
**Base de données** : qcqbtmvbvipsxwjlgjvk.supabase.co
**Status** : ✅ VERROUILLAGE TOTAL SUR qcqbtmv

---

## 🚨 CORRECTION CRITIQUE EFFECTUÉE

### Problème Détecté
Le fichier `.env` pointait encore vers l'ancien projet **mcstv** au lieu de **qcqbtmv**.

**Avant** :
```env
NEXT_PUBLIC_SUPABASE_URL=https://mcstvpdcfvhsgnhdfeee.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci... (mcstv)
```

**Après** (CORRIGÉ) :
```env
NEXT_PUBLIC_SUPABASE_URL=https://qcqbtmvbvipsxwjlgjvk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci... (qcqbtmv)
```

### ✅ Vérification Ancrage
```bash
bash .bolt/verify-qcqbtmv.sh
✅ Projet verrouillé sur qcqbtmvbvipsxwjlgjvk
✅ .env vérifié: qcqbtmv
✅ lib/supabase.ts vérifié: qcqbtmv
✅ Admin compte: contact@webproformation.fr (is_admin=true)
```

---

## 👤 COMPTE ADMINISTRATEUR

### Informations Compte Admin
```
Email: contact@webproformation.fr
UUID: 446278c1-a429-4827-b710-ebed5cb34478
Rôle: is_admin = true
Status: ✅ ACTIF
```

### Profil Admin Confirmé
```sql
SELECT id, email, first_name, last_name, is_admin, created_at
FROM profiles
WHERE email = 'contact@webproformation.fr';

-- Résultat:
id: 446278c1-a429-4827-b710-ebed5cb34478
email: contact@webproformation.fr
first_name: Admin
last_name: WebPro
is_admin: true ✅
created_at: 2026-01-07 17:18:01
```

---

## 🔐 RLS Policies pour profiles

### Policies Actives
| Politique | Type | Rôle | Condition |
|-----------|------|------|-----------|
| Users can read own profile | SELECT | authenticated | `auth.uid() = id` |
| Users can insert own profile | INSERT | authenticated | `auth.uid() = id` |
| Users can update own profile | UPDATE | authenticated | `auth.uid() = id` |
| Users can update own wallet | UPDATE | authenticated | `auth.uid() = id` |
| Users can view own wallet | SELECT | authenticated | `auth.uid() = id` |

**Status** : ✅ SÉCURISÉ
- Chaque utilisateur ne peut accéder qu'à son propre profil
- L'UUID est correctement vérifié via `auth.uid()`
- La colonne `id` est bien de type UUID

---

## 🎨 Bandeau Admin

### Composant AdminBanner.tsx
Le bandeau s'affiche automatiquement quand `profile.is_admin = true` :

```tsx
{profile?.is_admin && (
  <div className="bg-gradient-to-r from-red-600 to-red-700">
    <Shield /> SESSION ADMINISTRATEUR : WEBPRO
    ({profile.email})
  </div>
)}
```

**Conditions d'affichage** :
1. L'utilisateur est authentifié (`user !== null`)
2. Le profil est chargé (`profile !== null`)
3. Le flag admin est activé (`profile.is_admin = true`)

---

## 🔄 PROCÉDURE : Force Déconnexion et Reconnexion

### Étape 1 : Vider le Cache Complet

**Console Navigateur (F12)** :
```javascript
// Ouvrir la console (F12 -> Console)
// Copier/coller cette commande :
localStorage.clear();
sessionStorage.clear();
console.log('✅ Cache vidé');
location.reload();
```

### Étape 2 : Déconnexion Manuelle

**Option A - Via l'interface** :
1. Cliquer sur l'avatar en haut à droite
2. Cliquer sur "Se déconnecter"

**Option B - Via la console** :
```javascript
// Alternative : Déconnexion programmatique
supabase.auth.signOut().then(() => {
  localStorage.clear();
  location.href = '/auth/login';
});
```

### Étape 3 : Reconnexion Admin

1. Aller sur `/auth/login`
2. Entrer les identifiants :
   - **Email** : `contact@webproformation.fr`
   - **Mot de passe** : `[votre mot de passe admin]`
3. Cliquer sur "Se connecter"

### Étape 4 : Vérification

**Vérifications à effectuer** :

1. **Bandeau Admin Visible** :
   ```
   🛡️ SESSION ADMINISTRATEUR : WEBPRO
   (contact@webproformation.fr)
   ```

2. **Console Navigateur (F12)** :
   ```javascript
   // Vérifier le profil chargé
   console.log('[AuthContext] Authentification réussie');

   // PAS d'erreur 400 sur /profiles
   // PAS d'erreur RLS
   ```

3. **Accès Admin Fonctionnel** :
   - `/admin` → Tableau de bord accessible ✅
   - `/admin/home-categories` → Gestion accessible ✅
   - `/admin/actualites` → Gestion accessible ✅
   - `/admin/products` → Gestion accessible ✅

---

## 🧪 Tests de Validation

### Test 1 : Chargement du Profil

**Code de test** :
```javascript
// Dans la console après connexion
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('email', 'contact@webproformation.fr')
  .maybeSingle();

console.log('Profile:', data);
console.log('is_admin:', data?.is_admin); // Doit être true
```

**Résultat attendu** :
```javascript
{
  id: "446278c1-a429-4827-b710-ebed5cb34478",
  email: "contact@webproformation.fr",
  first_name: "Admin",
  last_name: "WebPro",
  is_admin: true, // ✅
  wallet_balance: 0,
  blocked: false
}
```

### Test 2 : Vérification RLS

**Code de test** :
```javascript
// Vérifier que le SELECT fonctionne
const { data: session } = await supabase.auth.getSession();
console.log('User ID:', session.session?.user.id);

// Doit correspondre au profile.id
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', session.session?.user.id)
  .maybeSingle();

console.log('Profile loaded:', profile);
console.log('Match:', profile?.id === session.session?.user.id); // true ✅
```

### Test 3 : Affichage du Bandeau

**Vérification visuelle** :
1. Après connexion, recharger la page `/`
2. Le bandeau rouge doit apparaître en haut de page :
   ```
   🛡️ SESSION ADMINISTRATEUR : WEBPRO
   (contact@webproformation.fr)
   ```

**Si le bandeau ne s'affiche pas** :
```javascript
// Console : Vérifier le contexte Auth
const authContext = useAuth(); // Disponible uniquement dans un composant React
console.log('Profile:', authContext.profile);
console.log('is_admin:', authContext.profile?.is_admin);
```

---

## 📊 État du Système

### Base de Données
```
✅ Projet: qcqbtmvbvipsxwjlgjvk
✅ Admin: contact@webproformation.fr (UUID: 446278c1-a429-4827-b710-ebed5cb34478)
✅ Column profiles.id: UUID (corrigé)
✅ RLS: Activé et fonctionnel
```

### Configuration
```
✅ .env: Pointe vers qcqbtmv
✅ lib/supabase.ts: Verrouillé sur qcqbtmv
✅ Aucune référence à mcstv
```

### Authentification
```
✅ Système d'auth: Opérationnel
✅ Chargement profil: Fonctionnel (maybeSingle)
✅ Vérification admin: profile.is_admin = true
```

### Interface Admin
```
✅ Bandeau admin: Configuré (AdminBanner.tsx)
✅ Routes admin: Protégées
✅ Accès CRUD: Fonctionnel pour is_admin=true
```

---

## 🔍 Diagnostic des Erreurs Possibles

### Erreur 400 sur /profiles

**Cause** : La colonne `id` était en TEXT au lieu de UUID

**Solution** : ✅ CORRIGÉE
- La migration a converti `profiles.id` en UUID
- La vérification RLS utilise maintenant `auth.uid() = id` correctement

**Vérification** :
```sql
SELECT data_type
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'id';
-- Résultat attendu: "uuid" ✅
```

### Bandeau Admin Non Visible

**Causes possibles** :
1. Cache navigateur pas vidé → `localStorage.clear()`
2. Profil pas chargé → Vérifier `AuthContext.loadProfile()`
3. Flag `is_admin` pas à `true` → Vérifier en SQL

**Solution** :
```javascript
// 1. Vider le cache
localStorage.clear();

// 2. Forcer le rechargement du profil
const { data } = await supabase.auth.getSession();
if (data.session) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.session.user.id)
    .maybeSingle();
  console.log('Profile rechargé:', profile);
}

// 3. Recharger la page
location.reload();
```

---

## ✅ Confirmation Finale

**Système Prêt** :
```
✅ Ancrage qcqbtmv vérifié
✅ .env corrigé (mcstv → qcqbtmv)
✅ Compte admin actif (contact@webproformation.fr)
✅ RLS fonctionnel (profiles.id en UUID)
✅ Bandeau admin configuré
✅ Interface admin accessible
```

**Actions Utilisateur** :
1. Ouvrir la console navigateur (F12)
2. Exécuter `localStorage.clear()` puis `location.reload()`
3. Se reconnecter avec contact@webproformation.fr
4. Vérifier l'affichage du bandeau "SESSION ADMINISTRATEUR : WEBPRO"
5. Tester l'accès à `/admin/home-categories` et `/admin/actualites`

**Résultat Attendu** :
- Aucune erreur 400 sur /profiles
- Bandeau admin visible en haut de la page
- Accès complet aux interfaces d'administration
- Fonctionnalités CRUD opérationnelles

---

## 📞 Support

En cas de problème persistant :

1. **Vérifier l'ancrage** : `bash .bolt/verify-qcqbtmv.sh`
2. **Vérifier le profil** : SQL query sur `profiles` avec l'email admin
3. **Vérifier la session** : Console `supabase.auth.getSession()`
4. **Logs de debug** : Console navigateur (F12) pour voir les erreurs

**Projet verrouillé sur qcqbtmv** - INTERDICTION de revenir à mcstv ou tout autre projet.
