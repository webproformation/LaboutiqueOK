# 🤖 INSTRUCTIONS POUR L'IA

## ⚠️ RÈGLES ABSOLUES - À LIRE AVANT TOUTE MODIFICATION

### 🔒 PROJET VERROUILLÉ

**Projet actif** : `qcqbtmvbvipsxwjlgjvk.supabase.co`
**Projet interdit** : `mcstvpdcfvhsgnhdfeee` (ne JAMAIS revenir dessus)

---

## 📋 AVANT TOUTE ACTION

1. **Exécuter le script de vérification** :
   ```bash
   ./.bolt/verify-project.sh
   ```

2. **Lire le verrou** :
   - Fichier : `.bolt/PROJECT-LOCK.json`
   - Confirmer : `project_id = qcqbtmvbvipsxwjlgjvk`

3. **Ne JAMAIS modifier** :
   - `lib/supabase.ts` (credentials hardcodés)
   - `.env` (projet qcqbtmv)

---

## 🏗️ ARCHITECTURE AUTHENTIFICATION

### Système actif : ZUSTAND STORE

**Store principal** : `stores/auth-store.ts`

```typescript
interface AuthState {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isLoading: boolean;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
}
```

### ⚠️ ATTENTION : DEUX SYSTÈMES EN PARALLÈLE

1. **AuthContext** (`context/AuthContext.tsx`)
   - ❌ Ancien système
   - ✅ Encore utilisé par Cart et Wishlist
   - ⚠️ Ne pas supprimer sans migration

2. **useAuthStore** (`stores/auth-store.ts`)
   - ✅ Nouveau système
   - ✅ Utilisé par Header et Admin
   - ✅ Synchronisé avec Supabase Auth

### Header utilisé : `components/site-header.tsx`

**IMPORTANT** : Il existe deux fichiers header :
- `components/header.tsx` - ❌ NON utilisé
- `components/site-header.tsx` - ✅ UTILISÉ par layout-wrapper

**Le SiteHeader DOIT utiliser `useAuthStore`** :

```typescript
import { useAuthStore } from '@/stores/auth-store';

export function SiteHeader() {
  const { user, profile, signOut } = useAuthStore();
  // ...
}
```

---

## 🗄️ BASE DE DONNÉES

### Structure de la table `profiles`

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL,
  first_name text DEFAULT '',
  last_name text DEFAULT '',
  phone text DEFAULT '',
  avatar_url text DEFAULT '',
  birth_date date,
  wallet_balance numeric(10,2) DEFAULT 0,
  is_admin boolean DEFAULT false,    -- ⚠️ Détermine le rôle
  blocked boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Points importants** :
- `first_name` et `last_name` (PAS `full_name`)
- `is_admin` détermine l'accès à `/admin`
- Types en TypeScript doivent correspondre

---

## 🎨 CONVENTIONS DE CODE

### Types Profile

```typescript
interface Profile {
  id: string;
  email: string | null;
  first_name: string | null;    // ⚠️ PAS full_name
  last_name: string | null;      // ⚠️ PAS full_name
  wallet_balance: number;
  created_at: string;
  is_admin?: boolean;
}
```

### Affichage du nom complet

```typescript
const displayName = profile?.first_name || profile?.last_name
  ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
  : user.email;
```

---

## 🔧 MODIFICATIONS COURANTES

### Ajouter un accès Admin à un composant

```typescript
import { useAuthStore } from '@/stores/auth-store';

function MyComponent() {
  const { isAdmin } = useAuthStore();

  if (!isAdmin) {
    return <div>Accès refusé</div>;
  }

  return <AdminContent />;
}
```

### Créer un compte Admin

```sql
-- Étape 1 : Utilisateur s'inscrit via /auth/register
-- Étape 2 : Mettre à jour son profil
UPDATE profiles
SET is_admin = true
WHERE email = 'email@example.com';
```

### Debug de l'authentification

Logs déjà présents dans `site-header.tsx` :

```typescript
useEffect(() => {
  console.log("🔍 SiteHeader - État Auth:", {
    user: user?.email,
    profile: profile ? {
      first_name: profile.first_name,
      last_name: profile.last_name,
      is_admin: profile.is_admin
    } : null
  });
}, [user, profile]);
```

---

## 📁 FICHIERS CRITIQUES

| Fichier | Rôle | Modifier ? |
|---------|------|-----------|
| `lib/supabase.ts` | Credentials hardcodés | ❌ NON |
| `.env` | Variables d'environnement | ❌ NON |
| `stores/auth-store.ts` | Store authentification | ✅ OUI (avec précaution) |
| `components/site-header.tsx` | Header principal | ✅ OUI |
| `components/layout-wrapper.tsx` | Initialisation | ✅ OUI |
| `.bolt/PROJECT-LOCK.json` | Verrou projet | ❌ NON |

---

## 🚨 ERREURS COURANTES À ÉVITER

### ❌ Erreur 1 : Modifier le mauvais header
```typescript
// ❌ MAUVAIS - Ce fichier n'est pas utilisé
components/header.tsx

// ✅ BON - Ce fichier est utilisé
components/site-header.tsx
```

### ❌ Erreur 2 : Utiliser full_name
```typescript
// ❌ MAUVAIS
profile.full_name

// ✅ BON
`${profile.first_name} ${profile.last_name}`.trim()
```

### ❌ Erreur 3 : Mélanger les systèmes d'auth
```typescript
// ❌ MAUVAIS - Mélange AuthContext et useAuthStore
const { user } = useAuth();
const { profile } = useAuthStore();

// ✅ BON - Utiliser un seul système
const { user, profile } = useAuthStore();
```

### ❌ Erreur 4 : Oublier l'initialisation
```typescript
// ❌ MAUVAIS - Store non initialisé
// L'authentification ne sera jamais détectée

// ✅ BON - Dans layout-wrapper.tsx
useEffect(() => {
  initializeAuth();
}, [initializeAuth]);
```

---

## 📊 VÉRIFICATIONS POST-MODIFICATION

Après toute modification sur l'authentification :

1. ✅ Build réussi (`npm run build`)
2. ✅ Aucune erreur TypeScript
3. ✅ Script de vérification OK (`./.bolt/verify-project.sh`)
4. ✅ Logs console présents (`🔍 SiteHeader - État Auth:`)
5. ✅ Menu utilisateur s'affiche correctement
6. ✅ Lien Admin visible pour les admins

---

## 🔍 RESSOURCES

- **Documentation système auth** : `.bolt/AUTHENTICATION-SYSTEM.md`
- **Guide création admin** : `.bolt/CREATE-ADMIN-ACCOUNT.md`
- **Diagnostic résolu** : `.bolt/DIAGNOSTIC-RESOLUTION.md`
- **Verrou projet** : `.bolt/PROJECT-LOCK.json`

---

## ✅ CHECKLIST AVANT COMMIT

- [ ] Script de vérification exécuté
- [ ] Build réussi
- [ ] Types TypeScript corrects
- [ ] Console logs ajoutés si debug nécessaire
- [ ] Documentation mise à jour
- [ ] Projet toujours sur qcqbtmv

---

**⚠️ EN CAS DE DOUTE, TOUJOURS VÉRIFIER LE PROJET ACTIF !**

```bash
./.bolt/verify-project.sh
```

Si échec → **NE PAS CONTINUER** et restaurer depuis le dernier état valide.

---

**Dernière mise à jour** : 2026-01-06
**Statut** : ✅ Système opérationnel
**Projet** : qcqbtmvbvipsxwjlgjvk
