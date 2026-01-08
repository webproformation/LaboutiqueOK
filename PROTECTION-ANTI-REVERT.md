# 🛡️ PROTECTION ANTI-REVERT - MODE D'EMPLOI

**Date de création** : 06 janvier 2026
**Projet protégé** : qcqbtmvbvipsxwjlgjvk (La Boutique de Morgane)
**Menace** : Retours en arrière répétés vers mcstvpdcfvhsgnhdfeee

---

## 🎯 OBJECTIF

**Empêcher à 100% tout retour en arrière vers l'ancien projet mcstv.**

---

## 🔐 ARCHITECTURE DE PROTECTION

### COUCHE 1 : HARDCODING (CRITIQUE) ✅

**Fichier** : `lib/supabase.ts`

**Protection** :
- ✅ Le code N'UTILISE PAS `process.env`
- ✅ Même si `.env` change, l'app reste sur qcqbtmv
- ✅ Protection **100% efficace**

**⚠️ RÈGLE D'OR** : **NE JAMAIS modifier lib/supabase.ts pour utiliser process.env**

---

## 🚨 QUE FAIRE EN CAS DE RETOUR ARRIÈRE ?

### Scénario A : .env modifié SEULEMENT

**Action** :
```bash
# Restaurer le .env (optionnel car l'app fonctionne)
cp .env.lock .env
```

**Urgence** : ⚠️ Faible

---

### Scénario B : lib/supabase.ts modifié

**Action URGENTE** :
```bash
# 1. Vérifier l'état
./.bolt/verify-qcqbtmv.sh

# 2. Restaurer le hardcoding manuellement
```

**Urgence** : 🚨 **CRITIQUE**

---

## 📋 CHECKLIST

```bash
# Vérifier l'état actuel
./.bolt/verify-qcqbtmv.sh
```

---

**Dernière mise à jour** : 2026-01-06
**Statut** : 🛡️ **MAXIMALE**
