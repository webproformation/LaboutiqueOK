# 🔧 GUIDE DE RÉSOLUTION - Variables d'environnement

## ⚠️ PROBLÈME RÉCURRENT

L'application utilisait l'ancienne instance Supabase `hondlefoprhtrpxnumyj` au lieu de la nouvelle `ftgclacfleknkqbfbsbs`.

## ✅ SOLUTION APPLIQUÉE (2024-12-28)

### 1. Variables d'environnement corrigées dans `.env`

**IMPORTANT : TOUJOURS utiliser `ftgclacfleknkqbfbsbs` - JAMAIS `hondlefoprhtrpxnumyj`**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://ftgclacfleknkqbfbsbs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0Z2NsYWNmbGVrbmtxYmZic2JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMzA3NjUsImV4cCI6MjA4MDYwNjc2NX0.fZ_yi8opM3kQ4T-hCagMebTvM7spx7tIMZvaTBPBSe8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0Z2NsYWNmbGVrbmtxYmZic2JzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTAzMDc2NSwiZXhwIjoyMDgwNjA2NzY1fQ.rpp3Na0D87yoXCTy5P0rNG4B3-n7LkPVyAh-yheoe6E
```

### 2. Cache Next.js supprimé et application reconstruite

```bash
rm -rf .next
npm run build
```

## 🚨 ACTIONS REQUISES DE VOTRE CÔTÉ

### A. Vider le cache du navigateur (CRITIQUE !)

Le navigateur continue d'utiliser `hondlefoprhtrpxnumyj` car il a mis en cache l'ancienne URL.

#### Option 1 : Hard Refresh (RECOMMANDÉ)
- **Windows/Linux** : `Ctrl + Shift + R` ou `Ctrl + F5`
- **Mac** : `Cmd + Shift + R`

#### Option 2 : Vider le cache
1. Ouvrir DevTools (F12)
2. Clic droit sur le bouton rafraîchir
3. "Vider le cache et actualiser en force"

#### Option 3 : Mode Incognito
Tester dans une fenêtre de navigation privée

### B. Redémarrer le serveur Next.js

```bash
# Arrêter le serveur (Ctrl+C)
# Puis relancer :
npm run build
npm start
```

## 🔍 VÉRIFICATION

Après ces actions, ouvrez la console du navigateur (F12) :

- ✅ AUCUNE requête vers `hondlefoprhtrpxnumyj.supabase.co`
- ✅ TOUTES vers `ftgclacfleknkqbfbsbs.supabase.co`
- ✅ `/api/invoices` retourne 200

## 📝 PRÉVENTION FUTURE

1. Toujours vérifier `.env` avant de démarrer
2. Supprimer `.next` après changement de variables
3. Utiliser `node verify-env.js` pour vérifier
4. Se référer à `CRITICAL_ENV_CONFIG.md`

## ⚡ COMMANDES RAPIDES

```bash
# Vérifier les variables
node verify-env.js

# Nettoyer et reconstruire
rm -rf .next && npm run build

# Vérifier l'URL
grep NEXT_PUBLIC_SUPABASE_URL .env
```

---

**Date** : 2024-12-28
**Statut** : ✅ Fichier .env corrigé - En attente hard refresh navigateur
