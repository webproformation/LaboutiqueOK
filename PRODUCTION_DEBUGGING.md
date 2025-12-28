# 🚨 DEBUGGING EN PRODUCTION

## DIAGNOSTIC DU PROBLÈME ACTUEL

### Symptômes observés
- ❌ Erreur 500 sur `/api/invoices`
- ❌ Erreur 500 sur `/api/woocommerce/categories`
- ❌ Les catégories ont disparu dans `/admin/categories-management`

### Cause racine
Les variables d'environnement sur Vercel pointent encore vers l'ancienne instance Supabase `hondlefoprhtrpxnumyj` au lieu de `ftgclacfleknkqbfbsbs`.

### Pourquoi cela cause des erreurs 500 ?
1. L'API `/api/woocommerce/categories` essaie de se connecter à Supabase
2. Elle pointe vers `hondlefoprhtrpxnumyj` (ancienne instance)
3. La table `woocommerce_categories_cache` n'existe PAS dans l'ancienne instance
4. Elle existe seulement dans la nouvelle instance `ftgclacfleknkqbfbsbs`
5. Résultat : erreur 500 car la table est introuvable

## 🎯 SOLUTION IMMÉDIATE

### 1️⃣ Vérifier quelle instance Vercel utilise

Allez sur cette URL pour voir quel Supabase est configuré :
```
https://laboutiquedemorgane.com/api/debug-env
```

Si vous voyez `"isCorrect": false`, c'est confirmé : Vercel utilise la mauvaise instance.

### 2️⃣ Mettre à jour les variables sur Vercel

**C'EST LA SEULE SOLUTION**. Modifier le fichier `.env` local ne suffit PAS car le site en production utilise les variables configurées sur Vercel.

#### Étapes précises :

1. **Connexion Vercel**
   - Allez sur https://vercel.com/dashboard
   - Sélectionnez votre projet

2. **Accéder aux variables**
   - Cliquez sur **Settings** (en haut)
   - Cliquez sur **Environment Variables** (menu gauche)

3. **Modifier les 3 variables critiques**

   Pour chaque variable, cliquez sur l'icône crayon (✏️) puis remplacez par la nouvelle valeur :

   **a) NEXT_PUBLIC_SUPABASE_URL**
   ```
   ANCIENNE : https://hondlefoprhtrpxnumyj.supabase.co
   NOUVELLE : https://ftgclacfleknkqbfbsbs.supabase.co
   ```

   **b) NEXT_PUBLIC_SUPABASE_ANON_KEY**
   ```
   ANCIENNE : eyJhbGc...hondlefoprhtrpxnumyj...
   NOUVELLE : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0Z2NsYWNmbGVrbmtxYmZic2JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMzA3NjUsImV4cCI6MjA4MDYwNjc2NX0.fZ_yi8opM3kQ4T-hCagMebTvM7spx7tIMZvaTBPBSe8
   ```

   **c) SUPABASE_SERVICE_ROLE_KEY**
   ```
   ANCIENNE : eyJhbGc...hondlefoprhtrpxnumyj...
   NOUVELLE : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0Z2NsYWNmbGVrbmtxYmZic2JzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTAzMDc2NSwiZXhwIjoyMDgwNjA2NzY1fQ.rpp3Na0D87yoXCTy5P0rNG4B3-n7LkPVyAh-yheoe6E
   ```

4. **Cocher les environnements**
   Pour chaque variable :
   - ✅ Production
   - ✅ Preview
   - ✅ Development

5. **SAUVEGARDER** chaque variable après modification

### 3️⃣ Redéployer l'application

**CRITIQUE** : Modifier les variables ne suffit pas, il faut REDÉPLOYER !

1. Allez dans l'onglet **Deployments**
2. Trouvez le dernier déploiement (celui en haut)
3. Cliquez sur les **3 points** (•••) à droite
4. Cliquez sur **Redeploy**
5. **IMPORTANT** : Décochez ❌ "Use existing Build Cache"
6. Cliquez sur **Redeploy** pour confirmer

### 4️⃣ Attendre le déploiement

Le déploiement prend environ 2-3 minutes. Vous pouvez suivre la progression en temps réel.

### 5️⃣ VÉRIFIER que c'est corrigé

Une fois le déploiement terminé :

**A. Hard Refresh du navigateur**
```
Windows/Linux : Ctrl + Shift + R
Mac : Cmd + Shift + R
```

**B. Tester l'API de debug**
```
https://laboutiquedemorgane.com/api/debug-env
```

Vous devriez voir :
```json
{
  "verdict": "✅ TOUTES LES VARIABLES SONT CORRECTES",
  "supabase": {
    "url": {
      "isCorrect": true
    },
    "anonKey": {
      "isCorrect": true
    },
    "serviceRoleKey": {
      "isCorrect": true
    }
  }
}
```

**C. Tester les catégories**
```
https://laboutiquedemorgane.com/admin/categories-management
```
Les catégories devraient s'afficher correctement.

**D. Vérifier la console (F12)**
- ✅ Aucune erreur 500 sur `/api/invoices`
- ✅ Aucune erreur 500 sur `/api/woocommerce/categories`
- ✅ Toutes les requêtes vont vers `ftgclacfleknkqbfbsbs.supabase.co`

## 🔍 COMMENT VÉRIFIER LES LOGS VERCEL

Si vous voulez voir exactement quelle est l'erreur :

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet
3. Cliquez sur l'onglet **Logs** (ou **Functions**)
4. Filtrez par **Errors**
5. Vous verrez l'erreur exacte, par exemple :
   ```
   relation "woocommerce_categories_cache" does not exist
   ```

Cela confirme que l'API essaie de lire une table qui n'existe pas dans l'ancienne instance.

## 📋 CHECKLIST DE RÉSOLUTION

- [ ] Les 3 variables sont mises à jour sur Vercel (vérifier avec l'icône ✏️)
- [ ] Les 3 environnements sont cochés pour chaque variable
- [ ] Les variables ont été SAUVEGARDÉES
- [ ] L'application a été REDÉPLOYÉE (sans cache)
- [ ] Le déploiement est terminé (statut "Ready")
- [ ] Hard refresh du navigateur effectué
- [ ] `/api/debug-env` affiche ✅
- [ ] `/admin/categories-management` affiche les catégories
- [ ] Console du navigateur sans erreur 500

## ⚠️ POURQUOI LE .ENV LOCAL NE SUFFIT PAS ?

Le fichier `.env` dans votre projet local est utilisé UNIQUEMENT pour le développement local (`npm run dev`).

Quand le site est en production sur Vercel :
- Vercel ne lit PAS le fichier `.env` de votre projet
- Vercel utilise les variables configurées dans **Settings → Environment Variables**
- C'est pour cela qu'il faut absolument les mettre à jour sur Vercel

## 🚀 APRÈS CORRECTION

Une fois les variables mises à jour et l'application redéployée, TOUT devrait fonctionner :
- ✅ Les catégories seront visibles
- ✅ Plus d'erreur 500
- ✅ Toutes les APIs fonctionneront
- ✅ La connexion Supabase sera correcte

---

**URGENT** - Ces étapes doivent être faites MAINTENANT pour que le site fonctionne en production.
