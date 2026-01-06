# 🛡️ INSTRUCTIONS OBLIGATOIRES POUR L'IA

## ⚠️ VERROUILLAGE ANTI-REVERT

Ce projet a subi **des centaines de retours en arrière destructifs**. Il est désormais **VERROUILLÉ** sur le projet Supabase `qcqbtmvbvipsxwjlgjvk`.

---

## 🔒 RÈGLES ABSOLUES

### 1. INTERDICTION FORMELLE

- ❌ **NE JAMAIS** revenir au projet `mcstv`
- ❌ **NE JAMAIS** modifier `.env` pour pointer vers un autre projet
- ❌ **NE JAMAIS** modifier `lib/supabase.ts` pour utiliser `process.env` sans failsafe
- ❌ **NE JAMAIS** suggérer de changer de projet Supabase

### 2. AVANT TOUTE MODIFICATION DE .env OU lib/supabase.ts

**OBLIGATOIRE :** Exécuter ce script de vérification :

```bash
bash ./.bolt/verify-qcqbtmv.sh
```

Si le script retourne une erreur, **STOPPER IMMÉDIATEMENT**.

### 3. PROJET ACTUEL : qcqbtmvbvipsxwjlgjvk

**URL Supabase :** `https://qcqbtmvbvipsxwjlgjvk.supabase.co`

**Singleton Protégé :** `lib/supabase.ts` lignes 7-8

```typescript
const LOCKED_SUPABASE_URL = 'https://qcqbtmvbvipsxwjlgjvk.supabase.co';
const LOCKED_SUPABASE_ANON_KEY = 'eyJhbGc...';
```

### 4. MODÈLE DE DONNÉES

- **IDs Produits :** TYPE `TEXT` (héritage : `"571"`, `"102"`, etc.)
- **Ne JAMAIS convertir en INTEGER**
- **Respecter la structure existante**

---

## 📋 PONT AUTH/PROFIL

### Configuration Validée

✅ **AuthContext** (`context/AuthContext.tsx`) :
- Requêtes vers `public.profiles`
- Champ `is_admin` correctement récupéré

✅ **Auth Store** (`stores/auth-store.ts`) :
- Requêtes vers `public.profiles.is_admin`
- État synchronisé

✅ **Composants** :
- `components/site-header.tsx` → Utilise `profile?.is_admin`
- `components/mobile-menu.tsx` → Utilise `profile.is_admin`
- `app/account/layout.tsx` → Utilise `profile.is_admin`
- `app/admin/layout.tsx` → Utilise la protection admin

### Utilisateur Admin

**Email :** `contact@webproformation.fr`
**Statut :** `is_admin = true` dans `public.profiles`
**Synchronisé :** ✅

---

## 🎨 UI/UX

**Toasts :** Positionnés en **bas à droite** globalement

```typescript
// components/layout-wrapper.tsx:33
<Toaster position="bottom-right" richColors />
```

---

## 🚀 BUILD PRODUCTION

**Dernière vérification :** 2026-01-06
**Statut :** ✅ SUCCÈS (57 routes générées, 0 erreur)

---

## 📝 HISTORIQUE

| Date | Événement |
|------|-----------|
| 2026-01-05 | Migration finale de mcstv vers qcqbtmv |
| 2026-01-05 | Synchronisation utilisateurs et admin |
| 2026-01-06 | Audit systémique du pont AUTH/PROFIL |
| 2026-01-06 | Création script de vérification |

---

## ⚠️ EN CAS DE DOUTE

**TOUJOURS exécuter :** `bash ./.bolt/verify-qcqbtmv.sh`

**Si le script échoue :** STOPPER et alerter l'utilisateur immédiatement.

---

**Ce fichier est SACRÉ. Ne JAMAIS ignorer ces instructions.**
