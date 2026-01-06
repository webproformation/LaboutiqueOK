# 🛡️ Création d'un Compte Administrateur

## 📋 ÉTAPE 1 : Créer le compte via l'interface

### Credentials du compte test :
```
📧 Email    : admin@lbdm-test.com
🔑 Password : AdminLBDM2024!
👤 Prénom   : Admin
👤 Nom      : Morgane
```

### Actions :
1. Ouvrir le site : `http://localhost:3000`
2. Cliquer sur l'icône Utilisateur (en haut à droite)
3. Cliquer sur "Créer un compte"
4. Remplir le formulaire avec les informations ci-dessus
5. Valider

---

## 📋 ÉTAPE 2 : Rendre le compte Administrateur

### Option A : Via l'interface Supabase (Recommandé)

1. Ouvrir [Supabase Dashboard](https://supabase.com/dashboard/project/qcqbtmvbvipsxwjlgjvk)
2. Aller dans **Table Editor** → Table `profiles`
3. Trouver la ligne avec l'email `admin@lbdm-test.com`
4. Double-cliquer sur la colonne `is_admin`
5. Changer de `false` à `true`
6. Sauvegarder

### Option B : Via SQL

Si vous préférez utiliser SQL :

```sql
-- Dans l'éditeur SQL de Supabase
UPDATE profiles
SET is_admin = true
WHERE email = 'admin@lbdm-test.com';
```

---

## 📋 ÉTAPE 3 : Vérifier l'accès Admin

1. **Se déconnecter** si vous êtes déjà connecté
2. **Se reconnecter** avec les identifiants admin
3. Cliquer sur l'icône Utilisateur en haut à droite
4. Vous devriez voir le menu avec :
   - **⚡ Administration** (en doré/gradient) ← C'EST LE LIEN ADMIN !
   - Mon compte
   - Mes commandes
   - Mes adresses
   - Déconnexion

5. Cliquer sur **Administration** → Vous accédez à `/admin`

---

## 🔍 Dépannage

### Le lien "Administration" n'apparaît pas

**Causes possibles :**
1. ❌ Le champ `is_admin` n'est pas à `true` dans la table `profiles`
2. ❌ Vous n'avez pas actualisé la page après la modification
3. ❌ Le profil n'a pas été créé automatiquement

**Solutions :**
```sql
-- Vérifier l'état du profil
SELECT id, email, first_name, last_name, is_admin
FROM profiles
WHERE email = 'admin@lbdm-test.com';

-- Créer le profil si manquant (remplacer USER_ID par l'ID Supabase)
INSERT INTO profiles (id, email, first_name, last_name, is_admin, wallet_balance)
VALUES (
  'USER_ID_FROM_AUTH_USERS',
  'admin@lbdm-test.com',
  'Admin',
  'Morgane',
  true,
  0
);
```

### Le header reste statique

**Vérifications :**
1. Ouvrez la console du navigateur (F12)
2. Vérifiez les logs : Vous devriez voir `🔍 SiteHeader - État Auth:`
3. Si aucun log n'apparaît, videz le cache du navigateur (Ctrl+Shift+R)
4. Si le problème persiste, relancez le serveur de développement

---

## ✅ Résultat attendu

Une fois connecté en tant qu'admin, vous devriez voir :

**Menu utilisateur :**
```
╔════════════════════════════════╗
║  Admin Morgane                 ║
║  admin@lbdm-test.com           ║
╠════════════════════════════════╣
║  🛡️ Administration             ║  ← DORÉ/GRADIENT
╠════════════════════════════════╣
║  👤 Mon compte                 ║
║  📦 Mes commandes              ║
║  📍 Mes adresses               ║
╠════════════════════════════════╣
║  🚪 Déconnexion                ║
╚════════════════════════════════╝
```

---

## 🔐 Sécurité

- ⚠️ Ces identifiants sont pour **test uniquement**
- ⚠️ Changez le mot de passe en production
- ⚠️ Ne commitez JAMAIS de credentials admin dans Git
- ⚠️ En production, gérez les admins via un processus sécurisé

---

## 📝 Créer d'autres admins

Pour rendre n'importe quel utilisateur admin :

```sql
UPDATE profiles
SET is_admin = true
WHERE email = 'email-de-lutilisateur@example.com';
```

Pour retirer le statut admin :

```sql
UPDATE profiles
SET is_admin = false
WHERE email = 'email-de-lutilisateur@example.com';
```

---

**Dernière mise à jour** : 2026-01-06
**Projet** : qcqbtmvbvipsxwjlgjvk (La Boutique de Morgane)
