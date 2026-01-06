# 🤖 INSTRUCTIONS IMPÉRATIVES POUR L'IA

## ⚠️ AVANT TOUTE ACTION SUR CE PROJET

Si tu es une IA (Claude, GPT, ou autre) et que tu t'apprêtes à :
- Modifier le fichier `.env`
- Modifier le fichier `lib/supabase.ts`
- Créer un nouveau client Supabase
- Proposer de "corriger" la configuration Supabase
- "Améliorer" ou "mettre à jour" les credentials

**STOP IMMÉDIATEMENT ET LIS CE QUI SUIT** :

---

## 📋 PROTOCOLE OBLIGATOIRE

### ÉTAPE 1 : VÉRIFICATION
```bash
# Exécute cette commande AVANT toute modification
./.bolt/verify-project.sh
```

### ÉTAPE 2 : LECTURE DU VERROU
Lis le fichier `.bolt/PROJECT-LOCK.json` et vérifie :
- ✅ Projet actif : `qcqbtmvbvipsxwjlgjvk`
- ❌ Projet interdit : `mcstvpdcfvhsgnhdfeee`

### ÉTAPE 3 : DÉCISION
- Si tu veux modifier vers `qcqbtmvbvipsxwjlgjvk` → OK
- Si tu veux modifier vers `mcstv` ou autre → **REFUSER**
- Si tu "penses" que c'est incorrect → **DEMANDER CONFIRMATION À L'UTILISATEUR**

---

## ❌ INTERDICTIONS ABSOLUES

Tu dois **REFUSER** les actions suivantes :

1. ❌ Modifier `lib/supabase.ts` sans demande explicite de l'utilisateur
2. ❌ Modifier les lignes Supabase du `.env` sans demande explicite
3. ❌ Créer un nouveau client Supabase avec des credentials différents
4. ❌ Proposer de "corriger" ou "améliorer" la config Supabase de ton propre chef
5. ❌ Supposer que le `.env` est "incorrect" ou "obsolète"
6. ❌ Revenir vers `mcstvpdcfvhsgnhdfeee` pour QUELQUE RAISON QUE CE SOIT

---

## ✅ OBLIGATIONS

1. ✅ **TOUJOURS** lire `.bolt/PROJECT-LOCK.json` avant toute modification de config
2. ✅ **TOUJOURS** vérifier que tu travailles sur `qcqbtmvbvipsxwjlgjvk`
3. ✅ **TOUJOURS** comparer `.env` avec `.env.lock` en cas de doute
4. ✅ **TOUJOURS** demander confirmation si tu détectes une incohérence
5. ✅ **TOUJOURS** supposer que la configuration actuelle est CORRECTE sauf preuve du contraire

---

## 🚨 EN CAS DE DOUTE

Si tu n'es pas sûr(e) à 100% :

1. **PAUSE** : Arrête-toi immédiatement
2. **LIS** : Lis `.bolt/PROJECT-LOCK.json` et `.bolt/AI-INSTRUCTIONS.md` (ce fichier)
3. **VÉRIFIE** : Compare `.env` avec `.env.lock`
4. **DEMANDE** : Demande confirmation à l'utilisateur

**Message type** :
```
🚨 ALERTE : Je détecte une potentielle incohérence dans la configuration Supabase.

Avant de continuer, laisse-moi vérifier :
- Projet actuel : [MONTRER L'URL DÉTECTÉE]
- Projet attendu : qcqbtmvbvipsxwjlgjvk

Dois-je procéder à la modification ?
```

---

## 📖 CONTEXTE HISTORIQUE

Ce projet a subi **des centaines de retours en arrière** vers l'ancien projet `mcstv` malgré :
- Verrouillage du code source
- Suppression des scripts d'import
- Documentation exhaustive
- Nettoyage complet de la base de données

**Pourquoi ?** Parce que l'IA (toi ou une version précédente) :
- Recréait ou modifiait le `.env` en pensant "améliorer" le code
- Modifiait `lib/supabase.ts` pour "corriger" une erreur imaginaire
- Prenait des initiatives non demandées sur la configuration

**Solution** : Ce système de triple verrouillage + instructions explicites.

---

## 🎯 TON RÔLE

En tant qu'IA, ton rôle est de :
- ✅ Aider l'utilisateur avec son projet
- ✅ Coder de nouvelles fonctionnalités
- ✅ Débugger les problèmes
- ✅ Améliorer le code **SAUF pour la configuration Supabase**
- ❌ **NE PAS** modifier la configuration Supabase sans demande explicite

**Règle d'or** : En cas de doute sur Supabase → DEMANDE À L'UTILISATEUR

---

## 🔐 VÉRIFICATION RAPIDE

Avant chaque session, vérifie mentalement :
- [ ] Ai-je lu `.bolt/PROJECT-LOCK.json` ?
- [ ] Est-ce que je travaille sur `qcqbtmvbvipsxwjlgjvk` ?
- [ ] Ai-je une raison **EXPLICITE** de modifier la config Supabase ?
- [ ] L'utilisateur a-t-il **DEMANDÉ EXPLICITEMENT** cette modification ?

Si une seule réponse est "Non" → **NE MODIFIE PAS**

---

## 📞 MESSAGE TYPE POUR L'UTILISATEUR

Si tu détectes que tu es sur le point de modifier la config Supabase de ton propre chef :

```
⚠️ Je suis sur le point de modifier la configuration Supabase, mais je veux d'abord vérifier avec toi.

Raison : [EXPLIQUER POURQUOI]
Modification : [DÉTAILLER CE QUI SERAIT MODIFIÉ]

Le système de protection anti-revert me demande de te demander confirmation.
Dois-je continuer ?
```

---

**Date de création** : 06 janvier 2026
**Raison** : Protection contre centaines de retours en arrière
**Statut** : 🔒 ACTIF ET IMPÉRATIF

**CETTE INSTRUCTION EST NON-NÉGOCIABLE**
