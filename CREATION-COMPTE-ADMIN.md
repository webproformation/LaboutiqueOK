# 🔐 CRÉATION COMPTE ADMIN - PROCÉDURE MANUELLE

**Date:** 2026-01-07
**Projet:** qcqbtmvbvipsxwjlgjvk
**Problème:** L'inscription automatique échoue sur ce projet Supabase

## Diagnostic

- ❌ Trigger `on_auth_user_created` cause des erreurs
- ❌ Même sans trigger, `auth.signUp` échoue avec "Database error saving new user"
- ❌ L'API Admin `createUser` échoue aussi
- ✅ Le fichier .env pointe bien sur qcqbtmv
- ✅ Le trigger a été désactivé temporairement

## Solution recommandée : Création via Dashboard Supabase

### Étape 1 : Accéder au Dashboard Supabase
1. Ouvrir https://supabase.com/dashboard/project/qcqbtmvbvipsxwjlgjvk
2. Aller dans Authentication > Users
3. Cliquer sur "Add user" > "Create new user"

### Étape 2 : Créer l'utilisateur
```
Email: contact@webproformation.fr
Password: WebPro2026!
Auto Confirm User: ✅ (cocher)
```

### Étape 3 : Créer le profil manuellement
Aller dans Table Editor > profiles > Insert row

```sql
id: [copier l'UUID de l'utilisateur créé à l'étape 2]
email: contact@webproformation.fr
full_name: Admin WebPro
first_name: Admin
last_name: WebPro
is_admin: true
blocked: false
wallet_balance: 0
cancelled_orders_count: 0
```

### Étape 4 : Réactiver le trigger
Exécuter dans SQL Editor :

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

### Étape 5 : Tester la connexion
```bash
node scripts/test-admin-login.js
```

## Alternative : Créer un nouveau compte utilisateur normal puis promouvoir

Si le dashboard ne fonctionne pas :

1. S'inscrire normalement sur le site via `/auth/register`
2. Une fois inscrit, exécuter ce SQL :

```sql
UPDATE public.profiles
SET is_admin = true
WHERE email = 'contact@webproformation.fr';
```

## Identifiants

```
Email: contact@webproformation.fr
Mot de passe: WebPro2026!
```

---

**Note:** Ce problème semble spécifique à ce projet Supabase. Les triggers et hooks fonctionnent normalement sur d'autres projets.
