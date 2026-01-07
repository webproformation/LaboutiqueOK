# 🛡️ SÉCURISATION DU PÉRIMÈTRE qcqbtmv

**Date de mise en place:** 2026-01-07
**Projet verrouillé:** qcqbtmvbvipsxwjlgjvk.supabase.co
**Interdiction absolue:** mcstvpdcfvhsgnhdfeee et tout autre projet

---

## 🔒 PROTECTIONS MISES EN PLACE

### 1. Verrouillage du fichier .env

Le fichier `.env` contient des commentaires d'avertissement explicites :

```bash
# ⚠️ VERROUILLAGE PROJET qcqbtmvbvipsxwjlgjvk - NE PAS MODIFIER
# INTERDICTION de revenir à mcstv ou tout autre projet
# Les IDs produits sont en TEXT (format WordPress: "571", "102", etc.)
```

**Action:** Toute modification nécessite le code de sécurité `FORCE-CHANGE-PROJECT`

### 2. Protection au niveau du code (lib/supabase.ts)

Deux niveaux de vérification ont été ajoutés :

#### Protection #1 : Vérification au démarrage
```typescript
if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL) {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!envUrl.includes('qcqbtmvbvipsxwjlgjvk')) {
    throw new Error(
      `🚨 ERREUR DE SÉCURITÉ: Tentative d'utilisation d'un projet non autorisé.`
    );
  }
}
```

**Effet:** L'application refuse de démarrer si l'URL ne contient pas `qcqbtmvbvipsxwjlgjvk`

#### Protection #2 : Vérification à l'instanciation
```typescript
function getSupabaseInstance(): SupabaseClient {
  if (!supabaseInstance) {
    if (!LOCKED_SUPABASE_URL.includes('qcqbtmvbvipsxwjlgjvk')) {
      throw new Error('🚨 ERREUR CRITIQUE: URL Supabase corrompue détectée');
    }
    // ... création de l'instance
  }
}
```

**Effet:** Double vérification avant chaque création d'instance Supabase

### 3. Script de vérification automatique

**Fichier:** `.bolt/verify-qcqbtmv.sh`

Le script vérifie :
- ✅ Que `.env` pointe sur qcqbtmv
- ✅ Qu'aucune référence à mcstv n'existe
- ✅ Que `lib/supabase.ts` est verrouillé sur qcqbtmv

**Exécution automatique:**
```json
"prebuild": "bash .bolt/verify-qcqbtmv.sh"
```

Le script s'exécute **automatiquement avant chaque build**. Si la vérification échoue, le build est interrompu.

**Exécution manuelle:**
```bash
npm run verify-project
```

### 4. Constantes hardcodées

Les URLs sont hardcodées dans le code :

```typescript
const LOCKED_SUPABASE_URL = 'https://qcqbtmvbvipsxwjlgjvk.supabase.co';
const LOCKED_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**Effet:** Même si le `.env` est modifié, le code utilise les valeurs hardcodées

---

## 📋 RÈGLES DE TYPE DE DONNÉES

**RAPPEL CRITIQUE:** Les IDs de produits et catégories sont de type **TEXT** (format WordPress)

```typescript
export type Product = {
  id: string;  // ← TEXT, pas UUID
  // ...
};

export type Category = {
  id: string;  // ← TEXT, pas UUID
  // ...
};
```

**Exemples d'IDs valides:**
- `"571"` (produit)
- `"102"` (catégorie)
- `"1234"` (tout ID numérique en string)

**INTERDICTION:** Toute tentative de conversion en UUID sur ces tables

---

## 🚨 PROCÉDURE D'URGENCE

### En cas de détection de corruption

1. **Arrêter immédiatement** toute modification de fichier
2. **Exécuter** le script de vérification :
   ```bash
   npm run verify-project
   ```
3. **Si échec**, restaurer le `.env` :
   ```bash
   cat > .env << 'EOF'
   NEXT_PUBLIC_SUPABASE_URL=https://qcqbtmvbvipsxwjlgjvk.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzIzNjAsImV4cCI6MjA4MjUwODM2MH0.q-4uGaHsuojj3ejo5IG4V-z2fx-ER9grHsRzYNkYn0c
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkzMjM2MCwiZXhwIjoyMDgyNTA4MzYwfQ.mFJHZV-VdueE_okBTqkVh18tRvee94a5Z-k5TM4FQxM
   EOF
   ```
4. **Ré-exécuter** la vérification

### Code de sécurité pour modification du .env

**IMPORTANT:** Toute modification du `.env` nécessite que la demande contienne explicitement le code :

```
FORCE-CHANGE-PROJECT
```

Sans ce code, **AUCUNE** modification de `NEXT_PUBLIC_SUPABASE_URL` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY` n'est autorisée.

---

## ✅ VÉRIFICATIONS QUOTIDIENNES

Avant toute session de travail, exécuter :

```bash
npm run verify-project
```

Résultat attendu :
```
==========================================
VÉRIFICATION PROJET qcqbtmvbvipsxwjlgjvk
==========================================

✅ .env pointe sur qcqbtmv
✅ Aucune référence à mcstv trouvée
✅ lib/supabase.ts verrouillé sur qcqbtmv

Configuration correcte:
NEXT_PUBLIC_SUPABASE_URL=https://qcqbtmvbvipsxwjlgjvk.supabase.co

==========================================
PROJET VERROUILLÉ SUR qcqbtmv
==========================================
```

Si ce message n'apparaît pas, **NE PAS CONTINUER**.

---

## 📊 RÉSUMÉ DES PROTECTIONS

| Protection | Niveau | État |
|------------|--------|------|
| `.env` commentaires | Visuel | ✅ |
| `.env` valeurs hardcodées | Code | ✅ |
| Vérification process.env | Runtime | ✅ |
| Vérification LOCKED_URL | Runtime | ✅ |
| Script verify-qcqbtmv.sh | Pre-build | ✅ |
| npm prebuild hook | Automatique | ✅ |
| Documentation CREATION-COMPTE-ADMIN.md | Référence | ✅ |
| Documentation PROTECTION-ANTI-REVERT.md | Référence | ✅ |

---

**PROTOCOLE D'INTÉGRITÉ ACTIVÉ**

Toute action sur le code doit commencer par :
```bash
npm run verify-project && npm run build
```

Si l'une des deux commandes échoue, arrêt immédiat.
