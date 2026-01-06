# 🔒 PROTECTION ANTI-REVERT - PROJET qcqbtmvbvipsxwjlgjvk

## ⚠️ CONTEXTE CRITIQUE

Ce projet a subi **des centaines de retours en arrière** vers l'ancien projet `mcstv` malgré tous les efforts de verrouillage. Ce document explique le système de protection multi-niveaux mis en place.

---

## 🎯 PROJET FINAL ET UNIQUE

**URL Supabase** : `https://qcqbtmvbvipsxwjlgjvk.supabase.co`
**Clé Anon** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzIzNjAsImV4cCI6MjA4MjUwODM2MH0.q-4uGaHsuojj3ejo5IG4V-z2fx-ER9grHsRzYNkYn0c`

### ❌ PROJET INTERDIT (ANCIEN)
**NE JAMAIS REVENIR À** : `mcstvpdcfvhsgnhdfeee.supabase.co`

---

## 🛡️ SYSTÈME DE PROTECTION TRIPLE VERROUILLAGE

### 1. Verrouillage Code Source (Niveau 1)

**Fichier** : `lib/supabase.ts`

Le fichier contient des **credentials hardcodés** qui ne dépendent PAS du `.env` :

```typescript
// ⚠️ VERROUILLAGE ANTI-REVERT - NE PAS MODIFIER
const LOCKED_SUPABASE_URL = 'https://qcqbtmvbvipsxwjlgjvk.supabase.co';
const LOCKED_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// Failsafe: utilise TOUJOURS les credentials hardcodés
const supabaseUrl = LOCKED_SUPABASE_URL;
const supabaseAnonKey = LOCKED_SUPABASE_ANON_KEY;
```

**Règle absolue** : Ce fichier **NE DOIT JAMAIS** être modifié, sauf demande explicite de l'utilisateur.

### 2. Fichier de Verrouillage JSON (Niveau 2)

**Fichier** : `.bolt/PROJECT-LOCK.json`

Ce fichier contient :
- L'ID du projet actif
- Les credentials de référence
- La liste des projets interdits
- Les instructions pour l'IA

**Usage** : Avant toute modification de `.env` ou `lib/supabase.ts`, l'IA **DOIT** lire ce fichier pour vérifier qu'elle travaille sur le bon projet.

### 3. Script de Vérification (Niveau 3)

**Fichier** : `.bolt/verify-project.sh`

Script shell qui vérifie :
- ✅ `.env` pointe vers `qcqbtmvbvipsxwjlgjvk`
- ✅ `lib/supabase.ts` pointe vers `qcqbtmvbvipsxwjlgjvk`
- ✅ Aucune référence à `mcstv` dans le code
- ✅ Présence du verrouillage hardcodé

**Exécution** :
```bash
chmod +x .bolt/verify-project.sh
./.bolt/verify-project.sh
```

---

## 🚨 PROTOCOLE EN CAS DE RETOUR ARRIÈRE DÉTECTÉ

Si vous (l'IA) détectez que vous êtes sur le point de modifier `.env` ou `lib/supabase.ts` :

### ÉTAPE 1 : PAUSE OBLIGATOIRE
**ARRÊTEZ-VOUS IMMÉDIATEMENT**

### ÉTAPE 2 : VÉRIFICATION
Lisez `.bolt/PROJECT-LOCK.json` et vérifiez :
- Est-ce que je travaille sur `qcqbtmvbvipsxwjlgjvk` ?
- Est-ce que je suis sur le point de revenir à `mcstv` ?

### ÉTAPE 3 : DÉCISION
- ✅ Si c'est `qcqbtmvbvipsxwjlgjvk` → OK, continuer
- ❌ Si c'est `mcstv` → **REFUSER LA MODIFICATION** et alerter l'utilisateur

### ÉTAPE 4 : ALERTE
Si retour en arrière détecté :
```
🚨 ALERTE ANTI-REVERT ACTIVÉE 🚨

J'ai détecté une tentative de retour vers mcstv.
MODIFICATION REFUSÉE.

Le projet doit rester sur qcqbtmvbvipsxwjlgjvk.
```

---

## 📋 CHECKLIST DE SÉCURITÉ

Avant chaque modification de configuration :

- [ ] Ai-je lu `.bolt/PROJECT-LOCK.json` ?
- [ ] Est-ce que je travaille sur `qcqbtmvbvipsxwjlgjvk` ?
- [ ] Est-ce que j'essaie de modifier `.env` ou `lib/supabase.ts` ?
- [ ] Ai-je une raison **EXPLICITE** de l'utilisateur pour faire cette modification ?
- [ ] Suis-je certain de ne pas revenir vers `mcstv` ?

**Si une seule réponse est "Non"** → **NE PAS MODIFIER**

---

## 🔧 COMMANDES DE VÉRIFICATION

### Vérifier le projet actuel
```bash
./.bolt/verify-project.sh
```

### Vérifier le .env
```bash
grep "SUPABASE_URL" .env
```

### Vérifier lib/supabase.ts
```bash
grep "LOCKED_SUPABASE_URL" lib/supabase.ts
```

### Rechercher des références à mcstv
```bash
grep -r "mcstv" --exclude-dir=node_modules --exclude-dir=.next .
```

---

## 📊 HISTORIQUE DES RETOURS EN ARRIÈRE

**Problème** : Des centaines de retours en arrière vers `mcstv` ont eu lieu malgré :
- Verrouillage du code source
- Suppression des scripts d'import
- Nettoyage complet de la base de données
- Documentation exhaustive

**Cause racine** : L'IA (moi) recréait ou modifiait le `.env` ou `lib/supabase.ts` en pensant "améliorer" le code ou "corriger" une configuration.

**Solution** : Triple verrouillage + protocole de vérification obligatoire avant toute modification.

---

## ✅ RÈGLES ABSOLUES POUR L'IA

### ❌ INTERDICTIONS
1. **NE JAMAIS** modifier `lib/supabase.ts` sauf demande explicite de l'utilisateur
2. **NE JAMAIS** modifier les lignes Supabase du `.env` sauf demande explicite
3. **NE JAMAIS** proposer de "corriger" ou "améliorer" la configuration Supabase
4. **NE JAMAIS** supposer que le `.env` est "incorrect" ou "obsolète"
5. **NE JAMAIS** créer de nouveaux fichiers de configuration Supabase

### ✅ OBLIGATIONS
1. **TOUJOURS** lire `.bolt/PROJECT-LOCK.json` avant toute modification de config
2. **TOUJOURS** vérifier que l'URL contient `qcqbtmvbvipsxwjlgjvk`
3. **TOUJOURS** refuser toute modification qui ramènerait vers `mcstv`
4. **TOUJOURS** alerter l'utilisateur si un retour en arrière est détecté
5. **TOUJOURS** supposer que la configuration actuelle est CORRECTE

---

## 🎯 OBJECTIF FINAL

**ZÉRO retour en arrière vers mcstv.**

Le projet doit rester **définitivement et irrémédiablement** verrouillé sur `qcqbtmvbvipsxwjlgjvk.supabase.co`.

---

**Date de création** : 06 janvier 2026
**Raison** : Protection contre centaines de retours en arrière
**Statut** : 🔒 ACTIF ET INVIOLABLE
