# 🔐 Système d'Authentification - La Boutique de Morgane

## 📋 Vue d'ensemble

Le système d'authentification est maintenant **PLEINEMENT ACTIF** et fonctionne avec :
- ✅ Zustand pour la gestion d'état globale
- ✅ Supabase Auth pour l'authentification
- ✅ RLS (Row Level Security) pour la sécurité des données
- ✅ Détection automatique du rôle Admin

---

## 🏗️ Architecture

### 1. **Store d'authentification** (`stores/auth-store.ts`)

Le store Zustand gère l'état global de l'authentification :

```typescript
interface AuthState {
  user: User | null;          // Utilisateur Supabase
  profile: Profile | null;    // Profil depuis la table profiles
  isAdmin: boolean;           // Détection automatique du rôle
  isLoading: boolean;         // État de chargement
  initialize: () => Promise<void>;  // Initialisation
  signOut: () => Promise<void>;     // Déconnexion
}
```

**Fonctionnalités clés** :
- Initialisation automatique au démarrage
- Écoute des changements d'état (`onAuthStateChange`)
- Synchronisation avec la table `profiles`
- Détection du rôle admin via `is_admin`

### 2. **Initialisation globale** (`components/layout-wrapper.tsx`)

Le store est initialisé au niveau racine de l'application :

```typescript
useEffect(() => {
  initializeAuth();
}, [initializeAuth]);
```

Cela garantit que l'état d'authentification est disponible partout dans l'application.

### 3. **Header dynamique** (`components/header.tsx`)

Le header réagit automatiquement à l'état d'authentification :

**Si déconnecté** :
- Icône User → Redirige vers `/auth/login`

**Si connecté** :
- Menu déroulant avec :
  - **Administration** (si Admin uniquement) 🛡️
  - Mon espace
  - Mes commandes
  - Ma liste de souhaits
  - Déconnexion (en rouge)

---

## 🗄️ Structure de la base de données

### Table `profiles`

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
  blocked_reason text,
  blocked_at timestamptz,
  cancelled_orders_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Champs importants** :
- `is_admin` : Détermine si l'utilisateur a accès à `/admin`
- `first_name` / `last_name` : Utilisés au lieu de `full_name`
- `wallet_balance` : Pour la cagnotte fidélité

### Sécurité RLS

```sql
-- Les utilisateurs peuvent lire leur propre profil
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

---

## 🔑 Flux d'authentification

### Connexion

1. L'utilisateur se connecte via `/auth/login`
2. Supabase Auth valide les credentials
3. `onAuthStateChange` déclenche une mise à jour du store
4. Le store récupère le profil depuis la table `profiles`
5. `isAdmin` est défini selon `profile.is_admin`
6. Le header se met à jour automatiquement

### Déconnexion

1. L'utilisateur clique sur "Déconnexion" dans le menu
2. `signOut()` est appelé depuis le store
3. L'état est réinitialisé : `user`, `profile`, `isAdmin` → `null/false`
4. Le header revient à l'état déconnecté

---

## 🛡️ Gestion des rôles

### Détection Admin

Le rôle admin est déterminé par le champ `is_admin` dans la table `profiles` :

```typescript
// Dans le store
if (profile) {
  set({ profile, isAdmin: profile.is_admin || false });
}
```

### Affichage conditionnel

Dans le header :

```tsx
{isAdmin && (
  <>
    <DropdownMenuItem asChild>
      <Link href="/admin" className="flex items-center gap-2">
        <Shield className="h-4 w-4" />
        Administration
      </Link>
    </DropdownMenuItem>
    <DropdownMenuSeparator />
  </>
)}
```

---

## 🔧 Utilisation dans les composants

### Accéder à l'état d'authentification

```typescript
import { useAuthStore } from '@/stores/auth-store';

function MyComponent() {
  const { user, profile, isAdmin, isLoading } = useAuthStore();

  if (isLoading) return <Loader />;
  if (!user) return <LoginPrompt />;

  return (
    <div>
      <p>Bonjour {profile?.first_name} !</p>
      {isAdmin && <AdminPanel />}
    </div>
  );
}
```

### Déconnexion

```typescript
const signOut = useAuthStore((state) => state.signOut);

<button onClick={signOut}>Se déconnecter</button>
```

---

## ⚠️ Points d'attention

### 1. **Compatibilité avec AuthContext**

Le projet utilise **DEUX systèmes** en parallèle :
- `AuthContext` (ancien système, utilisé par Cart et Wishlist)
- `useAuthStore` (nouveau système, utilisé par Header et Admin)

**Action future recommandée** : Migrer tout vers `useAuthStore` pour unifier.

### 2. **Champs first_name et last_name**

La table utilise `first_name` et `last_name` **séparément**, pas `full_name`.

Si vous avez besoin du nom complet :

```typescript
const fullName = profile
  ? `${profile.first_name} ${profile.last_name}`.trim()
  : '';
```

### 3. **Modification du rôle Admin**

Pour rendre un utilisateur Admin, mettez à jour directement dans Supabase :

```sql
UPDATE profiles
SET is_admin = true
WHERE email = 'admin@example.com';
```

---

## ✅ Checklist de vérification

- [x] Store d'authentification créé et configuré
- [x] Initialisation au niveau racine (LayoutWrapper)
- [x] Header dynamique avec détection de rôle
- [x] Menu Admin visible uniquement si `isAdmin = true`
- [x] Déconnexion fonctionnelle
- [x] Types mis à jour (`first_name`, `last_name`)
- [x] Build réussi sans erreurs

---

## 🚀 Prochaines étapes recommandées

1. **Tester la connexion** : Créer un compte et vérifier le menu
2. **Créer un admin** : Mettre `is_admin = true` pour un utilisateur test
3. **Tester l'accès Admin** : Vérifier que le lien "Administration" apparaît
4. **Migrer AuthContext** : Remplacer progressivement par `useAuthStore`

---

## 📞 Dépannage

### Le menu ne se met pas à jour après connexion

→ Vérifier que `initialize()` est bien appelé dans LayoutWrapper

### Le lien "Administration" n'apparaît pas

→ Vérifier que `is_admin = true` dans la table `profiles`

### Erreur "Cannot read property 'first_name' of null"

→ Le profil n'a pas été créé. Vérifier que la table `profiles` a une entrée pour l'utilisateur.

---

**Dernière mise à jour** : 2026-01-06
**Statut** : ✅ Système actif et fonctionnel
